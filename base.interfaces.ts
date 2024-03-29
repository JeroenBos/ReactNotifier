import { CommandParameter } from './commands/inputTypes';
import { CommandInstruction } from './commands/commandInstruction';
import { CommandManagerState, CommandManagerProps } from './commands/abstractCommandManager';
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

export interface IComponent<P extends BaseProps = BaseProps, S extends BaseState = BaseState> {
    state: Readonly<S>;
    props: Readonly<P>;
    readonly __id: number;
    setState<KState extends keyof S>(update: (prev: Readonly<S>, props: Readonly<P>) => (Pick<S, KState> | S | null)): void;
    assertIsValidState(item: any, requireAll: boolean): void;
    /** Has information about which properties on a component are state, and which are props. */
    // actually: while debuggin I notice that this state is being used for setting the isComponent boolean in a relation in the changes propagator
    // so it seems to indicate more whether it is a component than whether it's state or props?
    readonly stateInfo: SimpleStateInfo<P>;
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
/** null can be e.g. when sent from the window. */
export type Sender = Readonly<{ __id: number; } | Object> | null; // apparently this is not the same as Readonly<{ __id?: number; }>;

export interface ICommandManager extends IComponent<CommandManagerProps, CommandManagerState> {
    handleMouseMove(sender: Sender, e: React.MouseEvent): void;
    handleMouseClick(sender: Sender, e: React.MouseEvent): void;
    handleMouseDown(sender: Sender, e: React.MouseEvent): void;
    handleMouseUp(sender: Sender, e: React.MouseEvent): void;
    handleKeyDown(sender: Sender, e: React.KeyboardEvent): void;
    handleKeyUp(sender: Sender, e: React.KeyboardEvent): void

    executeCommandByNameIfPossible(commandName: string, sender: Sender, e?: CommandParameter): boolean | Promise<void>;
}
export interface IChangePropagator {
    open(initialization: Promise<any>): Promise<void>;
    /** Executes a command serverside. */
    executeCommand(commandInstruction: CommandInstruction): Promise<void>;
    register(newComponent: IComponent): Readonly<BaseState>;
    onClientsideCollectionChange(container: IComponent, collectionName: string, newItem: StateType, index: number): void;
    unregister(component: IComponent): void;
}