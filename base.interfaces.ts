import { InputEvent } from './commands/inputTypes';
import { CommandInstruction } from './commands/commandInstruction';
import { CommandManagerState } from './commands/abstractCommandManager';
import { StateType } from './changesPropagator/common';
import { SimpleStateInfo } from './base.component';

export interface BaseState {
}
export interface BaseProps {
    __id: number;
    //server: IChangePropagator;
    //commandManager: ICommandManager;
}

export function isReference(obj: any): obj is { __id: number } {
    return obj != null && typeof obj == 'object' && '__id' in obj;
}

export interface IComponent<TState extends BaseState = BaseState, TProps extends BaseProps = BaseProps> {
    state: Readonly<TState>;
    props: Readonly<TProps>;
    readonly __id: number;
    setState<KState extends keyof TState>(update: (prev: Readonly<TState>, props: Readonly<BaseProps>) => (Pick<TState, KState> | TState | null)): void;
    assertIsValidState(item: any, requireAll: boolean): void;
    /** Has information about which properties on a component are state, and which are props. */
    // actually: while debuggin I notice that this state is being used for setting the isComponent boolean in a relation in the changes propagator
    // so it seems to indicate more whether it is a component than whether it's state or props?
    readonly stateInfo: SimpleStateInfo<TProps>;
    isComponent(propertyName: string | number): boolean;
}
export namespace IComponent {
    export function id(component: IComponent): number {
        return component.__id;
    }
    export function toDebugString(component: IComponent): string {
        return `with id=${component.__id}`;
    }
}

export const UNINITIALIZED_ID = -1;
export const AppId = 0;
export const CommandManagerId = 1;
export type Sender = Readonly<{ id: number }>;

export interface ICommandManager extends IComponent<CommandManagerState> {
    handleMouseMove(sender: Sender, e: React.MouseEvent): void;
    handleMouseClick(sender: Sender, e: React.MouseEvent): void;
    handleMouseDown(sender: Sender, e: React.MouseEvent): void;
    handleMouseUp(sender: Sender, e: React.MouseEvent): void;
    handleKeyPress(sender: Sender, e: React.KeyboardEvent): void;
    handleKeyUp(sender: Sender, e: React.KeyboardEvent): void

    executeCommandByName(commandName: string, sender: Sender, e?: InputEvent): void;
}
export interface IChangePropagator {
    open(initialization: Promise<any>): void;
    /** Executes a command serverside. */
    executeCommand(commandInstruction: CommandInstruction): void;
    register(newComponent: IComponent): Readonly<BaseState>;
    onClientsideCollectionChange(container: IComponent, collectionName: string, newItem: StateType, index: number): void;
    unregister(component: IComponent): void;
}