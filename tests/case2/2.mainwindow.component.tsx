import * as React from 'react';
import { BaseState, BaseProps } from '../../base.interfaces';
import { SimpleStateInfo, BaseComponent, StateInfoLocalHelper } from '../../base.component';
import { typesystem } from './2.typesystem';
import { IsNever } from 'jbsnorro-typesafety/typeHelper';
import { IsExact } from 'jbsnorro-typesafety';

export interface MainWindowProps extends BaseProps {
}
export interface MainWindowState extends BaseState {
    rootEquation: string;
}

export class MainWindowComponent extends BaseComponent<MainWindowProps, MainWindowState> {

    constructor(props: MainWindowProps) {
        super(props, typesystem.verifyF('MainWindowProps'), typesystem.verifyF('MainWindowState'), typesystem.assertPartialF('MainWindowState'));
    }

    protected get defaultState() {
        return {
            rootEquation: ''
        };
    }
    public get stateInfo() {
        // {} means that none of the properties of MainWindowState have props. There are no properties on MainWindowState, so that's vacuously true
        return {};
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