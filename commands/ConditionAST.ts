import { Sender } from "../base.interfaces";
import { CommandArgs } from '../commands/inputTypes';

export interface Booleanable {
    /**
     * 
     * @param sender
     * @param args If missing, it was triggered by code.
     */
    toBoolean(sender: Sender, args?: CommandArgs): boolean;
}

export type FlagDelegate = (sender: Sender, args: CommandArgs) => boolean;

export abstract class ConditionAST implements Booleanable {
    public static parse(expr: string, flags: Readonly<Record<string, FlagDelegate>>): Booleanable {
        expr = expr.trim();
        if (expr.length == 0)
            return Constant.True;

        const firstOrIndex = expr.indexOf("||");
        const firstAndIndex = expr.indexOf("&&");

        if (firstOrIndex != -1 || firstAndIndex != -1) {
            const lhs = ConditionAST.parse(expr.substr(0, firstOrIndex), flags);
            const rhs = ConditionAST.parse(expr.substr(firstOrIndex + 2), flags);

            if (firstOrIndex != -1 && firstOrIndex < firstAndIndex) {
                return new Or(lhs, rhs);
            } else {
                return new And(lhs, rhs);
            }
        }
        if (expr.charAt(0) == "!") {
            return new Not(ConditionAST.parse(expr.substr(1), flags));
        }
        if (expr in flags) {
            // then the expression is simply a flag name
            return new Flag(expr, s => flags[s]);
        }

        throw new Error(`Could not parse '${expr}'`);
    }
    abstract toBoolean(sender: Sender, args: CommandArgs): boolean;
}
class And extends ConditionAST {

    public constructor(
        private readonly lhs: ConditionAST,
        private readonly rhs: ConditionAST) {
        super();
    }

    toBoolean(sender: Sender, args: CommandArgs): boolean {
        return this.lhs.toBoolean(sender, args) && this.rhs.toBoolean(sender, args);
    }
}
class Or extends ConditionAST {
    public constructor(
        private readonly lhs: ConditionAST,
        private readonly rhs: ConditionAST) {
        super();
    }

    toBoolean(sender: Sender, args: CommandArgs): boolean {
        return this.lhs.toBoolean(sender, args) && this.rhs.toBoolean(sender, args);
    }
}
class Not extends ConditionAST {
    public constructor(
        private readonly operand: ConditionAST) {
        super();
    }

    toBoolean(sender: Sender, args: CommandArgs): boolean {
        return !this.operand.toBoolean(sender, args);
    }
}
class Flag extends ConditionAST {
    public constructor(private readonly conditionName: string,
        private readonly getFlag: (conditionName: string) => FlagDelegate | undefined) {
        super();
    }

    toBoolean(sender: Sender, args: CommandArgs): boolean {
        const result = this.getFlag(this.conditionName);
        if (result === undefined) {
            throw new Error(`Flag '${this.conditionName}' was not found`);
        }
        return result(sender, args);
    }
}
class Constant extends ConditionAST {
    public static readonly True = Object.freeze(new Constant(true));
    public static readonly False = Object.freeze(new Constant(false));

    constructor(private readonly value: boolean) {
        super();
    }
    toBoolean(): boolean {
        return this.value;
    }
}