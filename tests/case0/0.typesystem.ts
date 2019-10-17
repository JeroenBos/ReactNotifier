import { TypeSystem, BaseTypeDescriptions, TypeDescriptionsFor, nullable, PrimitiveTypes } from 'jbsnorro-typesafety';
import { AppProps, AppState, Counter } from './0.app.component';
import { CommandManagerProps, CommandManagerState } from '../../commands/abstractCommandManager';

export type CheckableTypes0 = {
    'CommandManagerProps': CommandManagerProps,
    'nullable CommandManagerProps': CommandManagerProps | null,
    'CommandManagerState': CommandManagerState,
    'AppProps': AppProps,
    'AppState': AppState,
    'Counter': Counter,
    'nullable Counter': Counter | null,
}

export class AllTypeDescriptions0 extends BaseTypeDescriptions<CheckableTypes0> implements TypeDescriptionsFor<CheckableTypes0> {
    public readonly 'CommandManagerProps' = this.create<CommandManagerProps>({ server: 'any!', __id: 'number' });
    public readonly 'nullable CommandManagerProps' = nullable(this['CommandManagerProps']);
    public readonly 'CommandManagerState' = this.create<CommandManagerState>({ commands: 'any!', flags: 'any!', inputBindings: 'any!' });
    public readonly AppProps = this.create<AppProps>({ __id: 'number' });
    public readonly AppState = this.create<AppState>({ counter: 'nullable Counter' });
    public readonly Counter = this.create<Counter>({ __id: 'number', currentCount: 'number' });
    public readonly 'nullable Counter' = nullable(this['Counter']);
}

export const typesystem = new TypeSystem<CheckableTypes0 & PrimitiveTypes>(new AllTypeDescriptions0(), console.error);