import { CommandInstruction } from "../commands/commandInstruction";
import { IResponse } from "./ChangesPropagator";

export interface Http {
    // it returns a Promise, whereas the Angular Http post method returns an observable. 
    // This means we have to build an adapter in case we want to use angular.
    post(url: string, data: CommandInstruction | {}): Promise<IResponse>;
}
