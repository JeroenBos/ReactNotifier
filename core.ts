export function assert(expr: boolean, message = "Assertion failed") {
    if (!expr) {
        throw new Error(message);
    }
}
/** Asserts that all elements in the specified sequence are equal, or whether the function is empty. */
export function assertAreIdentical<T>(sequence: Iterable<T>, message = "Assertion failed") {
    let hasElements = false;
    let element = undefined;
    for (const e in sequence) {
        if (!hasElements)
            element = e;
        else if (element != e)
            throw new Error(message);
    }
}


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

export type Grouping<TKey, T> = { key: TKey, elements: T[] };

export function groupBy<TKey, TSource>(sequence: TSource[], keySelector: (key: TSource) => TKey): Grouping<TKey, TSource>[] {
    // fock that shit, I can't figure out the type signature of https://stackoverflow.com/a/34890276/308451

    const result: { key: TKey, elements: TSource[] }[] = [];

    sequence.forEach(element => {
        const key = keySelector(element);
        const collection = result.find(collection => collection.key == key); // PERF: dictionary to index in result
        if (collection === undefined) {
            result.push({ key, elements: [element] });
        }
        else {
            collection.elements.push(element);
        }
    });

    return result;

    // there. done. that was way faster than understanding that JS BS
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

export function isEmptyObject(obj: any): obj is {} {
    const result = Object.keys(obj).length === 0 && obj.constructor === Object;
    return result;
}
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type UncheckedOmit<T, K> = Pick<T, Exclude<keyof T, K>>;