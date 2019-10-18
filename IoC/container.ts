import { ResettableContainer, assert } from 'jbsnorro';
import { TypeSystem } from 'jbsnorro-typesafety';
import { TServices, identifiers } from './keys';

export class TypedContainer extends ResettableContainer<TServices> implements TServices {
    get server() {
        return this.getProvider(identifiers.server).provide();
    }
    get commandManager() {
        return this.getProvider(identifiers.commandManager).provide();
    }
    get rootIds() {
        return this.getProvider(identifiers.rootIds).provide();
    }
    get tempIdProvider() {
        return this.getProvider(identifiers.tempIdProvider).provide();
    }
    get http() {
        return this.getProvider(identifiers.http).provide();
    }
    get responses() {
        return this.getProvider(identifiers.responses).provide();
    }
    get typesystem(): TypeSystem<any> {
        return this.getProvider(identifiers.typesystem).provide();
    }

    resetAll() {
        assert(this.isBound(identifiers.rootIds), 'rootIds must be bound before calling resetAll');
        super.resetAll();
    }
}

export default new TypedContainer(identifiers);
