import {Paths} from './shared/paths';
import * as _ from 'lodash';
import {createOrReplaceDocumentCollection, createOrReplaceEdgeCollection, Schema} from './shared/arango';
import {ChunkSet, chunkThrottle} from './shared/chunking';
import arango from 'arangojs';

const fs = require('fs');
const path = require('path');
const settings = require('./settings').arango;
const { Worker } = require('worker_threads');

const CollectionNames = Schema.Constants.Collections;

const NUM_CONCUR_SETS = 15;
const NUM_PER_SET = 1;

const START_TIME = new Date();

async function main() {
    const db = arango({url: settings.host})
        .useDatabase(settings.db);
    db.useBasicAuth(settings.user, settings.pass);

    // We need these to exist before we try to access them in the workers.
    await createOrReplaceDocumentCollection(db, CollectionNames.Images);
    await createOrReplaceDocumentCollection(db, CollectionNames.Colors);
    await createOrReplaceEdgeCollection(db, CollectionNames.ColorAssociations);

    const nonResourceForks = Paths.Filters.nonResourceForks;

    const files = await (<Promise<string[]>>new Promise((resolve, reject) => {
        fs.readdir(Paths.getOutputPath(), function (err: NodeJS.ErrnoException, items: string[]) {
            if (!_.isNil(err)) {
                reject(err);
            } else {
                resolve(items.filter(nonResourceForks).map((x) => path.join(Paths.getOutputPath(), x)));
            }
        });
    }));

    function runService(workerData: ChunkSet<string>) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(`${__dirname}/add-to-arango-service.js`, { workerData });
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
