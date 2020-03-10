import * as _ from 'lodash';

export type ChunkSet<T> = {items: T[], idx: number}

export function chunkThrottle<T>(array: T[], chunk: number, throttle: number, promiseFunction: (set:ChunkSet<T>[]) => void) {
    _.chain(array)
        .chunk(chunk)
        .map((x, i)=>({items:x, idx:i}))
        .chunk(throttle)
        .value()
        .reduce(async (previousPromise, nextItem) => {
            await previousPromise;
            return promiseFunction(nextItem);
        }, Promise.resolve());
}
