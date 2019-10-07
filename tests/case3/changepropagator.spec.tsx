import * as React from 'react';
import 'jsdom-global/register';
import { Component, ReactElement } from 'react';
import { MountRendererProps, mount } from 'enzyme';
import container from '../../IoC/container';
import { SimpleStateInfo, BaseComponent, TInfo } from '../../base.component';
import { BaseProps, BaseState } from '../../base.interfaces';
import initializePredefinedResponsesContainer from './container';
import { ReactWrapper } from '../enzyme.wrapper';
import { MockCommandInstruction } from '../../IoC/defaults';
import { assert } from 'jbsnorro';
import { assert as assertT, IsExact } from 'jbsnorro-typesafety/typeHelper';

const rootId = 0;


describe('ChangesPropagator', () => {
    before(() => {
        initializePredefinedResponsesContainer([[]]);
    });
    beforeEach(() => container.resetAll());

    describe('EmptyRootComponent', () => {
        const emptyRootStateInfo: SimpleStateInfo<EmptyRootProps, EmptyRootState> = { __id: true as true };
        class EmptyRootComponent extends BaseComponent<EmptyRootProps, EmptyRootState> {
            constructor(props: EmptyRootProps) {
                super(props, typesystem.verifyF('EmptyRootProps'), typesystem.verifyF('EmptyRootState'), typesystem.assertPartialF('EmptyRootState'));
            }
            public get stateInfo() { return emptyRootStateInfo; }
            protected getInitialState(): Readonly<EmptyRootState> { return {}; };
            render() { return <div></div>; }
        }

        it('Can mount EmptyRootComponent', () => {
            mount(<EmptyRootComponent __id={rootId} />);
        });
    });

    describe('CounterRootComponent', () => {
        before(() => {
            initializePredefinedResponsesContainer([[{ propertyName: 'counter', id: 0, value: { currentCount: 2 } }]]);
        });
        const counterRootStateInfo: SimpleStateInfo<CounterRootProps, CounterRootState> = { counter: false as false };
        class CounterRootComponent extends BaseComponent<CounterRootProps, CounterRootState> {
            constructor(props: CounterRootProps) {
                super(props, typesystem.verifyF('CounterRootProps'), typesystem.verifyF('CounterRootState'), typesystem.assertPartialF('CounterRootState'));
            }
            public get stateInfo() { return counterRootStateInfo; }
            protected getInitialState(): Readonly<CounterRootState> { return { counter: { currentCount: 1 } } };
            render() { return <div></div>; }
        }

        it('Can mount CounterRootComponent', () => {
            const { state } = mountAndExtract<CounterRootComponent>(<CounterRootComponent __id={rootId} />);
            assert(state.counter.currentCount == 1);
        });

        it('Can update currentCount', async () => {
            const wrapper = mount<CounterRootComponent>(<CounterRootComponent __id={rootId} />);
            await executeNextCommand();
            const { state } = updateAndExtract<CounterRootComponent>(wrapper);
            assert(state.counter.currentCount == 2);
        });
    });

    describe('RootWithNestedCounterComponent', () => {
        const counterId = 2;
        before(() => {
            initializePredefinedResponsesContainer(
                [
                    [{ propertyName: 'counter', id: rootId, value: { __id: counterId } }], //register counter
                    [{ propertyName: 'currentCount', id: counterId, value: 1 }], // increment counter
                ]);
        });
        class RootWithNestedCounterComponent extends BaseComponent<RootWithNestedCounterProps, RootWithNestedCounterState> {
            constructor(props: RootWithNestedCounterProps) {
                super(props, typesystem.verifyF('RootWithNestedCounterProps'), typesystem.verifyF('RootWithNestedCounterState'), typesystem.assertPartialF('RootWithNestedCounterState'));
            }
            public get stateInfo() { return { 'counter': false as false }; }
            protected getInitialState(): Readonly<RootWithNestedCounterState> { return { counter: null }; }
            render() { return this.state.counter == null ? null : < CounterComponent __id={counterId} />; }
        }

        it('Can mount RootWithNestedCounter', () => {
            const { childState } = mountAndExtract<RootWithNestedCounterComponent, CounterProps, CounterState>(<RootWithNestedCounterComponent __id={rootId} />);
            assert(childState === undefined); // i.e. null was rendered
        });
        it('Can register counter on RootWithNestedCounter', async () => {
            const { wrapper } = mountAndExtract<RootWithNestedCounterComponent>(<RootWithNestedCounterComponent __id={rootId} />);
            await executeNextCommand(); // register counter at root
            const { childState } = updateAndExtract<RootWithNestedCounterComponent, CounterProps, CounterState>(wrapper);
            assert(childState.currentCount == 0); // default value
        });
        it('Can increment counter on RootWithNestedCounter', async () => {
            const { wrapper } = mountAndExtract<RootWithNestedCounterComponent, CounterProps, CounterState>(<RootWithNestedCounterComponent __id={rootId} />);
            await executeNextCommand(); // register counter at root
            await executeNextCommand(); // increment counter
            const { childState } = updateAndExtract<RootWithNestedCounterComponent, CounterProps, CounterState>(wrapper);
            assert(childState.currentCount == 1);
        });
    });

    describe('RootWithNestedCounterFromPropsComponent', () => {
        const counterId = 2;
        before(() => {
            initializePredefinedResponsesContainer(
                [
                    [{ propertyName: 'counter', id: rootId, value: { __id: counterId, currentCountProp: 1 } }], // register counter
                    [{ propertyName: 'currentCount', id: counterId, value: 2 }], // increment counter directly on state
                    [{ propertyName: 'currentCountProp', id: counterId, value: 3 }], // increment counter via props
                ]);
                
        });
      
        class Root extends BaseComponent<RootWithNestedCounterProps, RootWithNestedCounterFromPropsState> {
            constructor(props: RootWithNestedCounterProps) {
                super(props, typesystem.verifyF('RootWithNestedCounterProps'), typesystem.verifyF('RootWithNestedCounterFromPropsState'), typesystem.assertPartialF('RootWithNestedCounterFromPropsState'));
            }
            public get stateInfo() { return { counter: CounterFromPropsComponent.StateInfo, stateCounter: true }; }
            protected getInitialState(): Readonly<RootWithNestedCounterFromPropsState> { return { counter: null, stateCounter: null }; }
            render() { return this.state.counter == null ? null : <CounterFromPropsComponent {...this.state.counter} />; }
        }

        it('Can mount RootWithNestedCounter', () => {
            const { childState } = mountAndExtract<Root, CounterFromProps, CounterState>(<Root __id={rootId} />);
            assert(childState === undefined); // i.e. null was rendered
        });
        it('Can register counter on RootWithNestedCounter', async () => {
            const { wrapper } = mountAndExtract<Root>(<Root __id={rootId} />);
            await executeNextCommand(); // register counter at root
            const { childState } = updateAndExtract<Root, CounterFromProps, CounterState>(wrapper);
            assert(childState.currentCount == 1);
        });
        it('Can increment counter on RootWithNestedCounter', async () => {
            const { wrapper } = mountAndExtract<Root, CounterFromProps, CounterState>(<Root __id={rootId} />);
            await executeNextCommand(); // register counter at root
            await executeNextCommand(); // increment counter
            const { childState } = updateAndExtract<Root, CounterFromProps, CounterState>(wrapper);
            assert(childState.currentCount == 2);
        });

        it('Can increment counter on RootWithNestedCounter via props', async () => {
            const { wrapper } = mountAndExtract<Root, CounterFromProps, CounterState>(<Root __id={rootId} />);
            await executeNextCommand(3);
            const { childState } = updateAndExtract<Root, CounterFromProps, CounterState>(wrapper);
            assert(childState.currentCount == 3);
        });
    });

    describe('RootWithNestedNestedCounterFromPropsComponent', () => {
        const nestedId = 2;
        const counterId = 3;
        const stateCounterId = 4;
        before(() => {
            initializePredefinedResponsesContainer(
                [
                    [{ propertyName: 'nestedComponent', id: rootId, value: { __id: nestedId } }], // register nested component
                    [{ propertyName: 'counter', id: nestedId, value: { __id: counterId, currentCountProp: 1 } }], // register counter component
                    [{ propertyName: 'currentCount', id: counterId, value: 2 }], // increment counter directly on state
                    [{ propertyName: 'currentCountProp', id: counterId, value: 3 }], // increment counter via props
                ]);
        });
        type S = RootWithNestedRootState;
        type P = RootWithNestedRootProps;
        class Root extends BaseComponent<P, S> {
            constructor(props: RootWithNestedCounterProps) {
                super(props, typesystem.verifyF('RootWithNestedRootProps'), typesystem.verifyF('RootWithNestedRootState'), typesystem.assertPartialF('RootWithNestedRootState'));
            }
            protected getInitialState(): Readonly<S> { return { nestedComponent: null }; }
            render() { return this.state.nestedComponent == null ? null : <NestedComponent __id={this.state.nestedComponent.__id} />; }
        }

        // copied from above
        class NestedComponent extends BaseComponent<RootWithNestedCounterProps, RootWithNestedCounterFromPropsState> {
            constructor(props: RootWithNestedCounterProps) {
                super(props, typesystem.verifyF('RootWithNestedCounterProps'), typesystem.verifyF('RootWithNestedCounterFromPropsState'), typesystem.assertPartialF('RootWithNestedCounterFromPropsState'));
            }
            protected getInitialState(): Readonly<RootWithNestedCounterFromPropsState> { return { counter: null, stateCounter: null }; }
            render() {
                const counter = this.state.counter == null ? null : <CounterFromPropsComponent key='a' {...this.state.counter} />;
                const stateCounter = this.state.stateCounter == null ? null : <CounterComponent key='b' {...this.state.stateCounter} />;
                return [counter, stateCounter];
            }
        }

        it('Can mount RootWithNestedCounter', () => {
            const { childState } = mountAndExtract<Root, RootWithNestedCounterProps, RootWithNestedCounterFromPropsState>(<Root __id={rootId} />);
            assert(childState === undefined); // i.e. null was rendered
        });
        it('Can register counter on RootWithNestedCounter', async () => {
            const { wrapper } = mountAndExtract<Root>(<Root __id={rootId} />);
            await executeNextCommand(); // register nested component at root
            const { child } = updateAndExtract<Root, RootWithNestedCounterProps, RootWithNestedCounterFromPropsState>(wrapper);
            assert(child.children().length == 0);
        });
        it('Can register counter on RootWithNestedCounter', async () => {
            debugger;
            const { wrapper } = mountAndExtract<Root>(<Root __id={rootId} />);
            await executeNextCommand(2); // register nested component at root and counter at nested component
            const grandChildState = updateAndExtract<Root>(wrapper);
            assert(grandChildState.grandChildState.currentCount == 1);
        });
        it('Can increment counter on RootWithNestedCounter', async () => {
            const { wrapper } = mountAndExtract<Root>(<Root __id={rootId} />);
            await executeNextCommand(3);
            const grandChildState: CounterState = updateAndExtract<Root>(wrapper).grandChildState;
            assert(grandChildState.currentCount == 2);
        });
        it('Can increment counter on RootWithNestedCounter via props', async () => {
            const { wrapper } = mountAndExtract<Root>(<Root __id={rootId} />);
            await executeNextCommand(4);
            const grandChildState: CounterState = updateAndExtract<Root>(wrapper).grandChildState;
            assert(grandChildState.currentCount == 3);
        });

        describe('nested stateCounter', () => {
            before(() => {
                initializePredefinedResponsesContainer(
                    [
                        [{ propertyName: 'nestedComponent', id: rootId, value: { __id: nestedId } }], // register nested component
                        [{ propertyName: 'stateCounter', id: nestedId, value: { __id: stateCounterId } }], // register state counter component
                        [{ propertyName: 'currentCount', id: stateCounterId, value: 2 }], // increment counter directly on state
                    ]);
            });
            it('Can register counter on nested component', async () => {
                const { wrapper } = mountAndExtract<Root>(<Root __id={rootId} />);
                await executeNextCommand(2);
                const grandChildState: CounterState = updateAndExtract<Root>(wrapper).grandChildState;
                assert(grandChildState.currentCount == 0);
            });
            it('Can register counter on nested component', async () => {
                const { wrapper } = mountAndExtract<Root>(<Root __id={rootId} />);
                await executeNextCommand(2); // register nested component at root and counter at nested component
                const grandChildState: CounterState = updateAndExtract<Root>(wrapper).grandChildState;
                assert(grandChildState.currentCount == 1);
            });
            it('Can increment counter on nested component', async () => {
                const { wrapper } = mountAndExtract<Root>(<Root __id={rootId} />);
                await executeNextCommand(3);
                const grandChildState: CounterState = updateAndExtract<Root>(wrapper).grandChildState;
                assert(grandChildState.currentCount == 2);
            });
        });

        // TODO: test viewmodels/component pieces
    });
});

interface RootWithNestedRootProps extends BaseProps {
}

interface RootWithNestedRootState extends BaseState {
    nestedComponent: { __id: number } | null
}




interface EmptyRootProps extends BaseProps {
}
interface EmptyRootState extends BaseState {
}

interface CounterRootProps extends BaseProps {
}
interface CounterRootState extends BaseState {
    counter: { currentCount: number }
}


interface RootWithNestedCounterProps extends BaseProps {
}
interface RootWithNestedCounterState extends BaseState {
    counter: CounterProps | null;
}
interface RootWithNestedCounterFromPropsState extends BaseState {
    counter: CounterFromProps | null;
    stateCounter: CounterProps | null;


}


interface RootWithNestedCounterProps extends BaseProps {
}
interface RootWithNestedCounterState extends BaseState {
    counter: CounterProps | null;
}
interface RootWithNestedCounterFromPropsState extends BaseState {
    counter: CounterFromProps | null;
}



interface CounterProps extends BaseProps {
}
interface CounterState {
    currentCount: number;
}
interface CounterFromProps extends BaseProps {
    currentCountProp: number;
}
class CounterComponent extends BaseComponent<CounterProps, CounterState> {
    constructor(props: CounterProps) {
        super(props, typesystem.verifyF('CounterProps'), typesystem.verifyF('CounterState'), typesystem.assertPartialF('CounterState'));
    }
    public get stateInfo() { return { currentCount: false as false }; }
    protected getInitialState(): Readonly<CounterState> { return { currentCount: 0 }; }
    render() { return <div></div>; }
}
class CounterFromPropsComponent extends BaseComponent<CounterFromProps, CounterState> {
    constructor(props: CounterFromProps) {
        super(props, typesystem.verifyF('CounterFromProps'), typesystem.verifyF('CounterState'), typesystem.assertPartialF('CounterState'));
    }
    public get stateInfo() { return { currentCountProp: true as true, currentCount: false as false }; }
    protected getInitialState(props: Readonly<CounterFromProps>): Readonly<CounterState> {

        return { currentCount: props.currentCountProp };
    }
    render() { return <div></div>; }

    public static readonly StateInfo: SimpleStateInfo<CounterFromProps, CounterState>  = Object.freeze({ currentCountProp: true as true, currentCount: false as false });
}


export function mountAndExtract<C extends Component, P_Child = never, S_Child = never, P = C['props'], S = C['state']>(
    node: ReactElement<P>,
    options?: Omit<MountRendererProps, 'attachTo'>
): { wrapper: ReactWrapper<C, P, S>, state: S, props: P, childProps: P_Child, childState: S_Child } {
    const wrapper = mount<C, P, S>(node, options);
    return extract<C, P_Child, S_Child, P, S>(wrapper);
}
async function executeNextCommand(n: number = 1): Promise<void> {
    for (let i = 0; i < n; i++) {
        await container.server.executeCommand(MockCommandInstruction); // executes assignEquationToWindowResponse
    }
}

function updateAndExtract<C extends Component = Component, P_Child = never, S_Child = never, P = C['props'], S = C['state']>(wrapper: ReactWrapper<C, P, S>) {
    wrapper.update();
    return extract<C, P_Child, S_Child, P, S>(wrapper);
}
function extract<C extends Component, P_Child = never, S_Child = never, P = C['props'], S = C['state']>(wrapper: ReactWrapper<C, P, S>) {
    const state = wrapper.state();
    const props = wrapper.props();

    assert(wrapper.children().length <= 1);
    let childState: S_Child = undefined as any;
    let childProps: P_Child = undefined as any;
    let child: ReactWrapper<Component, P_Child, S_Child> = undefined as any;
    let grandChildState = undefined as any;
    let grandChildProps = undefined as any;
    let grandChild = undefined as any;
    if (wrapper.children().length == 1) {
        childState = wrapper.children().state();
        childProps = wrapper.children().props();
        child = wrapper.children();
        if (child.length == 1) {
            grandChildState = child.state();
            grandChildProps = child.props();
            grandChild = child.instance();
        }
    }
    return { wrapper, state, props, childState, childProps, child, grandChildState, grandChildProps, grandChild };
}



import { OptionalToMissing, createCreateFunction, PrimitiveTypes, TypeSystem, nullable, BaseTypeDescriptions, TypeDescriptionsFor } from 'jbsnorro-typesafety';
import { CommandManagerProps, CommandManagerState } from '../../commands/abstractCommandManager';

const create = <T extends object>() => createCreateFunction<CheckableTypes & PrimitiveTypes, T>();

export type CheckableTypes = OptionalToMissing<{
    'EmptyRootProps': EmptyRootProps,
    'EmptyRootState': EmptyRootState,
    'CounterRootProps': CounterRootProps,
    'CounterRootState': CounterRootState,
    'Counter': { currentCount: number },
    'nullable CounterProps': null | CounterProps,
    'CounterProps': CounterProps,
    'CounterState': CounterState,
    'RootWithNestedCounterProps': RootWithNestedCounterProps,
    'RootWithNestedCounterState': RootWithNestedCounterState,
    'CounterFromProps': CounterFromProps,
    'nullable CounterFromProps': CounterFromProps | null,
    'RootWithNestedCounterFromPropsState': RootWithNestedCounterFromPropsState,
    'RootWithNestedRootProps': RootWithNestedRootProps,
    'RootWithNestedRootState': RootWithNestedRootState,
    'CommandManagerProps': CommandManagerProps,
    'nullable CommandManagerProps': CommandManagerProps | null,
    'CommandManagerState': CommandManagerState,
}>

export class AllTypeDescriptions extends BaseTypeDescriptions implements TypeDescriptionsFor<CheckableTypes> {
    public readonly 'EmptyRootProps' = create<EmptyRootProps>()({ __id: 'number' });
    public readonly 'EmptyRootState' = create<EmptyRootState>()({});
    public readonly 'CounterRootProps' = create<CounterRootProps>()({ __id: 'number' });
    public readonly 'CounterRootState' = create<CounterRootState>()({ counter: 'Counter' });
    public readonly 'Counter' = create<{ currentCount: number }>()({ currentCount: 'number' });
    public readonly 'CounterProps' = create<CounterProps>()({ __id: 'number' });
    public readonly 'nullable CounterProps' = nullable(this['CounterProps']);
    public readonly 'CounterState' = create<CounterState>()({ currentCount: 'number' });
    public readonly 'RootWithNestedCounterProps' = create<RootWithNestedCounterProps>()({ __id: 'number' });
    public readonly 'RootWithNestedCounterState' = create<RootWithNestedCounterState>()({ counter: 'nullable CounterProps' });
    public readonly 'CounterFromProps' = create<CounterFromProps>()({ __id: 'number', currentCountProp: 'number' });
    public readonly 'nullable CounterFromProps' = nullable(this['CounterFromProps']);
    public readonly 'RootWithNestedCounterFromPropsState' = create<RootWithNestedCounterFromPropsState>()({ counter: 'nullable CounterFromProps', stateCounter: 'nullable CounterProps' });
    public readonly 'RootWithNestedRootProps' = this['EmptyRootProps'];
    public readonly 'RootWithNestedRootState' = create<RootWithNestedRootState>()({ nestedComponent: 'nullable CounterProps' });
    public readonly 'CommandManagerProps' = create<CommandManagerProps>()({ server: 'any!', __id: 'number' });
    public readonly 'nullable CommandManagerProps' = nullable(this['CommandManagerProps']);
    public readonly 'CommandManagerState' = create<CommandManagerState>()({ commands: 'any!', flags: 'any!', inputBindings: 'any!' });
}

export const typesystem = new TypeSystem<CheckableTypes & PrimitiveTypes>(new AllTypeDescriptions(), console.error);


type x = SimpleStateInfo<RootWithNestedCounterProps, RootWithNestedCounterFromPropsState>;
assertT<IsExact<x, { counter: TInfo<CounterFromProps, BaseState>, stateCounter: TInfo<CounterProps, BaseState> }>>(true);

assertT<IsExact<x['counter'], TInfo<CounterFromProps, BaseState>>>(true);
assertT<IsExact<x['counter'], { currentCountProp: true }>>(true);

type asdf = x['counter'];