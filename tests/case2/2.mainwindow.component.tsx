import * as React from 'react';
import { BaseState, BaseProps } from '../../base.interfaces';
import { BaseComponent, StateInfoLocalHelper } from '../../base.component';
import { typesystem, CheckableTypes1 } from './2.typesystem';
import { PrimitiveTypes } from 'jbsnorro-typesafety';

export interface MainWindowProps extends BaseProps {
}
export interface MainWindowState extends BaseState {
    rootEquation: string;
}

export class MainWindowComponent extends BaseComponent<MainWindowProps, MainWindowState, CheckableTypes1 & PrimitiveTypes> {

    constructor(props: MainWindowProps) {
        super(props, typesystem, 'MainWindowProps','MainWindowState');
    }

    protected getInitialState() {
        return {
            rootEquation: ''
        };
    }
    public get stateInfo() {
        // {} means that none of the properties of MainWindowState have props. There are no properties on MainWindowState, so that's vacuously true
        return { rootEquation: false as false};
    };
    
    render(): React.ReactNode {
        return this.state.rootEquation;
    }
}
// Returns whether properties of app is state of app. By default, the key is treated as props. 
export const MainWindowStateInfo: StateInfoLocalHelper<MainWindowProps, MainWindowState> = {
    __id: true, // means __id should be set through the parent of the mainwindow
    // any missing members are assumed to be state
};