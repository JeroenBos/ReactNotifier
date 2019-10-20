import { ILogger, RecordTypeDescription, ITypeDescriptions, PrimitiveTypes } from 'jbsnorro-typesafety';
import { GetKey } from 'jbsnorro-typesafety/typeHelper';
import { CommandManagerState, CommandViewModel } from '..';

type Types = PrimitiveTypes & {
    'CommandViewModel': CommandViewModel;
};
export class RecordAndIdTypeDescriptions<V, TRecord extends Record<string, V> = Record<string, V>, K extends keyof Types & GetKey<TRecord, Types> = GetKey<TRecord, Types>> extends RecordTypeDescription<Types, V, TRecord, K> {
    checkProperty(obj: any, propertyName: string & keyof Types[K], getSubdescription: any, log: ILogger, propertyKey?: any) {
        if (propertyName == '__id') {
            return super.checkProperty(obj, propertyName, getSubdescription, log, 'number' as any);
        }
        return super.checkProperty(obj, propertyName, getSubdescription, log, propertyKey);
    }
}

export const commandsTypeDescription: ITypeDescriptions<CommandManagerState['commands']> = new RecordAndIdTypeDescriptions<CommandViewModel>('CommandViewModel');
