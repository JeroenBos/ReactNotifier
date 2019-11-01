import 'rxjs/add/operator/toPromise';
import { BaseState, ICommandManager, BaseProps, CommandManagerId, IComponent, IChangePropagator, Sender, isReference } from '../base.interfaces';
import { CommandInstruction } from './commandInstruction';
import { CommandBindingWithCommandName, CommandOptimization, CommandStateFactory, CommandViewModel as _CommandViewModel, OptimizationCanExecute } from './commands';
import { ConditionAST, FlagDelegate } from './ConditionAST'
import { CanonicalInputBinding, Kind } from './inputBindingParser';
import { InputEvent, CommandState, CommandParameter } from './inputTypes';
import { SimpleStateInfo } from '../base.component';

type CommandViewModel = _CommandViewModel<Sender, CommandParameter, CommandState>;


export class AbstractCommandManager implements ICommandManager, IComponent<CommandManagerProps, CommandManagerState> {
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

        (this as any).superSetState = this.setState;
        this.verifyProps(props);

        this._state = this.getInitialState(props);
        this._state = this.server.register(this) as Readonly<CommandManagerState>;
        verifyState(this._state);
    }

    /** The purpose of this property is to allow the ctor to access the abstract property 'defaultState'. */
    private getInitialState(_props: CommandManagerProps): Readonly<CommandManagerState> {
        return {
            flags: {},
            inputBindings: {},
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

    public add(viewModel: CommandViewModel): void {
        if (viewModel.name in this.commands)
            throw new Error(`The specified command view model with name '${viewModel.name}' already exists`);

        this.commands[viewModel.name] = viewModel;
    }
    public addCommandOptimization(commandName: string, command: CommandOptimization): void {
        if (commandName == null || commandName == '') {
            throw new Error('Invalid command name specified');
        }

        if (!this.hasCommand(commandName)) {
            this.commands[commandName] = { name: commandName };
        }
        this.commands[commandName].optimization = command;
    }
    public setEventArgPropagation(commandName: string, propagation: CommandStateFactory): void {
        if (commandName == null || commandName == '') {
            throw new Error('Invalid command name specified');
        }
        if (!this.hasCommand(commandName)) {
            this.commands[commandName] = { name: commandName };
        }

        this.commands[commandName].propagation = propagation;
    }
    public bind(commandName: string, inputBinding: CanonicalInputBinding, condition: string = "") {
        const commandBinding = this.commands[commandName];
        if (commandBinding === undefined) {
            throw new Error(`The command '${commandName}' is not registered at the command manager`);
        }

        const conditionAST = ConditionAST.parse(condition, this.flags);

        const hasExistingBindingForThisInput = inputBinding in this.inputBindings;
        if (!hasExistingBindingForThisInput) {
            this.inputBindings[inputBinding] = [];
        }
        this.inputBindings[inputBinding].push(new CommandBindingWithCommandName(commandName, conditionAST, inputBinding));

    }
    public hasCommand(name: string): boolean {
        return name in this.commands;
    }

    /**
      * 
      * @param e The argument to the command. Usually the event args, whose propagation can be stopped by the client side command.
      */
    public executeCommandByName(commandName: string, sender: Sender, e?: CommandParameter): void {
        const s = sender as { __id?: number };
        if (s.__id === undefined && this.commands[commandName] !== undefined && this.commands[commandName].optimization === undefined) {
            throw new Error('Cannot send a command to the server without a sender.id');
        }

        const executed = this.executeByNameIfPossible(commandName, s, e);
        if (!executed && this.hasCommand(commandName)) {
            console.warn(`The command '${commandName}' cannot execute on '${Object.getPrototypeOf(s).constructor.name}'(id=${s.__id})`);
        }
    }
    // public execute<TSender, TParameter, TState>(command: _CommandViewModel<TSender, TParameter, TState>, sender: TSender, parameter: TParameter) {
    // }
    public handleMouseMove(sender: Sender, e: React.MouseEvent): void {

        this.handle(CanonicalInputBinding.fromMouseMoveEvent(e), sender, e);
    }
    public handleMouseClick(sender: Sender, e: React.MouseEvent): void {
        // in javascript a mouse click is a left mouse button down and up event together, triggered at the moment of up event
        // for simplicity I simply trigger another kind of event, but I think the canonical input 'click' could be inferred from up and down events
        this.handle(CanonicalInputBinding.fromMouseEvent(e, Kind.Click), sender, e);
    }
    public handleMouseDown(sender: Sender, e: React.MouseEvent): void {
        this.handle(CanonicalInputBinding.fromMouseEvent(e, Kind.Down), sender, e);
    }
    public handleMouseUp(sender: Sender, e: React.MouseEvent): void {
        this.handle(CanonicalInputBinding.fromMouseEvent(e, Kind.Up), sender, e);
    }
    public handleKeyDown(sender: Sender, e: React.KeyboardEvent): void {
        this.handle(CanonicalInputBinding.fromKeyboardEvent(e, Kind.Down), sender, e);
    }
    public handleKeyUp(sender: Sender, e: React.KeyboardEvent): void {
        this.handle(CanonicalInputBinding.fromKeyboardEvent(e, Kind.Up), sender, e);
    }


    private handle(
        inputBinding: CanonicalInputBinding,
        sender: Sender,
        e: InputEvent): void {

        const commandNames = this.getCommandBindingsFor(inputBinding, sender, e);

        for (let i = 0; i < commandNames.length; i++) {

            const executed = this.executeByNameIfPossible(commandNames[0], sender, e);
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
    private getCommandBindingsFor(inputBinding: CanonicalInputBinding, sender: Sender, e: InputEvent): string[] {
        if (!(inputBinding in this.inputBindings))
            return [];

        const commandNames: string[] = [];

        this.inputBindings[inputBinding].forEach((binding: CommandBindingWithCommandName) => {
            const args = binding.commandName in this.commands ? this.getCommandArgs(this.commands[binding.commandName], sender, e) : undefined;
            if (binding.condition.toBoolean(sender, args)) {
                commandNames.push(binding.commandName);
            }
        });

        return commandNames;
    }

    public executeByNameIfPossible(commandName: string, sender: Sender, parameter: CommandParameter): boolean {
        if (!this.hasCommand(commandName)) {
            console.warn(`The command '${commandName}' does not exist`);
            return false;
        }
        const command = this.commands[commandName];
        return this.executeIfPossible(command, sender, parameter);
    }

    // parameter is the event in case this is a bound command, otherwise anything else. It is used to compute the command state, and that's it
    public executeIfPossible<TSender, TParameter, TState>(
        command: _CommandViewModel<TSender, TParameter, TState>,
        sender: TSender,
        parameter: TParameter
    ): boolean {
        const args = this.getCommandArgs(command, sender, parameter);
        if (command.condition !== undefined && ConditionAST.parse(command.condition, this.flags).toBoolean(sender, args)) {
            return false;
        }

        const sides = command.optimization == undefined ? OptimizationCanExecute.ServersideOnly : command.optimization.canExecute(sender, parameter, args);

        if ((sides & OptimizationCanExecute.ServersideOnly) != 0) {
            if (command.__id === undefined)
                console.warn(`Command '${command.name}' is not known at the server`);
            else {
                if (!isReference(sender))
                    throw new Error('Cannot send a command to the server without a sender.id');

                this.server.executeCommand(new CommandInstruction(command.name, sender.__id, args));
            }
        }

        if ((sides & OptimizationCanExecute.ClientsideOnly) != 0) {
            command.optimization!.execute(sender, parameter, args);
        }

        return sides != 0;
    }

    private getCommandArgs<TSender, TParameter, TCommandState>(
        command: _CommandViewModel<TSender, TParameter, TCommandState>,
        sender: TSender,
        e: TParameter
    ): TCommandState {
        const propagation = command.propagation;
        if (propagation === undefined) {
            return undefined!;
        }

        return propagation(sender, e);
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
    flags: Record<string, FlagDelegate>;
    commands: CommandsMap;
    inputBindings: Record<CanonicalInputBinding, CommandBindingWithCommandName[]>;
}

export type CommandsMap = Record<string, CommandViewModel>;