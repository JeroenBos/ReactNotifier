import { Http } from "../changesPropagator/http";
import { TempIdProvider } from "../tempIdProvider";
import { TypeSystem, PrimitiveTypes } from "jbsnorro-typesafety";
import { IDocumentMeasurer } from "../../../View.Client/view/startup/document.measurer";
import { IFocusManager } from "../../../View.Client/view/startup/focus.manager";
import { ChangesPropagator, AbstractCommandManager, ITestResponse } from "../../../View.Client/view/view.index";
import { CheckableTypes } from "../../../View.Client/view/@types/typesystem";

export const identifiers: Readonly<Identifiers> = Object.freeze<Identifiers>({
    rootIds: 'rootIds',
    commandManager: 'commandManager',
    server: 'server',
    tempIdProvider: 'tempIdProvider',
    http: 'http',
    responses: 'responses',
    typesystem: 'typesystem',
    documentMeasurer: 'documentMeasurer',
    focusManager: 'focusManager',
});
export type Identifiers = {
    rootIds: 'rootIds',
    commandManager: 'commandManager',
    server: 'server',
    tempIdProvider: 'tempIdProvider',
    http: 'http',
    responses: 'responses',
    typesystem: 'typesystem',
    documentMeasurer: 'documentMeasurer',
    focusManager: 'focusManager',
}

export type Injectables = {
    rootIds: number[],
    commandManager: AbstractCommandManager,
    server: ChangesPropagator,
    tempIdProvider: TempIdProvider,
    http: Http,
    responses: ITestResponse[],
    typesystem: TypeSystem<CheckableTypes & PrimitiveTypes>,
    documentMeasurer: IDocumentMeasurer,
    focusManager: IFocusManager,
}