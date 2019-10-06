import 'mocha';
import * as React from 'react';
import { mount } from 'enzyme';
import 'jsdom-global/register';
import { AppComponent, AppState } from './1.app.component';
import { AppId, CommandManagerId } from '../../base.interfaces';
import { isEmptyObject } from '../../core';
import { identifiers } from '../../IoC/keys';
import { ReactWrapper, wraps } from '../enzyme.wrapper';
import { ITestResponse, MockCommandInstruction } from '../../IoC/defaults';
import { mainWindowRefResponse, mainWindowInitResponseS } from '../responses';
import { MainWindowState, MainWindowProps, MainWindowComponent } from './1.mainwindow.component';
import { typesystem } from './1.typesystem';
import container from '../../IoC/container';
import { assert } from 'jbsnorro';

///////////// initialization: /////////////
const rootIds: number[] = [AppId, CommandManagerId];
const responses: ITestResponse[] = [[mainWindowRefResponse, mainWindowInitResponseS]];

///////////// tests: /////////////
describe('1. App ', () => {
    before(() => {
        container.rebind(identifiers.typesystem).toConstantValue(typesystem);
        container.rebind(identifiers.rootIds).toConstantValue(rootIds);
        container.rebind<ITestResponse[]>(identifiers.responses).toConstantValue(responses);
        container.assertIsFullyBound();
    });

    it('Window is initialized at null', () => {
        container.resetAll();
        const app: ReactWrapper<AppComponent> = mount(<AppComponent __id={AppId} />);
        const appState = app.instance().state;
        if (appState === null) throw new Error('appState === null');
        assert(appState.window === null, 'appState.window !== null');
    });

    describe('Populate window with equation as *props*', () => {
        const expectedEquation = 's';
        let appState: AppState;
        let windowProps: MainWindowProps | null;
        let windowState: MainWindowState;
        beforeEach(async () => {
            container.resetAll();
            const app = mount<AppComponent>(<AppComponent __id={AppId} />);
            await container.server.executeCommand(MockCommandInstruction);
            app.update();
            const window = app.childAt(0);
            if (!wraps<MainWindowComponent>(window, 'MainWindowComponent')) throw new Error('MainWindow expected');
            appState = app.instance().state;
            windowProps = window.props();
            windowState = window.instance().state;
        });

        it('All changes were propagated', () => {
            assert(!container.server.hasDanglingState);
        });

        it('The default root equation was set as state in app', () => {
            if (appState == null) throw new Error('appState == null');
            if (appState.window == null) throw new Error('appState.window == null');
            if (appState.window.rootEquation != expectedEquation) throw new Error(`'app.window.rootEquation != 's'`);
        });

        it('The default root equation was set as props in window', () => {
            if (windowProps == null) throw new Error('windowState == null');
            if (windowProps.rootEquation != expectedEquation) throw new Error(`window.rootEquation != 's'`);
        });

        it('State of the window is {}', () => {
            if (!isEmptyObject(windowState)) throw new Error('windowState !== {}');
        });
    });
});
