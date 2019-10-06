import * as React from 'react';
import { BaseProps, BaseState } from '../../base.interfaces';
import { typesystem } from './0.typesystem';
import { BaseComponent, SimpleStateInfo } from '../../base.component';

export class AppComponent extends BaseComponent<AppProps, AppState> {
    constructor(props: AppProps) {
        super(props, typesystem.verifyF('AppProps'), typesystem.verifyF('AppState'), typesystem.assertPartialF('AppState'));
    }
    protected get defaultState(): Readonly<AppState> {
        return {
            counter: null, // means nothing except that it is initialized at null (we don't know the __id anyway)
        };
    }

    public get stateInfo(): SimpleStateInfo<AppProps, AppState> {
        return {
            // counter is on state, so it is missing here
        };
    }
    isComponent(propertyName: string | number) {
        if (propertyName == 'counter')
            return false;
        return super.isComponent(propertyName);
    }

    render(): React.ReactNode {
        return (
            <div onClick={() => console.log('received click')} >
                <div key='count'>Current count: {this.state.counter === null ? '?' : this.state.counter.currentCount}</div>
            </div >
        );
    }
}
export interface AppProps extends BaseProps {
}
export interface AppState extends BaseState {
    counter: Counter | null;
    // app: MainWindowProps | null; // name is bound to name in C#
    // commandManager: CommandManagerProps | null;
}
// this does not represent props, because counter is not a component. It just represents a composite object
export interface Counter {
    __id: number;
    currentCount: number;
}