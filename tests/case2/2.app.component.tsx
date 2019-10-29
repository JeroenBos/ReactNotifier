import * as React from 'react';
import { BaseProps, BaseState, IComponent } from '../../base.interfaces';
import { typesystem, CheckableTypes1 } from './2.typesystem';
import { BaseComponent, SimpleStateInfo } from '../../base.component';
import { MainWindowProps, MainWindowComponent, MainWindowState, MainWindowStateInfo } from './2.mainwindow.component';
import { PrimitiveTypes } from 'jbsnorro-typesafety';

export class AppComponent extends BaseComponent<AppProps, AppState, CheckableTypes1 & PrimitiveTypes> {
    constructor(props: AppProps) {
        super(props, typesystem, 'AppProps', 'AppState');
    }
    protected getInitialState(): Readonly<AppState> {
        return {
            window: null
        };
    }

    public get stateInfo(): SimpleStateInfo<AppProps> {
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
