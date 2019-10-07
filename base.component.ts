import * as React from 'react';
import { NotNeverValues, IsNotNever, assert as assertT } from 'jbsnorro-typesafety/typeHelper';
import { BaseState, BaseProps, IComponent, isReference } from './base.interfaces';
import container from './IoC/container';
import { TempIdProvider } from './tempIdProvider';
import { identifiers } from './IoC/keys';
import { ResettableContainer, UncheckedOmit, assert } from 'jbsnorro';
import { IsExact } from 'jbsnorro-typesafety';




// The state info attribute has the following information:
// - it has two type parameters, P and S
// - for each attribute A on P ⋃ S
//   the state info has an attribute named A with value 
//      the state attribute                     if (P ⋃ S).A extends { __id: any }
//      A ∈ S                                   otherwise

export type StateFromProps<P> = {
};
export type TInfo<P, S> = {
    [K in Exclude<keyof P, '__id' | keyof S>]: NonNullable<P[K]> extends { __id: any } ? TInfo<NonNullable<P[K]>, BaseState> : true
} & {
    [K in keyof S]: NonNullable<S[K]> extends { __id: any } ? TInfo<NonNullable<S[K]>, BaseState> : false
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
export type SimpleStateInfo<P extends BaseProps, S extends BaseState> = Readonly<TInfo<P, S>>;// _SimpleStateInfo<P | S>;
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
export abstract class BaseComponent<TProps extends BaseProps, S extends BaseState>
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

    public constructor(props: TProps,
        private readonly verifyProps: typeSystemAssertion<TProps>,
        private readonly verifyState: typeSystemAssertion<S>,
        private readonly verifyPartialState: typeSystemAssertionPartial<S>
    ) {
        super(props);

        if (verifyProps == undefined) throw new Error(`Argument 'verifyProps' is null or undefined`);
        if (verifyState == undefined) throw new Error(`Argument 'verifyState' is null or undefined`);
        if (verifyPartialState == undefined) throw new Error(`Argument 'verifyPartialState' is null or undefined`);
        if (this._stateInfo === undefined) throw new Error('state info is missing. You need to override it as getter: field assignment is too late');

        this.verifyProps(props);
        this.state = this._defaultState;
        if (this.state === undefined)
            console.warn('state was undefined. You need to override it as getter: field assignment is too late');
        this.state = this.server.register(this) as Readonly<S>; // server.register merges any changes with the default state
    }
    public get stateInfo(): SimpleStateInfo<TProps , S>  {
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

    /** The purpose of this property is to allow the ctor to access the abstract property 'defaultState'. */
    private get _defaultState(): Readonly<S> {
        return this.getInitialState(this.props);;
    }
    /** The purpose of this property is to allow the ctor to access the abstract property 'stateInfo'. */
    private get _stateInfo(): SimpleStateInfo<TProps, S> {
        return this.stateInfo;
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
        if (this.props !== nextProps)
            this.setState(() => this.getInitialState(nextProps));
    }
    componentDidMount() {
    }
    componentWillUnmount() {
        console.debug(`unmounting ${Object.getPrototypeOf(this).constructor.name}`);
        this.server.unregister(this);
    }

    public setState<K extends keyof S>(
        update: (prev: Readonly<S>, props: Readonly<TProps>) => (Pick<S, K> | S | null)
    ) {
        super.setState((prev: Readonly<S>, props: Readonly<TProps>) => {
            const newPartialState = update(prev, props) as Pick<S, K>;
            if (newPartialState === null)
                throw new Error('null state not implemented'); // don't know yet what to do here
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
