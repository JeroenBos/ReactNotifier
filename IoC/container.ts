import { ResettableContainer } from 'jbsnorro';
import { TypeSystem } from 'jbsnorro-typesafety';
import { TServices, identifiers } from './keys';

export class TypedContainer extends ResettableContainer<TServices> implements TServices {
    // those bound directly:
    get rootIds() {
        return this.get(identifiers.rootIds);
    }
    get responses() {
        return this.get(identifiers.responses);
    }
    get typesystem(): TypeSystem<any> {
        return this.get(identifiers.typesystem);
    }

    // those bound via providers: 
    get server() {
        return this.getProvider(identifiers.server).provide();
    }
    get commandManager() {
        return this.getProvider(identifiers.commandManager).provide();
    }
    get tempIdProvider() {
        return this.getProvider(identifiers.tempIdProvider).provide();
    }
    get http() {
        return this.getProvider(identifiers.http).provide();
    }
}

export default new TypedContainer(identifiers);
