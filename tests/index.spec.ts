import 'reflect-metadata';
import 'jsdom-global/register';
import * as ReactDOM from 'react-dom';
import 'mocha';
import '../IoC/initializeTestContainer'; // initializes the container with test dependencies

// the following makes debugging react so much easier, 
// because by default react catches errors (SILENTLY!!!) and then replays the event, and only then throws :S
if ((ReactDOM as any).dontReplayFailedUnitOfWork) {
    (ReactDOM as any).dontReplayFailedUnitOfWork();
} else {
    // throw new Error(`// I add this to line 19586 of react-dom.development.js:
    // // dontReplayFailedUnitOfWork: function () { replayFailedUnitOfWorkWithInvokeGuardedCallback = false },`);
}


import { configure } from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';
configure({ adapter: new Adapter() });

import './test.spec';
import './case0/0.spec';
import './case1/1.spec';
import './case2/2.spec';
import './case3/changepropagator.spec';
import './case3/commandmanager.spec';