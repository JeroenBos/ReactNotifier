import { AbstractProvider } from "./provider";
import { identifiers } from "./keys";
import { ChangesPropagator, IResponse, IPropertyChange } from "../changesPropagator/ChangesPropagator";
import { CommandManagerId } from "../base.interfaces";
import { TempIdProvider } from "../tempIdProvider";
import { Http } from "../changesPropagator/http";
import { TypeSystem } from "jbsnorro-typesafety";
import { AbstractCommandManager } from "../commands/abstractCommandManager";
import { CommandInstruction } from "../commands/commandInstruction";
import container from "./container"; // order is important
import { Omit } from "../core";

export type ITestChange = Omit<IPropertyChange, 'instructionId'>;
export type ITestResponse = ITestChange[];

function assertIsBound(key: string) {
    if (!container.isBound(key))
        throw new Error(`Nothing is bound in the IoC container to '${key}'`);
}

export const MockCommandInstruction: CommandInstruction = {
    commandName: 'mock',
    viewModelId: 0,
    eventArgs: {}
};

export class MockHttp implements Http {
    private responseCount = 0;
    private readonly predefinedResponses: IResponse['changes'][];
    constructor(predefinedResponses: ITestResponse[]) {
        predefinedResponses.map((response, i) => {
            response.forEach(change => {
                if (!('instructionId' in change)) {
                    (change as IPropertyChange).instructionId = i;
                }
            });
        });
        this.predefinedResponses = predefinedResponses as any;
    }
    async post(_url: string, _data: CommandInstruction | {}): Promise<IResponse> {
        if (this.responseCount >= this.predefinedResponses.length)
            throw new Error(`All ${this.predefinedResponses.length} mock responses have been enumerated`);
        const response: IResponse = {
            changes: this.predefinedResponses[this.responseCount],
            rerequest: false
        };

        this.responseCount++;
        return Promise.resolve(response);
    }
}

export const mockHttpProvider = AbstractProvider.create(() => {
    assertIsBound(identifiers.responses);
    const responses = container.get(identifiers.responses);
    return new MockHttp(responses);
});


export const defaultServerProvider = AbstractProvider.create(() => {
    assertIsBound(identifiers.rootIds);
    assertIsBound(identifiers.http);

    const rootIds = container.get(identifiers.rootIds);
    const http = container.get(identifiers.http);
    return new ChangesPropagator(http, rootIds);
});
export const defaultCommandManagerProvider = AbstractProvider.create(() => {
    assertIsBound(identifiers.server);
    assertIsBound(identifiers.typesystem);

    const server = container.get(identifiers.server);
    const typesystem = container.get(identifiers.typesystem);
    const props = {
        __id: CommandManagerId,
        server,
    };
    return new AbstractCommandManager(
        props,
        typesystem.verifyF('CommandManagerProps'),
        typesystem.verifyF('CommandManagerState'),
        typesystem.assertPartialF('CommandManagerState')
    );
});
export const defaultTempIdProviderProvider = AbstractProvider.create(() => {
    return new TempIdProvider();
});