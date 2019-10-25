import { ConditionAST } from '../commands/ConditionAST';

describe('ConditionAST', () => {
    it('simple test', () => {
        const node = ConditionAST.parse('a && !b', { a: () => true, b: () => true })

        if (node === undefined) throw new Error();
    })
});