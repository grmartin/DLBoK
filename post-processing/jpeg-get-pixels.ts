import * as _ from 'lodash';
import './shared/colors';
import {Paths} from './shared/paths';
import {ChunkSet, chunkThrottle} from './shared/chunking';
const fs = require('fs');
const path = require('path');
const { Worker } = require('worker_threads');

const NUM_CONCUR_SETS = 4;
const NUM_PER_SET = 2;

const START_TIME = new Date();

async function main() {
    const basePath = Paths.getInputPath();

    const files = await (<Promise<string[]>>new Promise((resolve, reject) => {
        const nonResourceForks = Paths.Filters.nonResourceForks;
        const hasJpegExtension = Paths.Filters.hasJpegExtension;

        fs.readdir(basePath, function (err: NodeJS.ErrnoException, items: string[]) {
            if (!_.isNil(err)) {
                reject(err);
            } else {
                resolve(items.filter(nonResourceForks).filter(hasJpegExtension).map((x) => path.join(basePath, x)));
            }
        });
    })).then((x) => {
        console.debug('Total Files: ', x.length);
        console.debug('Total Sets: ',  x.length/NUM_PER_SET);
        console.debug(`Concurrency: Concurrent Sets: ${NUM_CONCUR_SETS}, Per Set: ${NUM_PER_SET}`);
        console.debug('Destination: ', Paths.getOutputPath());
        console.debug('Start: ', START_TIME);
        return x;
    });

    function runService(workerData: ChunkSet<string>) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(`${__dirname}/jpeg-get-pixels-service.js`, { workerData });
            worker.on('message', resolve);
            worker.on('error', reject);
            worker.on('exit', (code: number) => {
                if (code !== 0)
                    reject(new Error(`Worker stopped with exit code ${code}`));
                else
                    resolve();
            })
        })
    }

    chunkThrottle(files, NUM_PER_SET, NUM_CONCUR_SETS, (sets) => Promise.all(sets.map(runService)));
}

process.on('beforeExit', (code) => {
    console.debug(`Running Time: ${(new Date().getTime()/1000) - (START_TIME.getTime()/1000)} secs`);
    console.debug(`Terminating With Code: ${code}`);
});

main();
