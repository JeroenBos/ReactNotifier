import 'rxjs/add/operator/toPromise';
import { CommandInstruction } from './commandInstruction';
import { CanonicalInputBinding } from './inputBindingParser';
import { Booleanable, ConditionAST } from './ConditionAST'
import { InputEvent, CommandArgs } from './inputTypes';
import { BaseState, Sender } from '../base.interfaces';

export interface CommandOptimization {
    canExecute(sender: Sender, e: CommandArgs): OptimizationCanExecute;
    /** Returns the new state with the effect of this command. */
    execute(sender: Sender, e: CommandArgs): BaseState;
}

export interface CommandViewModel extends BaseState {
    name: string;
    condition?: string | undefined;
    optimization?: CommandOptimization;
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
export type ExplicitEventArgPropgation = ((clientsideEventArgs: InputEvent | undefined) => CommandArgs);