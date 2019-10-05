import 'rxjs/add/operator/toPromise';
import { BaseProps } from '../base.interfaces';
import { CommandArgs } from './inputTypes';

export class CommandInstruction {
    public readonly commandName: string;
    public readonly viewModelId: number;
    public readonly eventArgs: Exclude<any, null | undefined>;

    public constructor(
        commandName: string,
        viewModel: BaseProps | number,
        eventArgs?: CommandArgs) {

        this.commandName = commandName;
        this.viewModelId = isNumeric(viewModel) ? viewModel : viewModel.__id;
        this.eventArgs = eventArgs || 'null';
    }
}


function isNumeric(n: any): n is number {
    return !isNaN(parseFloat(n)) && isFinite(n);
}