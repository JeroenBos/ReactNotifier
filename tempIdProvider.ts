import { UNINITIALIZED_ID } from "./base.interfaces";

export class TempIdProvider {
    private counter = UNINITIALIZED_ID - 1;
    public next(): number {
        return this.counter--;
    }
}