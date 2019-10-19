import container from './IoC/container'; // the empty container

export { container };
export { TypedContainer } from './IoC/container';
export { IChangePropagator, BaseProps, AppId, UNINITIALIZED_ID, ICommandManager, CommandManagerId, BaseState, IComponent } from './base.interfaces';
export { BaseComponent, SimpleStateInfo, StateInfoLocalHelper } from './base.component';
export { Http } from './changesPropagator/http';
export { ChangesPropagator, IResponse } from "./changesPropagator/ChangesPropagator";
export { AbstractCommandManager, CommandManagerProps, CommandManagerState } from './commands/abstractCommandManager';
export { CommandInstruction } from './commands/commandInstruction';
export { CommandViewModel } from './commands/commands';
export { PromiseFactory } from './core';
export { defaultTempIdProviderProvider, mockHttpProvider, defaultServerProvider, defaultCommandManagerProvider, ITestResponse, MockCommandInstruction, ITestChange } from './IoC/defaults';
export { identifiers, TServices } from './IoC/keys';
export { TempIdProvider } from './tempIdProvider';

export { ReactWrapper, wraps } from './tests/enzyme.wrapper';
