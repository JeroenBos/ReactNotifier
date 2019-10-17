import 'rxjs/add/operator/toPromise';
import { BaseState, ICommandManager, BaseProps, CommandManagerId, IComponent, IChangePropagator } from '../base.interfaces';
import { CommandInstruction } from './commandInstruction';
import { CommandBindingWithCommandName, CommandOptimization, EventToCommandPropagation, DefaultEventArgPropagations, CommandViewModel } from './commands';
import { ConditionAST } from './ConditionAST'
import { CanonicalInputBinding, Kind } from './inputBindingParser';
import { InputEvent, CommandArgs } from './inputTypes';
import { SimpleStateInfo } from '../base.component';

export class AbstractCommandManager implements ICommandManager, IComponent<CommandManagerState> {
    isComponent(_propertyName: string | number): boolean {
        return false;
    }
    public readonly stateInfo: SimpleStateInfo<Omit<CommandManagerProps, 'server'>> = {};
    // public readonly stateInfo: SimpleStateInfo<AppState> = {
    // a list of properties of AppState that represents props. Of each such property K, we have a props type P and state type S
    // An entry should exist with name K and return true whenever a keyof P is specified
    // 
    // instructions:
    // for all properties/keys K in AppState that represents props P<K> = AppState[K]
    // add a function that returns true whenever an argument is specified that is a key of P<K>
    //
    // implementation:
    // all properties of AppState are: 'counter', 'app'
    // 'app' represents props
    // the keys of P = AppState['app'] are: '__id', 'rootEquation'.
    // Suppose that 'rootEquation' was part of MainWindowState instead of MainWindowProps, then P would have only contained '__id'
    // in this case (which we're doing for now), true should be returned only for '__id'
    //     
    // example implementation 2:
    // all properties of CommandManagerState are: flags, commands, inputBindings
    // out of these, none represent props, we we have {}, which they'll be set through CommandManager.setState(...)
    // };
    private static counter = 0;
    public readonly _uid = AbstractCommandManager.counter++;
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

        this._state = this._defaultState;
        this._state = this.server.register(this) as Readonly<CommandManagerState>;
        verifyState(this._state);
    }
    /** The purpose of this property is to allow the ctor to access the abstract property 'defaultState'. */
    private get _defaultState(): Readonly<CommandManagerState> {
        return {
            flags: new Map<string, boolean>(),
            inputBindings: new Map<CanonicalInputBinding, CommandBindingWithCommandName[]>(),
            commands: {}
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

    private readonly commandOptimizations = new Map<string, CommandOptimization>();
    private readonly commandEventPropagations = new Map<string, EventToCommandPropagation>();

    public optimizeCommandClientside(commandName: string, command: CommandOptimization) {
        if (commandName == null || commandName == '') {
            throw new Error('Invalid command name specified');
        }

        this.commandOptimizations.set(commandName, command);
    }
    public setEventArgPropagation(commandName: string, propagation: EventToCommandPropagation) {
        if (commandName == null || commandName == '') {
            throw new Error('Invalid command name specified');
        }
        if (!this.hasCommand(commandName)) {
            throw new Error(`No command with the name '${commandName}' exists`);
        }

        this.commandEventPropagations.set(commandName, propagation);
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
        return this.commands[name] !== undefined
            && !this.commandOptimizations.has(name); // if this is true, then only a clientside command exists.
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
    private getCommandBindingsFor(inputBinding: CanonicalInputBinding, sender: Readonly<BaseProps>, e: InputEvent): string[] {
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

    private executeCommandIfPossible(commandName: string, sender: IComponent, e?: InputEvent): boolean {

        const args = this.getEventArgs(commandName, sender.state, e);
        const serverSideExecuted = this.executeServersideCommandIfPossible(commandName, sender.props, args, e);
        const clientSideExecuted = this.executeClientsideCommandIfPossible(commandName, sender, args);

        return serverSideExecuted || clientSideExecuted;
    }
    private getEventArgs(commandName: string, sender: BaseState, e?: InputEvent): any {
        const propagation = this.commandEventPropagations.get(commandName);
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
    private executeServersideCommandIfPossible(commandName: string, sender: Readonly<BaseProps>, args: CommandArgs, e: InputEvent | undefined): boolean {

        const command = this.commands[commandName];
        if (command === undefined) {
            if (this.commandOptimizations.get(commandName) === undefined) {
                console.warn(`The command '${commandName}' does not exist`);
            }
            return false;
        }

        if (command.condition !== undefined && ConditionAST.parse(command.condition, this.flags).toBoolean(sender, e)) {
            return false;
        }

        this.server.executeCommand(new CommandInstruction(commandName, sender, args));
        return true;
    }
    private executeClientsideCommandIfPossible(commandName: string, sender: IComponent, args: CommandArgs): boolean {
        const command = this.commandOptimizations.get(commandName);
        if (command === undefined) {
            return false;
        }

        if (!command.canExecute(sender.state, args)) {
            return false;
        }
        sender.setState((prev, props) => {
            if (!command.canExecute(prev, args)) // can be true due to async nature of React 
            {
                console.warn(`The command '${commandName}' ultimately was not able to execute due to asynchronicity.`);
                return prev;
            }
            return command.execute(prev, args)
        });
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
}



export interface CommandManagerProps extends BaseProps {
    server: IChangePropagator;
}

export interface CommandManagerState extends BaseState {
    flags: Map<string, boolean>;
    commands: CommandsMap;
    inputBindings: Map<CanonicalInputBinding, CommandBindingWithCommandName[]>;
}


export interface CommandsMap {
    [s: string]: CommandViewModel;
}
