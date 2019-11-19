import { Sender } from "../base.interfaces";
import { CommandState } from '../commands/inputTypes';

export interface Booleanable {
    /**
     * 
     * @param sender
     * @param state If missing, it was triggered by code.
     */
    toBoolean(sender: Sender, state?: CommandState): boolean;
}

export type FlagDelegate = (sender: Sender, state: CommandState) => boolean;

export abstract class ConditionAST implements Booleanable {
    public static parse(expr: string, flags: Readonly<Record<string, FlagDelegate>>): Booleanable {
        expr = expr.trim();
        if (expr.length == 0)
            return Constant.True;

        const orNode = ConditionAST.parseBinary(expr, "||", Or, flags);
        if (orNode !== undefined)
            return orNode;

        const andNode = ConditionAST.parseBinary(expr, "&&", And, flags);
        if (andNode !== undefined)
            return andNode;

        if (expr.charAt(0) == "!") {
            return new Not(ConditionAST.parse(expr.substr(1), flags));
        }
        if (expr in flags) {
            // then the expression is simply a flag name
            return new Flag(expr, s => flags[s]);
        }

        throw new Error(`Could not parse '${expr}'`);
    }
    private static parseBinary(
        expr: string, // is assumed to be trimmed
        op: string,
        binaryASTNode: new (rhs: ConditionAST, lhs: ConditionAST) => ConditionAST,
        flags: Readonly<Record<string, FlagDelegate>>): ConditionAST | undefined {

        const orIndex = expr.indexOf(op);
        if (orIndex != -1) {
            const lhs = ConditionAST.parse(expr.substr(0, orIndex), flags);
            const rhs = ConditionAST.parse(expr.substr(orIndex + op.length), flags);
            return new binaryASTNode(lhs, rhs);
        }
        return undefined;
    }
    abstract toBoolean(sender: Sender, state: CommandState): boolean;
}
class And extends ConditionAST {

    public constructor(
        private readonly lhs: ConditionAST,
        private readonly rhs: ConditionAST) {
        super();
    }

    toBoolean(sender: Sender, state: CommandState): boolean {
        return this.lhs.toBoolean(sender, state) && this.rhs.toBoolean(sender, state);
    }
}
class Or extends ConditionAST {
    public constructor(
        private readonly lhs: ConditionAST,
        private readonly rhs: ConditionAST) {
        super();
    }

    toBoolean(sender: Sender, state: CommandState): boolean {
        return this.lhs.toBoolean(sender, state) && this.rhs.toBoolean(sender, state);
    }
}
class Not extends ConditionAST {
    public constructor(
        private readonly operand: ConditionAST) {
        super();
    }

    toBoolean(sender: Sender, state: CommandState): boolean {
        return !this.operand.toBoolean(sender, state);
    }
}
class Flag extends ConditionAST {
    public constructor(private readonly conditionName: string,
        private readonly getFlag: (conditionName: string) => FlagDelegate | undefined) {
        super();
    }

    toBoolean(sender: Sender, state: CommandState): boolean {
        const result = this.getFlag(this.conditionName);
        if (result === undefined) {
            throw new Error(`Flag '${this.conditionName}' was not found`);
        }
        return result(sender, state);
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