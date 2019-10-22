import 'rxjs/add/operator/toPromise';
import { CanonicalInputBinding } from './inputBindingParser';
import { Booleanable } from './ConditionAST'
import { InputEvent, CommandArgs } from './inputTypes';
import { BaseState, Sender } from '../base.interfaces';

export interface CommandOptimization {
    canExecute(sender: Sender, e: InputEvent | undefined): OptimizationCanExecute;
    /** Returns the new state with the effect of this command. */
    execute(sender: Sender, e: InputEvent | undefined): void;
}

export interface CommandViewModel {
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
    optimization?: CommandOptimization;
    /**
     * An object/function that extracts command arguments from the event arg. 
     * The command args are serialized and passed to the serverside command, but also to the optimization.
     */
    propagation?: EventToCommandPropagation;
}


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
export enum DefaultEventArgPropagations {

}
export type EventToCommandPropagation = DefaultEventArgPropagations | ExplicitEventArgPropgation;
export namespace DefaultEventArgPropagations {
    export function IsInstanceOf(a: any): a is DefaultEventArgPropagations {
        return GetDefault(a) !== undefined;
    }
    export function GetDefault(a: DefaultEventArgPropagations): ExplicitEventArgPropgation {
        switch (a) {
            default:
                return <any>undefined;
        }
    }
}
export type ExplicitEventArgPropgation = (sender: Sender, clientsideEventArgs: InputEvent | undefined) => CommandArgs;