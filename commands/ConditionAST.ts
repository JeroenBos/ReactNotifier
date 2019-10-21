import { Sender } from "../base.interfaces";
import { InputEvent, CommandArgs } from '../commands/inputTypes';

export interface Booleanable {
    /**
     * 
     * @param sender
     * @param args If missing, it was triggered by code.
     */
    toBoolean(sender: Sender, args?: CommandArgs): boolean;
}

export abstract class ConditionAST implements Booleanable {
    public static parse(s: string, flags: Readonly<Record<string, boolean>>): Booleanable {
        s = s.trim();

        const firstOrIndex = s.indexOf("||");
        const firstAndIndex = s.indexOf("&&");

        if (firstOrIndex != -1 || firstAndIndex != -1) {
            const lhs = <ConditionAST>ConditionAST.parse(s.substr(0, firstOrIndex), flags);
            const rhs = <ConditionAST>ConditionAST.parse(s.substr(firstOrIndex + 2), flags);

            if (firstOrIndex != -1 && firstOrIndex < firstAndIndex) {
                return new Or(lhs, rhs);
            } else {
                return new And(lhs, rhs);
            }
        }
        if (s.charAt(0) == "!") {
            return new Not(<ConditionAST>ConditionAST.parse(s.substr(1), flags));
        }

        if (s in flags)
            return new Flag(s, s => flags[s]);

        throw new Error(`Could not parse '${s}'`);
    }
    abstract toBoolean(sender: Sender, e: CommandArgs): boolean;
}
class And extends ConditionAST {

    public constructor(
        private readonly lhs: ConditionAST,
        private readonly rhs: ConditionAST) {
        super();
    }

    toBoolean(sender: Sender, e: CommandArgs): boolean {
        return this.lhs.toBoolean(sender, e) && this.rhs.toBoolean(sender, e);
    }
}
class Or extends ConditionAST {
    public constructor(
        private readonly lhs: ConditionAST,
        private readonly rhs: ConditionAST) {
        super();
    }

    toBoolean(sender: Sender, e: CommandArgs): boolean {
        return this.lhs.toBoolean(sender, e) && this.rhs.toBoolean(sender, e);
    }
}
class Not extends ConditionAST {
    public constructor(
        private readonly operand: ConditionAST) {
        super();
    }

    toBoolean(sender: Sender, e: CommandArgs): boolean {
        return !this.operand.toBoolean(sender, e);
    }
}
class Flag extends ConditionAST {
    public constructor(private readonly conditionName: string,
        private readonly getFlag: (conditionName: string) => boolean | undefined) {
        super();
    }

    toBoolean(sender: Sender, e: CommandArgs): boolean {
        const result = this.getFlag(this.conditionName);
        if (result === undefined) {
            throw new Error(`Flag '${this.conditionName}' was not found`);
        }
        return result;
    }
}