import 'rxjs/add/operator/toPromise';
import { CanonicalInputBinding } from './inputBindingParser';
import { Booleanable } from './ConditionAST'
import { IsExact, TypeSystem } from 'jbsnorro-typesafety';
import { And, OptionalKeys } from 'jbsnorro-typesafety/dist/types/typeHelper';
import { IComponent, BaseState, BaseProps } from '../base.interfaces';

export type Reducer<K extends keyof S, S, P> = (prevState: Readonly<S>, props: Readonly<P>) => (Pick<S, K> | S | null);

export type OptimizationReturnType<C extends IComponent<P, S>, K extends keyof S, P extends BaseProps = C['props'], S extends BaseState = C['state']> = {
    serverside: boolean,
    reducer?: Reducer<K, S, P>,
    component?: C,
};

type OptionalParameters<TSender, TParameter, TState, TReturn> =
    And<[IsExact<TParameter, void>, IsExact<TState, void>]> extends true ? (sender: TSender) => TReturn
    : IsExact<TState, void> extends true ? (sender: TSender, args_e: TParameter) => TReturn
    : (sender: TSender, args_e: TParameter, state: TState) => TReturn;


export interface CommandOptimization<TSender = any, TParameter = void, TState = void> {
    /**
     * @param {(InputEvent | CommandParameter)} args_e Means parameter or e, i.e. e (=InputEvent) is regarded as parameter.
     */
    readonly canExecute: OptionalParameters<TSender, TParameter, TState, OptimizationCanExecute>;
    /**
     * Returns the new state with the effect of this command.
     * @param {(InputEvent | CommandParameter)} args_e Means parameter or e, i.e. e (=InputEvent) is regarded as parameter
     */
    readonly execute: OptionalParameters<TSender, TParameter, TState, void>;
}

export interface CommandViewModel<TSender = any, TParameter = void, TState = void> {
    /**
     * The id of this command. Presence means presence of a serverside complement, and vice versa.
     */
    __id?: number;
    /**
     * The name of this command.
     */
    name: string;
    /**
     * The conditions under which this command can be executed.
     * Neither the optimization nor serverside complement is run when the condition is not met.
     */
    condition?: string;
    /**
     * The fully-clientside execution command. If this command has no serverside complement then the optimization is the entire command;
     * otherwise they're run both: either the optimization is expected to produce the same or partially same results as by the server,
     * or the optimization can loading indicators.
     */
    optimization?: CommandOptimization<TSender, TParameter, TState>;
    /**
     * An object/function that extracts command state from the event arg. 
     * The command state is serialized and passed to the serverside command, but also to the optimization.
     */
    propagation?: IsExact<TState, void> extends true ? undefined : CommandStateFactory<TSender, TParameter, TState>;
}

export type OptimizedCommandViewModel<TSender = any, TParameter = void, TState = void> =
    MakeRequired<CommandViewModel<TSender, TParameter, TState>, 'optimization'>;

export class CommandBinding {
    public constructor(
        public readonly condition: Booleanable,
        public readonly input: CanonicalInputBinding) {
    }
}
export class CommandBindingWithCommandName {
    public constructor(public readonly commandName: string,
        public readonly condition: Booleanable,
        public readonly input: CanonicalInputBinding) {
    }
}
export enum OptimizationCanExecute {
    /** Indicates the associated command cannot be executed. 
     * The input that triggered this command will not be consumed. */
    False = 0,
    /** Indicates the client side optimization cannot execute, but the non-optimized form (server side) of the command can be executed.
     * The input that trigged this command will be consumed. */
    ServersideOnly = 1,
    /** Indicates no serverside command should be executed, only this client side 'optimization'. 
     * The input that trigged this command will be consumed. */
    ClientsideOnly = 2,
    /** Indicates the associated command can be executed. Both serverside and clientside. 
     * The input that trigged this command will be consumed. */
    True = ServersideOnly + ClientsideOnly,
}

export type CommandStateFactory<TSender = any, TParameter = undefined, TState = undefined> =
    IsExact<TParameter, void> extends true
    ? (sender: TSender) => TState
    : (sender: TSender, parameter_e: TParameter) => TState;
export const defaultCommandStateFactory: CommandStateFactory<any, any, undefined> = () => undefined;


export type MakeRequired<T, K extends OptionalKeys<T>> = T & { [k in K]-?: Exclude<T[K], undefined> }