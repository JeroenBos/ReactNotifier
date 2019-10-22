import 'rxjs/add/operator/toPromise';
import { CommandArgs } from './inputTypes';

export class CommandInstruction {
    public readonly eventArgs: Exclude<any, null | undefined>;

    public constructor(
        public readonly commandName: string,
        public readonly viewModelId: number,
        eventArgs?: CommandArgs) {

        this.eventArgs = eventArgs || 'null';
    }
}
