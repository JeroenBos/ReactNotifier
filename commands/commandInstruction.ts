import 'rxjs/add/operator/toPromise';
import { CommandState } from './inputTypes';

export class CommandInstruction {
    public readonly eventArgs: Exclude<any, null | undefined>;

    public constructor(
        public readonly commandName: string,
        public readonly viewModelId: number,
        eventArgs?: CommandState) {

        this.eventArgs = eventArgs || 'null';
    }
}
