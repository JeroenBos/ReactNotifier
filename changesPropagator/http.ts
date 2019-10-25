import { CommandInstruction } from "../commands/commandInstruction";
import { IResponse } from "./ChangesPropagator";

export interface Http {
    post(url: string, data: CommandInstruction | {}): Promise<IResponse>;
    get(url: string, data: any): Promise<any>
}
