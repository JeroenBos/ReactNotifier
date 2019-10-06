import { TypeSystem, BaseTypeDescriptions, TypeDescriptionsFor, createCreateFunction, nullable } from 'jbsnorro-typesafety';
import { AppProps, AppState, Counter } from './0.app.component';
import { CommandManagerProps, CommandManagerState } from '../../commands/abstractCommandManager';
const create = <T extends object>() => createCreateFunction<CheckableTypes0, T>();

export type CheckableTypes0 = {
    'CommandManagerProps': CommandManagerProps,
    'nullable CommandManagerProps': CommandManagerProps | null,
    'CommandManagerState': CommandManagerState,
    'AppProps': AppProps,
    'AppState': AppState,
    'Counter': Counter,
    'nullable Counter': Counter | null,
}

export class AllTypeDescriptions0 extends BaseTypeDescriptions implements TypeDescriptionsFor<CheckableTypes0> {
    public readonly 'CommandManagerProps' = create<CommandManagerProps>()({ server: 'any!', __id: 'number' });
    public readonly 'nullable CommandManagerProps' = nullable(this['CommandManagerProps']);
    public readonly 'CommandManagerState' = create<CommandManagerState>()({ commands: 'any!', flags: 'any!', inputBindings: 'any!' });
    public readonly AppProps = create<AppProps>()({ __id: 'number' });
    public readonly AppState = create<AppState>()({ counter: 'nullable Counter' });
    public readonly Counter = create<Counter>()({ __id: 'number', currentCount: 'number' });
    public readonly 'nullable Counter' = nullable(this['Counter']);
}

export const typesystem = new TypeSystem(new AllTypeDescriptions0(), console.error);