import container from './IoC/container'; // the empty container

// you cannot export anything from the './tests' directory, because its types aren't published (by default)
export { container };
export { TypedContainer } from './IoC/container';
export { IChangePropagator, BaseProps, AppId, UNINITIALIZED_ID, ICommandManager, CommandManagerId, BaseState, IComponent, Sender } from './base.interfaces';
export { BaseComponent, SimpleStateInfo, StateInfoLocalHelper, interjectIntoUpdate } from './base.component';
export { Http } from './changesPropagator/http';
export { ChangesPropagator, IResponse, IPropertyChange } from "./changesPropagator/ChangesPropagator";
export { AbstractCommandManager, CommandManagerProps, CommandManagerState } from './commands/abstractCommandManager';
export { CommandInstruction } from './commands/commandInstruction';
export { CommandViewModel, Reducer, CommandOptimization, CommandStateFactory } from './commands/commands';
export { ConditionAST, FlagDelegate } from './commands/ConditionAST';
export { CanonicalInputBinding } from './commands/inputBindingParser';
export { InputEvent } from './commands/inputTypes';
export { commandsTypeDescription } from './commands/commands.typesystem';
export { PromiseFactory } from './core';
export { defaultTempIdProviderProvider, mockHttpProvider, defaultServerProvider, defaultCommandManagerProvider, ITestResponse, MockCommandInstruction, ITestChange } from './IoC/defaults';
export { identifiers, TServices } from './IoC/keys';
export { TempIdProvider } from './tempIdProvider';
export { ReactWrapper, wraps } from './enzyme.wrapper';
export * from './commands/commands';
