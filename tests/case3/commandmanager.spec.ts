import 'mocha';
import initializePredefinedResponsesContainer from './container';
import { rootId, executeNextCommand } from './changepropagator.spec';
import { AbstractCommandManager } from '../../commands/abstractCommandManager';
import container from '../../IoC/container';
import { typesystem } from '../case2/2.typesystem';

const commandManagerId = 0;
const commandsId = 1;
const commandId = 2;

describe('commandmanager', () => {
    before(() => {
        initializePredefinedResponsesContainer(
            [[
                { propertyName: 'commands', id: commandManagerId, value: { __id: commandsId } },
                { propertyName: 'c', id: commandsId, value: { __id: commandId } },
                { propertyName: 'name', id: commandId, value: 'c' }
            ]]);
    });

    it(`'command 'c' arrived correctly`, async () => {
        const commandManager = container.commandManager;
        debugger;
        await executeNextCommand();
        if (commandManager.commands.c !== undefined) throw new Error();
        if (commandManager.commands[0].name === undefined) throw new Error();
    });
});