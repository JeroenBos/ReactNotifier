import 'mocha';
import * as React from 'react';
import { mount } from 'enzyme';
import 'jsdom-global/register';
import { AppComponent, Counter } from './0.app.component';
import { AppId, CommandManagerId } from '../../base.interfaces';
import { identifiers } from '../../IoC/keys';
import { ReactWrapper } from '../enzyme.wrapper';
import { ITestResponse, MockCommandInstruction } from '../../IoC/defaults';
import { counterInitResponse, counterRefResponse, counterIncrementResponse, counterIncrementTwiceResponse } from '../responses';
import { typesystem } from './0.typesystem';
import container from '../../IoC/container';
import { assert } from 'jbsnorro';

///////////// initialization: /////////////
const rootIds: number[] = [AppId, CommandManagerId];
const responses: ITestResponse[] = [
    [counterRefResponse, counterInitResponse],
    [counterIncrementResponse],
    [counterIncrementTwiceResponse],
    []
]

///////////// tests: /////////////
describe('0. App { Counter }', () => {
    before(() => {
        container.rebind(identifiers.typesystem).toConstantValue(typesystem);
        container.rebind(identifiers.rootIds).toConstantValue(rootIds);
        container.rebind<ITestResponse[]>(identifiers.responses).toConstantValue(responses);
        container.assertIsFullyBound();
    });
    let app: ReactWrapper<AppComponent>;
    let counterState: Counter | null;
    beforeEach(async () => {
        container.resetAll();
        app = mount(<AppComponent __id={AppId} />);
        await container.server.executeCommand(MockCommandInstruction);
        app.update();
        counterState = app.state().counter;
    });

    it('All changes were propagated', () => {
        assert(!container.server.hasDanglingState);
    });

    it('Counter was initialized', () => {
        if (counterState == null)
            throw new Error();
        assert(counterState.currentCount === 0);
    });

    it('Increment counter command changes are propagated', async () => {
        await container.server.executeCommand(MockCommandInstruction); // executes increment command
        app.update();
        assert(!container.server.hasDanglingState);
        if (counterState == null)
            throw new Error();
        assert(counterState.currentCount === 1);
    });

    it('Increment counter command changes are propagated twice', async () => {
        await container.server.executeCommand(MockCommandInstruction); // executes increment command
        await container.server.executeCommand(MockCommandInstruction); // executes increment command
        app.update();
        assert(!container.server.hasDanglingState);
        if (counterState == null)
            throw new Error();
        assert(counterState.currentCount === 2);
    });

    it('Test empty changes set does nothing', async () => {
        await container.server.executeCommand(MockCommandInstruction); // executes increment command
        await container.server.executeCommand(MockCommandInstruction); // executes increment command
        await container.server.executeCommand(MockCommandInstruction); // executes nothing
        app.update();
        assert(!container.server.hasDanglingState);
        if (counterState == null)
            throw new Error();
        assert(counterState.currentCount === 2);
    });
});
