import { AbstractCommandManager } from "../commands/abstractCommandManager";
import { ChangesPropagator } from "../changesPropagator/ChangesPropagator";
import { TempIdProvider } from "../tempIdProvider";
import { identifiers } from "./keys";
import { defaultTempIdProviderProvider, defaultCommandManagerProvider, defaultServerProvider, mockHttpProvider } from "./defaults";
import { CommandManagerId, AppId } from "../base.interfaces";
import { Http } from "../changesPropagator/http";
import container from './container';
import { AbstractProvider } from "./provider";

container.rebind(identifiers.rootIds).toConstantValue([CommandManagerId, AppId]);
container.bindResettableProvider<AbstractCommandManager>(identifiers.commandManager, defaultCommandManagerProvider);
container.bindResettableProvider<ChangesPropagator>(identifiers.server, defaultServerProvider);
container.bindResettableProvider<TempIdProvider>(identifiers.tempIdProvider, defaultTempIdProviderProvider);
container.bindResettableProvider<Http>(identifiers.http, mockHttpProvider);
// identifiers.responses
// identifiers.typesystem
container.bindResettableProvider<Http>(identifiers.documentMeasurer, AbstractProvider.create(() => { throw new Error('Shouldnt be needed'); }));
container.bindResettableProvider<Http>(identifiers.focusManager, AbstractProvider.create(() => { throw new Error('Shouldnt be needed'); }));


export const testContainer = container;