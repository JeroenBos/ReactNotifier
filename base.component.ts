import * as React from 'react';
import { GetKey } from 'jbsnorro-typesafety';
import { BaseState, BaseProps, IComponent } from './base.interfaces';
import container from './IoC/container';
import { identifiers } from './IoC/keys';
import { UncheckedOmit, assert } from 'jbsnorro';
import { TypeSystem, PrimitiveTypes } from 'jbsnorro-typesafety';
import { IsNotNever, NotNeverValues } from 'jbsnorro-typesafety/dist/types/typeHelper';


// The state info attribute has the following information:
// - it has two type parameters, P and S
// - for each attribute A on P ⋃ S
//   the state info has an attribute named A with value 
//      the state attribute                     if (P ⋃ S).A extends { __id: any }
//      A ∈ S                                   otherwise

export type StateFromProps<P> = {
};
/**
 * So for each prop on the props you specify `true`, even if you never want that property to be settable by the change propagator
 */
export type TInfo<P> = {
    [K in Exclude<keyof P, '__id'>]: NonNullable<P[K]> extends { __id: any } ? TInfo<NonNullable<P[K]>> : boolean
};


type typeSystemAssertion<T> = (x: T) => void;
type typeSystemAssertionPartial<T> = (x: Partial<T>) => void;
export type PotentialChildProps<S extends BaseState> = Partial<NotNeverValues<{
    [K in keyof S]: Exclude<S[K], null | undefined> extends BaseProps
    ? Exclude<keyof Partial<Exclude<S[K], null | undefined>>, '__id'>[]
    : never
}>>
class TError<TMessage extends string, T> {
}
export type PotentialChildObjects<S extends BaseState> = (keyof PotentialChildProps<S>)[]
export type SimpleStateInfo<P extends BaseProps> = Readonly<TInfo<P>>;// _SimpleStateInfo<P | S>;
type _SimpleStateInfo<S extends BaseState> = Partial<NotNeverValues<
    {
        [K in keyof S]: Exclude<S[K], null | undefined> extends BaseProps
        ? StateInfoLocalHelper<Exclude<S[K], null | undefined>, {/* state of the child component*/ }>
        : never
    }>>;
// this type helps creating a State info object, e.g. KatexEquationStateInfo, where if you specify P and S, you can see exactly what you can fill in
export type StateInfoLocalHelper<P, S> =
    IsNotNever<Extract<keyof P, keyof S>> extends true ? TError<'there is overlap between keys in props and state, namely:', keyof P & keyof S> : (
        {
            [K in keyof UncheckedOmit<P, 'children'>]: true
        } &
        {
            [K in keyof S]?: false | undefined // missing means it is part of state, i.e. doesn't have to be translated to a parent change
        }
    );

// export type InitialState<S> = { readonly [K in keyof S]: S[K] | MySpeci
export abstract class BaseComponent<TProps extends BaseProps, S extends BaseState, CheckableTypes extends PrimitiveTypes>
    extends React.Component<TProps, S>
    implements IComponent<S, TProps> {

    /*@inject(IoC.identifiers.server) private readonly serverProvider!: IProvider<ChangesPropagator>;
    @inject(IoC.identifiers.commandManager) private readonly commandManagerProvider!: IProvider<AbstractCommandManager>;
    private _server!: ChangesPropagator;
    private _commandManager!: AbstractCommandManager;
    public get commandManager(): AbstractCommandManager {
        return this._commandManager || (this._commandManager = this.commandManagerProvider.provide());
    }
    public get server(): ChangesPropagator {
        return this._server || (this._server = this.serverProvider.provide());
    }*/

    // didn't get DI to work, so I'm just hacking about:
    protected readonly server = container.server;
    protected readonly commandManager = container.commandManager;
    protected getTempId(): number {
        const idProvider = container.get(identifiers.tempIdProvider);
        return idProvider.next();
    }

    // properties on S can be primitive types (i.e. non-objects), objects or props
    // All properties on S that are not of primitive type can provide a usage description:
    // if you specify _null_ for a property that means it is an object, not props, and all its properties and properties thereof (etc)
    // are set through the setState of the component that holds that property
    // alternatively, you can specify an array of subproperties. Doing so warrants the assumption that the named object is a component (with props and state)
    // The named subproperties will be treated _differently_, as in, not part of the props, but of the state.
    // Properties of props are lifted to a state property on the container component; properties of state are not lifted but remain to be set through
    // set state of the component to which the state belongs. The last is what happens if you name the property name

    // take 2:
    // this info given to the register function contains per state property the subproperties that are part of state of the subcomponent.
    // alternatively, it is assumed they're part of the props.
    // if you receive a change related to a VM with id=id, then you walk up the parent relationships until you encounter a component.
    // then you check once more, to see if that parent relationship with childname is mentioned in that info.
    // this info provided to register can only be provided for IComponents that register themselves,
    // and it could be seen as a function per subproperty determining whether that subproperty is in the state. 
    // let's say it is a function (string) => boolean which returns true if it is state, false if it is props. 
    // The absence of a function indicates that they're all props, i.e. that they should all be set via the setState of the current component.
    // is that different from a function returning false?


    private readonly verifyState: typeSystemAssertion<S>;
    private readonly verifyPartialState: typeSystemAssertionPartial<S>;
    public constructor(props: TProps,
        typesystem: TypeSystem<CheckableTypes>,
        propsTypeKey: GetKey<TProps, CheckableTypes>,
        stateTypeKey: GetKey<S, CheckableTypes>,
    ) {
        super(props);
        assert(props != undefined, `Argument 'props' is null or undefined`);
        assert(typesystem != undefined, `Argument 'typesystem' is null or undefined`);
        assert(propsTypeKey != undefined, `Argument 'propsTypeKey' is null or undefined`);
        assert(stateTypeKey != undefined, `Argument 'stateTypeKey' is null or undefined`);
        assert(typesystem.hasDescription(propsTypeKey), `Argument 'propsTypeKey':'${propsTypeKey}' is not a key in the specified type system`);
        assert(typesystem.hasDescription(stateTypeKey), `Argument 'propsTypeKey':'${stateTypeKey}' is not a key in the specified type system`);
        assert(this.stateInfo !== undefined, `'state info' is missing. You need to override it as getter: field assignment is too late'`);
        assert(this.getInitialState !== undefined, `'getInitialState' is missing. You need to override it: assignment is too late`);

        const verifyProps = typesystem.assertF(propsTypeKey as any);
        this.verifyState = typesystem.assertF(stateTypeKey as any);
        this.verifyPartialState = typesystem.isPartialF(stateTypeKey as any);

        verifyProps(props);
        this.state = this.getInitialState(props);
        if (this.state === undefined)
            console.warn('state was undefined. You need to override it as getter: field assignment is too late');
        this.state = this.server.register(this) as Readonly<S>; // server.register merges any changes with the default state
    }
    public get stateInfo(): SimpleStateInfo<TProps> {
        return { __id: true } as any;
    }
    // protected abstract get childProps(): PotentialChildProps<S>;
    // protected abstract get nonComponents(): PotentialChildObjects<S>;

    public get __id(): number {
        return this.props.__id;
    }
    public assertIsValidState(item: any, requireAllKeys: boolean): void {
        if (requireAllKeys) {
            this.verifyState(item);
        } else {
            this.verifyPartialState(item);
        }
    }

    public isComponent(propertyName: string | number): boolean {
        // you should return false for all viewmodels (i.e. non-component) children
        return true;
    }
    /**
     * The rule here is that subproperties can be components or objects it they have a __id. 
     * Initialization at null is standard in that case, otherwise, if it represents a component, the initialized value must be valid props (or via the render function at least).
     * Possibly UNINITIALIZED_ID can be used at __id
     */
    protected abstract getInitialState(props: Readonly<TProps>): Readonly<S>;
    UNSAFE_componentWillReceiveProps(nextProps: Readonly<TProps>) {
        if (this.props != nextProps)
            this.setState(() => this.getInitialState(nextProps));
    }
    componentDidMount() {
    }
    componentWillUnmount() {
        this.server.unregister(this);
    }

    public setState<K extends keyof S>(
        update: (prev: Readonly<S>, props: Readonly<TProps>) => (Pick<S, K> | S | null)
    ) {
        super.setState((prev: Readonly<S>, props: Readonly<TProps>) => {
            const newPartialState = update(prev, props) as Pick<S, K>;
            assert(newPartialState !== null, 'null state not implemented'); // don't know yet what to do when false
            this.verifyPartialState(newPartialState as Partial<S>); // Pick<T, ...> can always be converted to Partial<T>. Pick<T, K> is a specific Partial<T>
            return newPartialState;
        });
    }
    /**
     * Catches exceptions generated in descendant components. Unhandled exceptions will cause
     * the entire component tree to unmount.
     */
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error(error.name + ": " + error.message);
        throw error;
    }
}
