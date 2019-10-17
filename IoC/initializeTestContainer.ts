import { identifiers } from "./keys";
import { defaultTempIdProviderProvider, defaultCommandManagerProvider, defaultServerProvider, mockHttpProvider } from "./defaults";
import { CommandManagerId, AppId } from "../base.interfaces";
import container from './container';
import { AbstractProvider } from 'jbsnorro';

container.rebind(identifiers.rootIds).toConstantValue([CommandManagerId, AppId]);
container.bindResettableProvider(identifiers.commandManager, defaultCommandManagerProvider);
container.bindResettableProvider(identifiers.server, defaultServerProvider);
container.bindResettableProvider(identifiers.tempIdProvider, defaultTempIdProviderProvider);
container.bindResettableProvider(identifiers.http, mockHttpProvider);
// identifiers.responses
// identifiers.typesystem
container.bindResettableProvider(identifiers.documentMeasurer, AbstractProvider.create(() => { throw new Error(`Shouldn't be needed`); }));
container.bindResettableProvider(identifiers.focusManager, AbstractProvider.create(() => { throw new Error(`Shouldn't be needed`); }));

export const testContainer = container;