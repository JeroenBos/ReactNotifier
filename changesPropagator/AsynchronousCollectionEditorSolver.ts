import 'rxjs/add/operator/toPromise';
import { SerializedComponentProps, SerializedType, AdmissiblePrimitiveType, StateType, isComponentProps, isComponent } from './common';
import { IComponent, UNINITIALIZED_ID } from '../base.interfaces';
import { assert, fail} from 'jbsnorro';

type Command = any;

class Item {
    public constructor(
        public readonly containerId: number,
        public readonly collectionName: string,
        public readonly item: StateType,
        public readonly index: number,
        public readonly command: Command) {
    }
}

export class AsynchronousCollectionEditorSolver {

    private currentCommand: Command | null = null;
    private addedItems: Item[] = [];
    private removedItems: Item[] = [];

    constructor(private readonly associateWithId: (cachedComponent: IComponent, id: number) => void) {
    }

    public onIdChange(oldId: number, newId: number) {
        [this.addedItems, this.removedItems].forEach(items => {
            items.forEach(element => {
                if (element.containerId == oldId) {
                    (<any>element).containerId = newId;
                }
            });
        });
    }
    public onCommandStart(command: Command): void {
        assert(this.currentCommand == null, 'Another command is already running');

        this.currentCommand = command;
    }
    public OnCommandEnd(command: Command): void {
        assert(this.currentCommand === command, `The command could not be ended because ${this.currentCommand == null ? 'no' : 'another'} command was running`);
        assert(this.addedItems.length == 0, 'The client side added some items that the server did not');
        assert(this.removedItems.length == 0, 'The client side removed some items that the server did not');

        this.currentCommand = null;
    }

    /**
     * Notifies that a client side command added an item to a collection (as a performance improvement, to prevent waiting for a server round trip).
     */
    public onAddedClientSide(component: IComponent, collectionName: string, item: StateType, index: number): void {
        assert(component != null, 'collection cannot be null');
        assert(this.currentCommand != null, 'No command has been set to be currently executing');

        this.addedItems.push(new Item(component.__id, collectionName, item, index, this.currentCommand));
    }

    /**
     * Notifies that a client side command removed an item to a collection (as a performance improvement, to prevent waiting for a server round trip).
     */
    public onRemovedClientSide(component: IComponent, collectionName: string, item: StateType, index: number): void {
        assert(component != null, 'collection cannot be null');
        assert(this.currentCommand != null, 'No command has been set to be currently executing');

        this.removedItems.push(new Item(component.__id, collectionName, item, index, this.currentCommand));
    }
    /**
     * Notifies that the server added an item to the specified collection.
     * @param container The container of the collection to which the server added an item
     * @param collectionName The name of the collection on the container to which the server added an item
     * @param item The item the server added to the collection. Can be a (serialized) component, or a primitive.
     * @param index The index at which the server inserted the item into the collection
     * @param command The command that caused the server to insert
     * @returns whether the change was handled by this method
     */
    public onAddedServerSide(container: IComponent, collectionName: string, addedItem: SerializedType, index: number, command: Command) {
        return this.onServerSideChanged(container, collectionName, addedItem, index, command, true);
    }
    /**
     * Notifies that the server removed an item from the specified collection.
     * @param removedItem The value of the removed item(by server side), or a BaseState with the id of the removed component.
     * @returns whether the change was handled by this method
     */
    public onRemovedServerSide(container: IComponent, collectionName: string, removedItem: SerializedType, index: number, command: Command): boolean {
        return this.onServerSideChanged(container, collectionName, removedItem, index, command, false);
    }
    private onServerSideChanged(container: IComponent, collectionName: string, item: SerializedType, index: number, command: Command, addOrRemove: boolean) {
        assert(collectionName in container, `The container ${IComponent.toDebugString(container)} does not have a collection '${collectionName}' (during serverside addition)`);
        assert(item !== undefined);

        const items = addOrRemove ? this.addedItems : this.removedItems;
        const clientsideIndex: number = this.findIndex(items, { containerId: container.__id, collectionName, command });
        if (isComponentProps(item)) {
            // handle the case where the added/removed item server-side was a component
            if (clientsideIndex != -1) {
                // so now we have detected an item that was added both serverside and clientside at the same index
                // this means we can link their IDs
                const component = items[clientsideIndex].item;
                if (!isComponent(component)) {
                    const verb = addOrRemove ? 'inserted' : 'removed';
                    const preposition = addOrRemove ? 'into' : 'from';
                    throw assert(false, `The server ${verb} a component item ${preposition} into a collection, but the client ${verb} a non-component ${preposition} that collection`);
                }

                items.splice(clientsideIndex, 1);
                if (addOrRemove) {
                    // SPEC: if there are multiple in a collection, then the only restriction is that the clientside generates them in the same order as the server pushes them,
                    // SPEC: and that there are equally many of them. That is how the index at which you inserted them (if specified at all) doesn't matter
                    this.associateWithId(component, item.__id);
                }
                return true;// the addition/removal was handled clientside already
            } else {
                // serverside change could not be found clientside. Goto case to check if collection was modified
            }
        } else {
            // A primitive was inserted to/removed from this collection both clientside and serverside
            // now we look up whether _the first_ item added by the client side to the same collection was _at the same index and equal to_ the value inserted/removed by the server
            // then that matches, then we consider this change handled
            // if they don't match, we'll consider it a merge conflict

            if (clientsideIndex != -1)
                if (items[clientsideIndex].item == item && items[clientsideIndex].index == index) {
                    items.splice(clientsideIndex, 1);
                    return true;
                }
                else {
                    return this.refetch(container, collectionName);
                }
            else {
                // serverside change could not be found clientside. Goto case to check if collection was modified
            }
        }


        // in this case we could not detect that the clientside had added a component at any index or a primitive at the same index to the same collection as the server did
        // in that case, if the clientside didn't do anything to this collection, we assume the change propagated from the server to be correct and persist it
        // otherwise, if the clientside did tamper with the collection, then we don't know how to merge that with the edits from the server and refetch the entire collection
        const collectionModified = this.findIndex(items, { containerId: container.__id, collectionName }) !== -1;
        if (!collectionModified) {
            return false; // let the caller simply handle the server change
        }

        return this.refetch(container, collectionName);
    }

    private findIndex(items: Item[], predicate: Partial<Item>): number {
        return items.findIndex(item =>
            (predicate.collectionName === undefined || predicate.collectionName == item.collectionName) &&
            (predicate.command === undefined || predicate.command == item.command) &&
            (predicate.containerId === undefined || predicate.containerId == item.containerId) &&
            (predicate.index === undefined || predicate.index == item.index) &&
            (predicate.item === undefined || predicate.item == item.item)
        );
    }

    private refetch(container: IComponent, collectionName: string): boolean {
        throw fail('Not implemented. Refetch collection from server'); // the collection has been modified such that the change from the server could not be incorporated
    }
}
