

export namespace PromiseFactory {
    export function create(): { promise: Promise<void>, resolve: () => void } {

        let _resolve: () => void = <any>undefined; // removes warning
        function g<T>(resolve: (value?: T | PromiseLike<T>) => void): void {
            _resolve = resolve;
        }
        const promise = new Promise<void>(g);
        return { promise, resolve: _resolve };
    }

    /**
     * Continues the execution of f after g has finished.
     */
    export async function continueAfter(f: (promise: Promise<any>) => Promise<any>, g: () => void) {
        const { promise, resolve } = PromiseFactory.create();

        const fPromise = f(promise);
        g();
        resolve(); // signals to f that g has finished
        await fPromise;
    }
}

/**
 * Merges 'data' into 'merge'.
 */
export function deepMergeInPlace(merge: any, data: any): void {
    _deepMerge(merge, data, false);
}
/**
 * Returns the (cloned) merge of 'data' into 'merge'.
 */
export function deepMerge(merge: any, data: any): any {
    return _deepMerge(merge, data, true);
}
/**
 * Returns the (cloned) merge of 'data' into 'merge'.
 */
function _deepMerge(merge: any, data: any, mergeInPlace: boolean): any {
    const datatype = typeof data;
    // @ts-ignore:2367
    if (datatype == 'bigint')
        throw new Error();
    switch (datatype) {
        case 'string':
        case 'number':
        case 'boolean':
        case 'undefined':
            return data;
        case 'object':
            if (typeof merge == 'object')
                return deepMergeHelper(mergeInPlace ? merge : { ...merge }, data, mergeInPlace);
            else if (mergeInPlace)
                throw new Error(`Cannot merge type 'object' into type '${typeof merge}'`);
            else
                return deepMergeHelper({}, data, mergeInPlace);
        case 'symbol':
        case 'function':
            throw new Error('argument error');
        default: const _exhaustiveCheck: never = datatype;
            return _exhaustiveCheck;
    }
}
/** @param merge Is assumed to be at least a shallow copy. */
function deepMergeHelper<T extends object>(merge: T, data: object, mergeInPlace: boolean): T {
    for (const s in data) {
        if (s in merge)
            (<any>merge)[s] = _deepMerge((<any>merge)[s], (<any>data)[s], mergeInPlace);
        else
            (<any>merge)[s] = JSON.parse(JSON.stringify((<any>data)[s])); //although this does not clone perfectly, in the use case at hand now, data has already been deserialized
    }
    return merge;
}


export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;