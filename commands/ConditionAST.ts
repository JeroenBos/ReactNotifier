import { Sender } from "../base.interfaces";
import { CommandParameter } from '../commands/inputTypes';
import { assert } from "jbsnorro";

export interface Booleanable {
    /**
     * 
     * @param sender
     * @param parameter If missing, it was triggered by code.
     */
    toBoolean(sender: Sender, parameter?: CommandParameter): boolean;
}

export type FlagDelegate = (sender: Sender, parameter: CommandParameter) => boolean;

export abstract class ConditionAST implements Booleanable {
    public static parse(expr: string, flags: Readonly<Record<string, FlagDelegate>>): ConditionAST {
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
    abstract toBoolean(sender: Sender, parameter: CommandParameter): boolean;
    /** Lists all flags in the specified condition, and their evaluations. */
    public static debug(condition: string | ConditionAST, flags: Readonly<Record<string, FlagDelegate>>, sender: Sender, parameter: CommandParameter): Record<string, boolean> {
        assert(typeof condition == 'string' || condition instanceof ConditionAST, `argument type error: condition (type = ${typeof condition}) should be of type string | ConditionAST`);
        const tree: ConditionAST = typeof condition == 'string' ? ConditionAST.parse(condition, flags) : condition;
        const result: Record<string, boolean> = {};
        tree.visit(node => {
            if (Flag.isFlag(node)) {
                result[node.conditionName] = node.toBoolean(sender, parameter);
            }
        });
        return result;
    }

    abstract visit(visitor: (node: ConditionAST) => void): void;
}
class And extends ConditionAST {

    public constructor(
        private readonly lhs: ConditionAST,
        private readonly rhs: ConditionAST) {
        super();
    }

    toBoolean(sender: Sender, parameter: CommandParameter): boolean {
        return this.lhs.toBoolean(sender, parameter) && this.rhs.toBoolean(sender, parameter);
    }

    visit(visitor: (node: ConditionAST) => void): void {
        visitor(this);
        this.lhs.visit(visitor);
        this.rhs.visit(visitor);
    }
}
class Or extends ConditionAST {
    public constructor(
        private readonly lhs: ConditionAST,
        private readonly rhs: ConditionAST) {
        super();
    }

    toBoolean(sender: Sender, parameter: CommandParameter): boolean {
        return this.lhs.toBoolean(sender, parameter) && this.rhs.toBoolean(sender, parameter);
    }

    visit(visitor: (node: ConditionAST) => void): void {
        visitor(this);
        this.lhs.visit(visitor);
        this.rhs.visit(visitor);
    }
}
class Not extends ConditionAST {
    public constructor(
        private readonly operand: ConditionAST) {
        super();
    }

    toBoolean(sender: Sender, parameter: CommandParameter): boolean {
        return !this.operand.toBoolean(sender, parameter);
    }

    visit(visitor: (node: ConditionAST) => void): void {
        visitor(this);
        this.operand.visit(visitor);
    }
}
class Flag extends ConditionAST {
    public constructor(public readonly conditionName: string,
        private readonly getFlag: (conditionName: string) => FlagDelegate | undefined) {
        super();
    }
    public static isFlag(node: ConditionAST): node is Flag {
        return (node as Flag).conditionName !== undefined && (node as Flag).getFlag !== undefined;
    }

    toBoolean(sender: Sender, parameter: CommandParameter): boolean {
        const result = this.getFlag(this.conditionName);
        if (result === undefined) {
            throw new Error(`Flag '${this.conditionName}' was not found`);
        }
        return result(sender, parameter);
    }

    visit(visitor: (node: ConditionAST) => void): void {
        visitor(this);
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

    visit(visitor: (node: ConditionAST) => void): void {
        visitor(this);
    }
}