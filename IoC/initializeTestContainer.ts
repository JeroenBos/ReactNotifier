import { identifiers } from "./keys";
import { defaultTempIdProviderProvider, defaultCommandManagerProvider, defaultServerProvider, mockHttpProvider } from "./defaults";
import { CommandManagerId, AppId } from "../base.interfaces";
import container from './container';

container.rebind(identifiers.rootIds).toConstantValue([CommandManagerId, AppId]);
container.bindResettableProvider(identifiers.commandManager, defaultCommandManagerProvider);
container.bindResettableProvider(identifiers.server, defaultServerProvider);
container.bindResettableProvider(identifiers.tempIdProvider, defaultTempIdProviderProvider);
container.bindResettableProvider(identifiers.http, mockHttpProvider);
// identifiers.responses
// identifiers.typesystem

export const testContainer = container;