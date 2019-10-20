import 'mocha';
import initializePredefinedResponsesContainer from './container';
import { executeNextCommand } from './changepropagator.spec';
import container from '../../IoC/container';

const commandManagerId = 1;
const commandsId = 5;
const commandId = 6;

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
        await executeNextCommand();
        if (commandManager.commands.c === undefined) throw new Error();
        if (commandManager.commands.c.name === undefined) throw new Error();
    });
});