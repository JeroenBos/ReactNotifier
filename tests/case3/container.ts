import { ITestResponse, defaultCommandManagerProvider, defaultServerProvider, defaultTempIdProviderProvider, mockHttpProvider } from '../../IoC/defaults';
import { identifiers } from '../../IoC/keys';
import { CommandManagerId, AppId } from '../../base.interfaces';
import container from '../../IoC/container';
import { typesystem } from './changepropagator.spec';

// at this moment the container is empty

export default function (responses: ITestResponse[]): void {
    container.rebind(identifiers.rootIds).toConstantValue([CommandManagerId, AppId]);
    container.bindResettableProvider(identifiers.commandManager, defaultCommandManagerProvider);
    container.bindResettableProvider(identifiers.server, defaultServerProvider);
    container.bindResettableProvider(identifiers.tempIdProvider, defaultTempIdProviderProvider);
    container.bindResettableProvider(identifiers.http, mockHttpProvider);
    container.rebind(identifiers.typesystem).toConstantValue(typesystem);
    container.rebind(identifiers.responses).toConstantValue(responses);
    // container.bindResettableProvider(identifiers.documentMeasurer, AbstractProvider.create(() => new MockDocumentMeasurer()));
    // container.bindResettableProvider(identifiers.focusManager, AbstractProvider.create(() => new MockFocusManager()));
    container.assertIsFullyBound();
}