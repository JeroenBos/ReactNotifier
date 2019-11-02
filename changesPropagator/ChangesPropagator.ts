import 'rxjs/add/operator/toPromise';
import { IChangePropagator, IComponent, BaseProps, BaseState, UNINITIALIZED_ID, isReference } from '../base.interfaces';
import { CommandInstruction } from './../commands/commandInstruction';
import { Http } from './http';
import { SerializedType, StateType, isComponentProps, isComponent } from './common';
import { assert, isDevelopment, assertAreIdentical, groupBy, fail, unreachable } from 'jbsnorro';
import { superSetStateBaseComponent } from '../base.component';

type StateInfo = any;
type PropertyChange = (IPropertyChange | ICollectionItemAdded) & ComponentType & { isPropsChange: boolean };
type ComponentType = {
    component: IComponent,
    /** A path from the associated component to the associated change */
    path: Relation[]
};
type PartialPropertyChange = (IPropertyChange | ICollectionItemAdded) & { path: Relation[] };
type Change = IPropertyChange;
type ViewModel = { __id: number };
interface PartialRelation {
    readonly propertyName: string | number;
    readonly parentId: number
}
class Relation implements PartialRelation {
    private _isComponent: boolean | undefined = undefined;
    constructor(public readonly childId: number, public readonly propertyName: string | number, public readonly parentId: number) { }
    /** Gets whether the child in this relation is a component. */
    public get isComponent(): boolean | undefined {
        return this._isComponent;
    }
    public set isComponent(value: boolean | undefined) {
        assert(!this._isComponent, 'isComponent has already been set');
        assert(value !== undefined, `Invalid argument 'value': 'undefined' was specified`);
        this._isComponent = value;
    }

    /**
     * Gets whether when this relation would be set, whether it should be on the grandparent rather than parent.
     */
    public isPropsChange(allComponents: Map<number, IComponent>, parents: Map<number, Relation>): boolean {
        if (!this.isComponent)
            return true;



        // const grandparentRelation = parents.get(this.parentId);
        // if (grandparentRelation === undefined) {
        //     // if parent is a root
        //     return false;
        // }

        const propertyName = this.propertyName;

        const component = allComponents.get(this.parentId);
        if (component === undefined) {
            // container hasn't registered yet
            throw fail('not implemented');
        }
        else {
            assert(propertyName in component.props || propertyName in component.state);
            return propertyName in component.props;
        }
    }
};
export class ChangesPropagator implements IChangePropagator {
    /** A map from viewmodel child id to viewmodel parent id and property name at which the child is stored. */
    private readonly parents = new Map<number, Relation>();
    /** The changes that haven't been propagated to a component yet because the component didn't exist yet at the moment the change arrived from the server. 
     * This can happen when a component is created on the server and properties on it are assigned (possibly recursively), but the react render is only triggered 
     * after the changes have been received.
    */
    private readonly danglingStates = new Map<number, Object>();
    /** Debugging purposes only. */
    public get hasDanglingState(): boolean {
        return this.danglingStates.size != 0;
    }

    /** A map from component id to component. */
    private readonly components = new Map<number, IComponent>();

    private static counter = 0;
    public readonly uid = ChangesPropagator.counter++;
    constructor(
        private readonly http: Http,
        private readonly rootIds: number[]) {

        rootIds.forEach(rootId => {
            this.danglingStates.set(rootId, {});
        });
    }


    public async open(initialization?: Promise<any>): Promise<void> {
        await this.postAndProcess('open', undefined, initialization);
    }
    public async registerRequest(): Promise<void> {
        await this.postAndProcess('RegisterRequest');
    }
    public async executeCommand(command: CommandInstruction) {
        if (command.commandName != 'mock')
            console.log(`executeCommand: '${command.commandName}'`);
        if (command == null || command.commandName == null || command.commandName == '' || command.viewModelId < UNINITIALIZED_ID || command.eventArgs == null) {
            throw fail('Invalid command instruction');
        }
        await this.postAndProcess('ExecuteCommand', command);
    }

    protected async postAndProcess(controller: string, data?: CommandInstruction, initialization?: Promise<any>) {
        // TODO: try 
        {
            const response = await this.post(controller, data);

            if (initialization)
                await initialization;
            this.processResponse(response);
            if (response.rerequest) {
                await this.registerRequest();
            }
        }
        //catch (error) {
        //    console.error(error);
        //}
    }
    protected post(url: string, data?: CommandInstruction): Promise<IResponse> {
        return this.http.post(url, data || {});
    }

    private processResponse(response: IResponse): void {
        response.changes.forEach(change => assert(change.id >= 0, 'change with negative id specified'));
        const clonedResponse: IResponse = JSON.parse(JSON.stringify(response));
        const changesWithoutRootRefs = clonedResponse.changes.filter(change => {
            if (ChangesPropagator.IsPropertyChanged(change)) {
                if (isComponentProps(change.value)) {
                    if (this.rootIds.includes(change.value.__id)) {
                        return false; // mostly deletes the link from App to CommandManager in the VM, but this may be more general
                    }
                }
            }
            return true;
        });

        // assumptions:
        // the response.changes only contains properties of primitive types, that is, changes on nested components are separate entry in IResponse.changes.
        // nested component changes must be 
        const sortedChanges = changesWithoutRootRefs.map(change => {
            if (ChangesPropagator.IsPropertyChanged(change)) {
                if (change && change.value) {
                    delete (<any>change.value)['isCollection']; //TODO: adorn
                }
            }
            else if (ChangesPropagator.IsCollectionItemAdded(change)) {
                debugger;
            }
            else {
                throw fail('unhandled type of change');
            }
            return change;
        }).sort((a, b) => a.id - b.id);

        // ensure parental relationships are set:
        for (const change of sortedChanges) {
            const change_value = ChangesPropagator.IsPropertyChanged(change) ? change.value : change.item;
            const change_propertyName = ChangesPropagator.IsPropertyChanged(change) ? change.propertyName : change.index;
            if (isComponentProps(change_value)) {
                const relation = new Relation(change_value.__id, change_propertyName, change.id);
                this.parents.set(change_value.__id, relation);
                const parentRelation = this.parents.get(change.id);
                if ((parentRelation === undefined) !== this.rootIds.includes(change.id)) throw fail();
                if (parentRelation !== undefined && parentRelation.isComponent === false) {
                    // if the parent is a pojo, this object is a pojo:
                    relation.isComponent = false;
                }
                else if (parentRelation === undefined || parentRelation.isComponent === true) {
                    // ask the parent component info whether the current change is a component:
                    const parent = this.components.get(change.id);
                    if (parent === undefined) {
                        if (this.rootIds.includes(change.id)) {
                            // this could still be possible, where the root hasn't registered yet...
                            // leave relation.isComponent to undefined. It will get sorted out on registration of the root
                        } else {
                            // I suppose this could happen when a parent component hasn't registered yet
                            // throw new Error('parentRelation.isComponent is true, but the parent is not a component? :S ');  // note that parentRelation is from the parent to the grandparent
                        }
                    } else {
                        relation.isComponent = parent.isComponent(relation.propertyName);
                    }
                } else {
                    this.assertNoAncestorIsObject(change.id);
                }
            }
        }




        const isDangling = (change: ICollectionItemAdded | IPropertyChange) => {
            // if the relation does not exist, it must be a root or an error. If the root has registered, it is not dangling. Otherwise it is.
            //     This is akin to the case relation.isComponent, because all root changes are state. 
            // if relation.isComponent === undefined, it is dangling
            // if relation.isComponent === false, it is not dangling
            // if relation.isComponent === true then
            //     if the component has registered it is not dangling, else
            //     if the change is on the state of the component, it is dangling 
            //     (this assumes that the parent component must already have registered, otherwise how do you know the component is a component?)
            //     (therefore, it it is part of props, it is not danling because it can be assigned through the already registered parent
            //     so 'if the change is on the state of the component' is the same as saying it's not on the parent of the component

            const relation = this.parents.get(change.id);
            assert(!(relation === undefined && !this.rootIds.includes(change.id)));

            if (relation === undefined) {
                // SPEC: if the component has registered it is not dangling
                const rootHasRegistered = this.components.has(change.id);
                return !rootHasRegistered;
            }
            if (relation.isComponent === true) {
                // SPEC: if the component has registered it is not dangling
                const hasRegistered = this.components.has(change.id);
                if (hasRegistered) {
                    return false;
                }
                // SPEC: if the change is on the state of the component, it is dangling 
                const isParentChange = this.isParentChange(change);
                const isState = !isParentChange;
                return isState;
            }
            // SPEC: if relation.isComponent === undefined, it is dangling
            if (relation.isComponent === undefined)
                return true;
            // SPEC: if relation.isComponent === false, it is not dangling
            if (relation.isComponent === false)
                return false;
            throw unreachable();
        }


        const { setStateChanges, danglingChanges } = this.filterOutDanglingChanges(sortedChanges, isDangling);

        // const changesAtComponents: PropertyChange[] = setStateChanges.map(change => this.getComponentOnWhichToDoTheChange(change));

        // merge dangling states into known dangling states
        for (const danglingChange of danglingChanges) {
            const danglingChange_value = ChangesPropagator.IsPropertyChanged(danglingChange) ? danglingChange.value : danglingChange.item;
            const danglingChange_propertyName = ChangesPropagator.IsPropertyChanged(danglingChange) ? danglingChange.propertyName : danglingChange.index;

            if (isComponentProps(danglingChange_value)) {
                if (!this.danglingStates.has(danglingChange_value.__id)) {
                    this.danglingStates.set(danglingChange_value.__id, new Object());
                }
                // maybe the danglingState[propertyName] = value should be here too. it's the referencing of the parent to the child.
            } else {
                if (!this.danglingStates.has(danglingChange.id)) {
                    this.danglingStates.set(danglingChange.id, new Object());
                }
                const danglingState = this.danglingStates.get(danglingChange.id) as any;
                danglingState[danglingChange_propertyName] = danglingChange_value;
            }
        }

        const changesPerComponent = groupBy(setStateChanges, change => this.getComponentIdOnWhichToDoTheChange(change)).sort((a, b) => a.key - b.key);
        for (const grouping of changesPerComponent) {
            const component = this.components.get(grouping.key);
            if (component === undefined) throw fail('not possible');
            this.setState(component, grouping.elements);
        }
    }

    private getComponentIdOnWhichToDoTheChange(this: ChangesPropagator, change: IPropertyChange | ICollectionItemAdded): number {
        // the component to the change on is the first component in the path to the root such that
        // - it is not a view model AND 
        // - that the path.propertyName is in the state rather than props

        const relation = this.parents.get(change.id);
        if (relation === undefined) {
            return change.id;
        }

        if (this.rootIds.includes(change.id)) {
            return change.id;
        }


        // traverse up until a relation is on state rather than on props:
        let parentRelation = { propertyName: ChangesPropagator.IsPropertyChanged(change) ? change.propertyName : change.index, parentId: change.id };

        while (this.isOnViewModel(parentRelation) || this.isProps(parentRelation)) {
            const ancestorRelation = this.parents.get(parentRelation.parentId);
            assert(ancestorRelation !== undefined, 'You cannot change props on the root');
            parentRelation = ancestorRelation!;
        }

        return parentRelation.parentId;
    }

    private isOnViewModel(relation: PartialRelation): boolean {
        const parent = this.parents.get(relation.parentId);
        if (parent === undefined)
            return false; // it must be on a root

        switch (parent.isComponent) {
            case false:
                return true;
            case true:
                return false;
            case undefined:
                assert(false, 'i dont know');
            default: throw new Error('unreachable');
        }

    }
    private isProps(relation: PartialRelation): boolean {
        const stateInfo: StateInfo | undefined = getStateInfo.call(this, relation);

        const info: boolean | undefined | StateInfo = (stateInfo || {})[relation.propertyName];
        switch (info) {
            case true:
                return true;
            case undefined:
            case false:
            default:
                return false;
        }

        function getStateInfo(this: ChangesPropagator, relation: PartialRelation): StateInfo | undefined {
            const component = this.components.get(relation.parentId);
            if (component !== undefined) {
                return component.stateInfo;
            }

            const parentRelation = this.parents.get(relation.parentId);
            assert(parentRelation !== undefined, 'The roots must have registered');
            if (parentRelation === undefined) throw new Error();

            const parentStateInfo: any = getStateInfo.call(this, parentRelation);
            const stateInfo = parentStateInfo[parentRelation.propertyName];

            return stateInfo;
        }
    }
    private isParentChange(change: IPropertyChange | ICollectionItemAdded): boolean {
        const componentIdOnWhichToDoTheChange = this.getComponentIdOnWhichToDoTheChange(change);
        return componentIdOnWhichToDoTheChange != change.id;
    }

    private assertNoAncestorIsObject(id: number) {
        let obj = this.parents.get(id);
        while (obj !== undefined) {
            assert(obj.isComponent !== false);

            obj = this.parents.get(obj.parentId);
        }
    }
    /** Call on registration of a component with the specified id. */
    private setIsComponent(componentId: number): void {
        const relation = this.parents.get(componentId);
        if (relation === undefined) {
            assert(this.rootIds.includes(componentId), `A dangling component was added. Roots must have id=0. Otherwise, add the component to the tree first by ` +
                `submitting a change containing '{ __id: ${componentId} }' on any state in the tree`);
            return;
        }

        switch (relation.isComponent) {
            case true:
                return; // if this is always the case, this method call is redundant
            case undefined:
                relation.isComponent = true;
            default:
                assert(false, 'The last time this was thrown was because the stateInfo was wrong: ' +
                    'I registered a component whose parent relation said it wasnt a component, ' +
                    'because it was missing from stateInfo');
        }
    }
    /** On registration of a component, new information on 'isComponent' becomes accessible for the children of the new component. 
     * This method sets that information.
     */
    private setIsComponentOnChildrenOf(newComponent: IComponent): void {
        assert(newComponent != null, 'argument error: newComponent == null');
        assert(newComponent.stateInfo !== undefined, `argument error: newComponent with id = ${newComponent.__id} is missing stateInfo`);

        const childObjectIds = [];
        for (const danglingStateId of this.danglingStates.keys()) {
            const relation = this.parents.get(danglingStateId);
            if (relation === undefined) {
                assert(this.rootIds.includes(danglingStateId));
                continue;
            } else if (relation.parentId === newComponent.__id) {
                const isComponent = relation.propertyName in newComponent.stateInfo;
                if (relation.isComponent !== undefined && relation.isComponent !== isComponent) {
                    throw new Error('relation.isComponent is set twice, inconsistently');
                }
                if (relation.isComponent === undefined) {
                    // only set it if it hasn't been set already. If this never happens, calling this method may be redundant
                    relation.isComponent = isComponent;
                    if (!isComponent) {
                        childObjectIds.push(relation.childId);
                    }
                }
            }
        }

        // set isComponent to false on all dangling descendants of non-component children
        this.setIsNonComponentOnDescendantsOf(childObjectIds);

        // I'm asserting that the following statement holds here: `all children have known isComponent`
        // The case in which this could go wrong is when a child object has isComponent === false, but it's not dangling
        // I feel like some other code should already have taken care of that, hence the assertion

        if (isDevelopment) {
            for (const [_, relation] of this.parents.entries()) {
                if (relation.parentId === newComponent.__id) {
                    if (relation.isComponent === undefined) {
                        debugger;
                        throw new Error('isComponent should have been known by now');
                    }
                }
            }
        }
    }
    /** Sets `isComponent` to false on all dangling descendants of non-component children. */
    private setIsNonComponentOnDescendantsOf(objectIds: number[]) {
        if (objectIds.length == 0)
            return;
        const descendantObjectIds = [];
        for (const danglingStateId of this.danglingStates.keys()) {
            const relation = this.parents.get(danglingStateId);
            if (relation !== undefined && relation.isComponent === undefined && objectIds.includes(relation.parentId)) {
                relation.isComponent = false;
                descendantObjectIds.push(relation.childId);
            }
        }

        this.setIsNonComponentOnDescendantsOf(descendantObjectIds);
    }

    private tryGetParentComponent(componentId: number): IComponent | undefined {
        const parentRelationship = this.parents.get(componentId);
        if (parentRelationship === undefined)
            return undefined;

        const parent = this.components.get(parentRelationship.parentId);
        return parent;
    }

    private filterOutDanglingChanges<T>(
        changes: T[],
        isDangling: (t: T) => boolean
    ): { setStateChanges: T[], danglingChanges: T[] } {
        const setStateChanges = [];
        const danglingChanges = [];

        for (const change of changes) {
            if (isDangling(change)) {
                danglingChanges.push(change);
            }
            else {
                setStateChanges.push(change);
            }
        }

        return { setStateChanges, danglingChanges };
    }
    /** Does a react setState given the specified changes. */
    private setState(component: IComponent, changes: (IPropertyChange | ICollectionItemAdded)[]): void {
        //TODO: detect merge conflicts due to async serverside and clientside commands
        const _component = component as any as superSetStateBaseComponent<any, any>;
        _component.superSetState((oldState: any) => {
            const result = this.toState(changes, component.__id, oldState);
            try {
                component.assertIsValidState(result, false);
            }
            catch (e) {
                debugger;
                if (component.__id == 0) {
                    throw new Error(`You cannot change the props of the root`);
                }
                component.assertIsValidState(result, false);
                throw e;
            }

            return result;
        });
    }
    /** Finds and deletes and returns all changes stored for the specified component. */
    private acquireDanglingState(componentId: number, stateMustExist = false): object {
        if (this.components.has(componentId)) {
            debugger;
            throw new Error(`There is no dangling state for an component with id ${componentId} because there is already a component with that id.
            This is most likely because an error was thrown in the previous constructor call of the component. `);
        }
        const state = this.danglingStates.get(componentId);
        if (state === undefined) {
            if (stateMustExist) {
                debugger;
                throw new Error('No dangling state found with id ' + componentId);
            }
            else
                return {};
        }
        else {
            this.danglingStates.delete(componentId);
            delete (state as any).__id;
            return state;
        }
    }

    register(newComponent: IComponent): BaseState {
        // if (!this.rootIds.includes(newComponent.__id)) {
        //     const parentRelation = this.parents.get(newComponent.__id);
        //     if (parentRelation === undefined) throw new Error();
        //     if (parentRelation.isComponent !== undefined) throw new Error();
        //     parentRelation.isComponent = true;
        // }
        const state = newComponent.state;

        const id = newComponent.__id;
        if (id == UNINITIALIZED_ID) {
            throw new Error('uninitialized id');
        }
        else if (id < UNINITIALIZED_ID) {
            // clientside added the component without the server knowing yet
            return state; // default state
        } else {
            //server added the component
            this.assertIsNotReservedId(id);

            // AT THIS POINT, IT MUST CHECK ALL DANGLING STATES AND SEE IF IT IS ACTUALLY A PROP ON A PROPERTY OF THIS STATE
            // RATHER THAN A PROPERTY ON STATE // in the child components

            this.movePropertiesFromStateToProps(newComponent.state);


            // by setting this to default simply means: when no dangling state exists, it defaults to {}
            // this is simpler because at the time of a property change that sets a reference it may not be known yet whether 
            // that reference points to a component or viewmodel/component piece. For a viewmodel/component piece, *no* dangling 
            // state should be created. We could create it when the information becomes known, but that's more effort. 
            const stateMustExist = false
                && isComponent
                && state != null
                // && typeof state == 'object'
                && Object.keys(state).length != 0;
            // get the state as already known due to received changes
            const danglingState = this.acquireDanglingState(id, stateMustExist);
            if (!isReference(danglingState))
                if (newComponent.__id <= UNINITIALIZED_ID)
                    throw new Error('__id should have been specified');

            this.movePropertiesFromStateToProps(danglingState);

            // register it here (after obtaining dangling state)
            this.components.set(id, newComponent);
            // assert isComponent of the component is unknown. Set it to component
            this.setIsComponent(newComponent.__id);
            // note that there are a few ways of obtaining whether an object is a component:
            // 1: this.components.has(id): if it returns true then it is a component, but when it returns false it's not necessarily not a component
            // 2: this.rootIds.has(id): same as above: true is true, false doesn't mean false
            // 3: this.parents.get(id).isComponent === true: returns whether it is a component identically, except for roots: then parents.get returns undefined
            // 4: the correct way: this.rootIds.has(id) || this.parents.get(id).isComponent === true;
            // this does assume that this.components.set(id, ..) is always followed directly by a this.setIsComponent(); if not, you could try:
            // 5: (1) || (2) || (3)

            this.setIsComponentOnChildrenOf(newComponent);


            const result = { ...state, ...danglingState };
            return result;
        }
    }
    unregister(component: IComponent) {
        if (component.__id == UNINITIALIZED_ID) {
            throw new Error("TODO: removed the component from the AsynchronousCollectionEditorSolver"); // TODO
        } else if (this.components.has(component.__id)) {
            this.components.delete(component.__id);
        } else {
            throw new Error("A component is unregistered that was never registered");
        }
    }
    onClientsideCollectionChange(container: IComponent, collectionName: string, newItem: StateType, index: number) {
        throw new Error('not implemented');
    }
    /** Throws if any components with non-reserved id exist, and a reserved id is passed in as argument. */
    private assertIsNotReservedId(id: number) {
        const isReserved = this.rootIds.includes(id);
        if (isReserved) {
            for (const componentId of this.components.keys()) {
                const componentIdIsReserved = this.rootIds.includes(componentId);
                if (!componentIdIsReserved) {
                    throw new Error(`Invalid ID: The IDs '${this.rootIds.join(', ')}' are reserved`);
                }
            }
        }
    }
    private movePropertiesFromStateToProps<TState extends BaseState>(state: Readonly<TState>) {
        // for each property in the state of the incoming component
        for (const statePropertyName in state) {
            const childProps = state[statePropertyName];
            // if that property is the props of a child component
            if (isComponentProps(childProps)) {
                const id = childProps.__id;
                const danglingChildState = this.danglingStates.get(id);
                // if that child has a dangling state
                if (danglingChildState !== undefined) {
                    // all properties that are registered as state for the child component
                    // get copied to the props for that component if that props object
                    // has a property with that name 
                    // (this decision disallows the props and state to both have a similarly named property; or: it would be placed on the props)
                    for (const danglingStateName in danglingChildState) {
                        if (danglingStateName in childProps) {
                            const anyDanglingState: any = danglingChildState;
                            (childProps as any)[danglingStateName] = anyDanglingState[danglingStateName];
                            delete anyDanglingState[danglingStateName];
                        }
                    }
                }
            }
        }
    }

    // initialization steps:
    // index.html
    // - wasm.interop.js
    // - asde.js
    // --- index.tsx
    // ----- React.Render
    // ------- ChangesPropagator (specified to AppComponent as argument)
    // ------- AppComponent
    // --------- Calls componentDidMount which adds the AppComponent to the changesPropagator. 
    //           Assuming this happens before the Components on AppComponent are created this should be fine
    //           Basically this.components.clear() can never be called again as it is above
    // then after all that, open() is called. 

    private assertComponentsAreInitialized(): void {
        const missingRoots = this.rootIds.filter(rootId => !this.components.has(rootId));
        if (missingRoots.length != 0) {
            throw new Error(`The root components with ids ${missingRoots.join(', ')} were not added to the changes propagator`);
        }
    }

    private static IsViewModelInstantiation(change: IChange): change is IViewModelInstantation {
        return this.IsPropertyChanged(change) && change.propertyName == '__id';
    }
    private static IsPropertyChanged(change: any): change is IPropertyChange {
        return 'propertyName' in change;
    }
    private static IsCollectionChanged(change: any): change is ICollectionChange {
        return 'collectionName' in change;
    }
    private static IsCollectionItemAdded(change: any): change is ICollectionItemAdded {
        return 'item' in change;
    }
    private static IsCollectionItemRemoved(change: any): change is ICollectionItemRemoved {
        return 'removedItemId' in change;
    }
    private static IsCollectionItemReordered(change: any): change is ICollectionItemsReordered {
        return 'index1' in change;
    }
    /** Merges the prev state with the changes, from the component id downwards. So this collects all changes that were prop changes to descendants of componentId */
    private toState(changes: (IPropertyChange | ICollectionItemAdded)[], componentId: number, prevState: Readonly<BaseState>): Object {
        assert(changes != null);
        const result: any = {};

        changes.sort((a, b) => b.instructionId - a.instructionId);

        for (const change of changes) {
            if (!ChangesPropagator.IsPropertyChanged(change) && !ChangesPropagator.IsCollectionItemAdded(change)) {
                throw new Error('not implemented');
            }
            const change_value = ChangesPropagator.IsPropertyChanged(change) ? change.value : change.item;
            const change_propertyName = ChangesPropagator.IsPropertyChanged(change) ? change.propertyName : change.index;

            let currentResult: any = result;
            let currentOldState: any = prevState;
            const path = this.getPathFrom(componentId, change.id).reverse();
            for (const pathElement of path) {
                const propertyName = pathElement.propertyName;
                if (currentOldState !== undefined && currentOldState !== null) {
                    currentOldState = currentOldState[propertyName];
                }
                if (!(propertyName in currentResult)) {
                    currentResult[propertyName] = currentOldState || {};
                }
                currentResult = currentResult[propertyName];
            }

            // allow the clientside to set something and for the server to associate an id to it later:
            const merge = typeof currentOldState == 'object'
                && currentOldState !== null
                && !isReference(currentOldState[change_propertyName])
                && typeof currentOldState[change_propertyName] == 'object'
                && currentOldState[change_propertyName] !== null
                && isReference(change_value);

            currentResult[change_propertyName] = merge ? { ...currentOldState[change_propertyName], ...(change_value as any) } : change_value;
        }
        return result;
    }

    /** 
     * Returns the path from the component that contains the specified view model to the viewmodel.
     * So it returns a path of length 0 if the viewmodelId is the id of a component. */
    private getComponent(viewmodelId: number): ComponentType {
        const path: Relation[] = [];

        while (true) {
            const component = this.components.get(viewmodelId);
            if (component != undefined) {
                path.reverse();
                return { component, path };
            }

            const relation = this.parents.get(viewmodelId);
            if (relation === undefined)
                throw new Error('A root is not a component, or an id has not been registered yet');

            path.push(relation);
            viewmodelId = relation.parentId;
        }
    }

    private getOwnerRelation(change: IPropertyChange | ICollectionItemAdded): PartialRelation {
        const path = this.getComponent(change.id).path;

        if (path.length == 0) {
            const propertyName = ChangesPropagator.IsPropertyChanged(change) ? change.propertyName : change.index;
            return { propertyName, parentId: change.id };
        }
        return path[0];
    }
    /** 
     * Gets the id of the first component up in the ancestor tree of the specified view model, which could be the specified id itself.
     */
    private getOwnerComponentId(change: IPropertyChange | ICollectionItemAdded): number {
        return this.getOwnerRelation(change).parentId;

    }
    private getPath(viewmodelId: number): Relation[] {
        const componentAndPath = this.getComponent(viewmodelId);
        if (componentAndPath === undefined)
            throw new Error('viewmodel was not found');
        return componentAndPath.path; // PERF
    }

    /**
     * Gets the path from the ancestor to a descendent. Throws if they do not have that relation.
     */
    private getPathFrom(ancestorId: number, descendentId: number): Relation[] {
        const result: Relation[] = [];
        let id = descendentId;
        while (id != ancestorId) {
            const relation = this.parents.get(id);
            if (relation === undefined)
                throw new Error('The specified descendent does not descent from the specified ancestor');

            result.push(relation);
            id = relation.parentId;
        }
        return result;
    }
}

export interface IResponse {
    changes: (IPropertyChange | ICollectionItemAdded | ICollectionItemRemoved | ICollectionItemsReordered)[];
    rerequest: boolean;
}
interface IChange {
    /** The id of the view model containing the change. */
    id: number;
    instructionId: number;
}
interface IViewModelInstantation extends IPropertyChange {
    propertyName: '__id',
    value: number;
}
export interface IPropertyChange extends IChange {
    propertyName: string;
    value: SerializedType;
}
interface ICollectionChange extends IChange {
    /** If this is undefined, then the component represented by the id is the collection alluded to; 
     * otherwise the view model with that id contains a property with that name that holds the collection. */
    collectionName: string;
}
interface ICollectionItemRemoved extends ICollectionChange {
    /** The id of the removed item, or undefined if a primitive was removed. */
    removedItem: SerializedType;
    /** The index of the item that was removed. */
    index: number;
}
interface ICollectionItemAdded extends ICollectionChange {
    item: SerializedType;
    /** The index at which the item was inserted. */
    index: number;
}
interface ICollectionItemsReordered extends ICollectionChange {
    index1: number;
    index2: number;
}
