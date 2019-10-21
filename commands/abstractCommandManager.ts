import 'rxjs/add/operator/toPromise';
import { BaseState, ICommandManager, BaseProps, CommandManagerId, IComponent, IChangePropagator } from '../base.interfaces';
import { CommandInstruction } from './commandInstruction';
import { CommandBindingWithCommandName, CommandOptimization, EventToCommandPropagation, DefaultEventArgPropagations, CommandViewModel } from './commands';
import { ConditionAST } from './ConditionAST'
import { CanonicalInputBinding, Kind } from './inputBindingParser';
import { InputEvent, CommandArgs } from './inputTypes';
import { SimpleStateInfo } from '../base.component';

export class AbstractCommandManager implements ICommandManager, IComponent<CommandManagerState> {
    private _state: CommandManagerState;
    public get state(): CommandManagerState {
        return this._state;
    }
    constructor(
        public readonly props: CommandManagerProps,
        private readonly verifyProps: (props: CommandManagerProps) => void,
        private readonly verifyState: (state: CommandManagerState) => void,
        private readonly verifyPartialState: (state: Partial<CommandManagerState>) => void
    ) {
        if (verifyProps == undefined) throw new Error(`Argument 'verifyProps' is null or undefined`);
        if (verifyState == undefined) throw new Error(`Argument 'verifyState' is null or undefined`);
        if (verifyPartialState == undefined) throw new Error(`Argument 'verifyPartialState' is null or undefined`);

        this.verifyProps(props);

        this._state = this.getInitialState(props);
        this._state = this.server.register(this) as Readonly<CommandManagerState>;
        verifyState(this._state);
    }

    /** The purpose of this property is to allow the ctor to access the abstract property 'defaultState'. */
    private getInitialState(_props: CommandManagerProps): Readonly<CommandManagerState> {
        return {
            flags: new Map<string, boolean>(),
            inputBindings: new Map<CanonicalInputBinding, CommandBindingWithCommandName[]>(),
            commands: {},
        };
    }
    public get flags() {
        return this.state.flags;
    }
    public get commands() {
        return this.state.commands;
    }
    public get inputBindings() {
        return this.state.inputBindings;
    }
    public get __id() {
        return this.props.__id;
    }
    public get server() {
        return this.props.server;
    }

    public addCommandOptimization(commandName: string, command: CommandOptimization) {
        if (commandName == null || commandName == '') {
            throw new Error('Invalid command name specified');
        }

        if (!this.hasCommand(commandName)) {
            this.commands[commandName] = { name: commandName };
        }
        this.commands[commandName].optimization = command;
    }
    public setEventArgPropagation(commandName: string, propagation: EventToCommandPropagation) {
        if (commandName == null || commandName == '') {
            throw new Error('Invalid command name specified');
        }
        if (!this.hasCommand(commandName)) {
            this.commands[commandName] = { name: commandName };
        }

        this.commands[commandName].propagation = propagation;
    }
    public bind(commandName: string, inputBinding: string, condition: string = "") {
        const commandBinding = this.commands[commandName];
        if (commandBinding === undefined) {
            throw new Error(`The command '${name}' is not registered at the command manager`);
        }

        const canonicalInput = CanonicalInputBinding.parse(inputBinding);
        const conditionAST = ConditionAST.parse(condition, this.flags);

        const hasExistingBindingForThisInput = this.inputBindings.has(canonicalInput);
        if (!hasExistingBindingForThisInput) {
            this.inputBindings.set(canonicalInput, []);
        }
        this.inputBindings.get(canonicalInput)!.push(new CommandBindingWithCommandName(commandName, conditionAST, canonicalInput));

    }
    public hasCommand(name: string): boolean {
        return name in this.commands;
    }

    /**
       * 
       * @param sender
       * @param commandName
       * @param e Optional event args, which is consumed if specified (i.e. propagation is stopped).
       */
    public executeCommandByName(commandName: string, sender: IComponent, e?: InputEvent): void {
        const executed = this.executeCommandIfPossible(commandName, sender, e);
        if (!executed && this.hasCommand(commandName)) {
            console.warn(`The command '${commandName}' cannot execute on '${Object.getPrototypeOf(sender).constructor.name}'(id=${sender.__id})`);
        }
    }
    public handleMouseMove(sender: IComponent, e: React.MouseEvent): void {

        this.handle(CanonicalInputBinding.fromMouseMoveEvent(e), sender, e);
    }
    public handleMouseClick(sender: IComponent, e: React.MouseEvent): void {
        // in javascript a mouse click is a left mouse button down and up event together, triggered at the moment of up event
        // for simplicity I simply trigger another kind of event, but I think the canonical input 'click' could be inferred from up and down events
        this.handle(CanonicalInputBinding.fromMouseEvent(e, Kind.Click), sender, e);
    }
    public handleMouseDown(sender: IComponent, e: React.MouseEvent): void {
        this.handle(CanonicalInputBinding.fromMouseEvent(e, Kind.Down), sender, e);
    }
    public handleMouseUp(sender: IComponent, e: React.MouseEvent): void {
        this.handle(CanonicalInputBinding.fromMouseEvent(e, Kind.Up), sender, e);
    }
    public handleKeyPress(sender: IComponent, e: React.KeyboardEvent): void {
        this.handle(CanonicalInputBinding.fromKeyboardEvent(e, Kind.Down), sender, e);
    }
    public handleKeyUp(sender: IComponent, e: React.KeyboardEvent): void {
        this.handle(CanonicalInputBinding.fromKeyboardEvent(e, Kind.Up), sender, e);
    }


    private handle(
        inputBinding: CanonicalInputBinding,
        sender: IComponent,
        e: InputEvent): void {

        const commandNames = this.getCommandBindingsFor(inputBinding, sender.props, e);

        for (let i = 0; i < commandNames.length; i++) {

            const executed = this.executeCommandIfPossible(commandNames[0], sender, e);
            if (executed) {
                e.stopPropagation();
                // decide here whether to invoke all executable bound commands, or merely the first one, or dependent on properties of InputEvent 
                break;
            }
        }

    }

    /**
     * Gets the names of the commands bound to the specified input, for which the binding condition is true.
     */
    private getCommandBindingsFor(inputBinding: CanonicalInputBinding, sender: Readonly<any>, e: InputEvent): string[] {
        const commandBindings = this.inputBindings.get(inputBinding);
        if (commandBindings === undefined) {
            return [];
        }

        const commandNames: string[] = [];

        commandBindings.forEach((binding: CommandBindingWithCommandName) => {
            if (binding.condition.toBoolean(sender, e)) {
                commandNames.push(binding.commandName);
            }
        });

        return commandNames;
    }

    private executeCommandIfPossible(commandName: string, sender: Readonly<any>, e?: InputEvent): boolean {
        if (!this.hasCommand(commandName)) {
            console.warn(`The command '${commandName}' does not exist`);
            return false;
        }

        const command = this.commands[commandName];
        const args = this.getEventArgs(command, sender.state, e);
        const serverSideExecuted = this.executeServersideCommandIfPossible(command, sender.props, args, e);
        const clientSideExecuted = this.executeClientsideCommandIfPossible(command, sender, args);

        return serverSideExecuted || clientSideExecuted;
    }

    private getEventArgs(command: CommandViewModel, sender: Readonly<any>, e?: InputEvent): any {
        const propagation = command.propagation;
        if (propagation === undefined) {
            return undefined;
        }

        if (DefaultEventArgPropagations.IsInstanceOf(propagation)) {
            return DefaultEventArgPropagations.GetDefault(propagation)(e);
        }
        else {
            return propagation(e);
        }
    }

    private executeServersideCommandIfPossible(command: CommandViewModel, sender: Readonly<BaseProps>, args: CommandArgs, e: InputEvent | undefined): boolean {
        if (command.condition !== undefined && ConditionAST.parse(command.condition, this.flags).toBoolean(sender, e)) {
            return false;
        }

        this.server.executeCommand(new CommandInstruction(command.name, sender, args));
        return true;
    }
    private executeClientsideCommandIfPossible(command: CommandViewModel, sender: Readonly<any>, args: CommandArgs): boolean {
        const optimization = command.optimization;
        if (optimization === undefined) {
            return false;
        }

        if (!optimization.canExecute(sender.state, args)) {
            return false;
        }

        optimization.execute(sender, args);
        return true;
    }

    // IComponent members
    setState(
        update: (prev: Readonly<CommandManagerState>, props: Readonly<CommandManagerProps>)
            => (Partial<CommandManagerState> | null) // Partial<CommandManagerState> is just a particular Pick<CommandManagerState, K>
    ): void {
        const newPartialState = update(this.state, this.props);
        this.verifyPartialState(newPartialState as Partial<CommandManagerState>);
        Object.assign(this._state, newPartialState); // Should this be deep assignment? What does react do?
        // in case React does shallow assignment (my expectation, but dunno), then update-call should return the entire subproperty when a subusbsubproperty is modified
    }
    assertIsValidState(item: any, requireAllKeys: boolean): void {
        if (requireAllKeys) {
            this.verifyState(item);
        } else {
            this.verifyPartialState(item);
        }
    }
    isComponent(_propertyName: string | number): boolean {
        return false;
    }
    public readonly stateInfo: SimpleStateInfo<CommandManagerProps> = {
        'server': false
    };
}



export interface CommandManagerProps extends BaseProps {
    server: IChangePropagator;
}

export interface CommandManagerState extends BaseState {
    flags: Map<string, boolean>;
    commands: CommandsMap;
    inputBindings: Map<CanonicalInputBinding, CommandBindingWithCommandName[]>;
}

export type CommandsMap = Record<string, CommandViewModel>;