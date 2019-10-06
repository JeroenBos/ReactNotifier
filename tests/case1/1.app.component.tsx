import * as React from 'react';
import { BaseProps, BaseState, IComponent } from '../../base.interfaces';
import { typesystem } from './1.typesystem';
import { BaseComponent, SimpleStateInfo } from '../../base.component';
import { MainWindowProps, MainWindowComponent, MainWindowState, MainWindowStateInfo } from './1.mainwindow.component';

export class AppComponent extends BaseComponent<AppProps, AppState> {
    private test = typesystem.verifyF('AppState');
    constructor(props: AppProps) {
        super(props, typesystem.verifyF('AppProps'), typesystem.verifyF('AppState'), typesystem.assertPartialF('AppState'));
    }
    protected get defaultState(): Readonly<AppState> {
        return {
            window: null
        };
    }

    public get stateInfo(): SimpleStateInfo<AppProps, AppState> {
        return {
            window: MainWindowStateInfo
        };
    }

    render(): React.ReactNode {
        const mainWindow = this.state.window ? <MainWindowComponent {...this.state.window} /> : <div></div>;
        return mainWindow;
    }
}

export interface AppProps extends BaseProps {
}
export interface AppState extends BaseState {
    window: MainWindowProps | null;
}
