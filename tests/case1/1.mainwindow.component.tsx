import * as React from 'react';
import { BaseState, BaseProps } from '../../base.interfaces';
import { SimpleStateInfo, BaseComponent, StateInfoLocalHelper, TInfo } from '../../base.component';
import { typesystem } from './1.typesystem';

export interface MainWindowProps extends BaseProps {
    rootEquation: string;
}
export interface MainWindowState extends BaseState {
}

export class MainWindowComponent extends BaseComponent<MainWindowProps, MainWindowState> {

    constructor(props: MainWindowProps) {
        super(props, typesystem.verifyF('MainWindowProps'), typesystem.verifyF('MainWindowState'), typesystem.assertPartialF('MainWindowState'));
    }

    protected getInitialState() {
        return {};
    }
    public get stateInfo() {
        // {} means that none of the properties of MainWindowState have props. There are no properties on MainWindowState, so that's vacuously true
        return { rootEquation: true as true };
    };

    render(): React.ReactNode {
        return this.props.rootEquation;
    }
}

// Returns whether properties of app is state of app. By default, the key is treated as props. 
export const MainWindowStateInfo: TInfo<MainWindowProps, MainWindowState> = {
    rootEquation: true // rootEquation is props, so return true
};