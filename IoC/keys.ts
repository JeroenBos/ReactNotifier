import { ChangesPropagator } from '../changesPropagator/ChangesPropagator';
import { AbstractCommandManager } from '../commands/abstractCommandManager';
import { TempIdProvider } from '../tempIdProvider';
import { Http } from '../changesPropagator/http';
import { TypeSystem } from 'jbsnorro-typesafety';
import { ITestResponse } from './defaults';


// compile-time known services:
export interface TServices {
    readonly server: ChangesPropagator;
    readonly commandManager: AbstractCommandManager;
    readonly rootIds: number[];
    readonly tempIdProvider: TempIdProvider;
    readonly http: Http;
    readonly responses: ITestResponse[];
    readonly typesystem: TypeSystem<any>;
}

export type TIdentifiers<TServices> = Readonly<{ [K in keyof TServices]: K; }>;

export const identifiers: TIdentifiers<TServices> = Object.freeze({
    rootIds: 'rootIds',
    commandManager: 'commandManager',
    server: 'server',
    tempIdProvider: 'tempIdProvider',
    http: 'http',
    responses: 'responses',
    typesystem: 'typesystem',
});
