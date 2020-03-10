import arango, {DocumentCollection, aql, Database, EdgeCollection} from 'arangojs';
import {Paths} from './shared/paths';
import * as _ from 'lodash';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const settings = require('./settings').arango;

import {IFile, IImage, File, Image, ISize} from './pbuff';
import {RGB} from './shared/colors';
import {BasicObject, createOrReplaceDocumentCollection, createOrReplaceEdgeCollection, Schema} from './shared/arango';
const CollectionNames = Schema.Constants.Collections;

async function main() {
    const db = arango({url: settings.host})
        .useDatabase(settings.db);
    db.useBasicAuth(settings.user, settings.pass);

    const imageCollection = await createOrReplaceDocumentCollection(db, CollectionNames.Images);
    const colorCollection = await createOrReplaceDocumentCollection(db, CollectionNames.Colors);
    const colorAssociations = await createOrReplaceEdgeCollection(db, CollectionNames.ColorAssociations);

    const nonResourceForks = Paths.Filters.nonResourceForks;

    const files = await (<Promise<string[]>>new Promise((resolve, reject) => {
        fs.readdir(Paths.getOutputPath(), function (err: NodeJS.ErrnoException, items: string[]) {
            if (!_.isNil(err)) {
                reject(err);
            } else {
                resolve(items.filter(nonResourceForks).map((x) => path.join(Paths.getOutputPath(), x)));
            }
        });
    }))
    .then(async (files) => {
        const countKey = '*cnt';
        const chunkingSize = 1000;
        let char = 0;
        const maxWide = 50;

        let writeOne = (x: string) => {
            process.stdout.write(x);
            char++;

            if ((char % maxWide) == 0) {
                char = 0;

                process.stdout.write("\r\n");
            }
        };

        for (let fileIdx = 0; files.length > fileIdx; fileIdx++) {
            const filePath = files[0];
            console.log(`Processing file ${filePath}:`);
            const file = File.decode(fs.readFileSync(filePath));
            const keyBase = filePath.replace(Paths.getOutputPath(), '');

            const images = file.imgs.map((image) => {
                const fileEntry = image;
                const fileRecKey = fileEntry.path;
                return {doc: {_key: fileRecKey, width: fileEntry.size!.width, height: fileEntry.size!.height}, obj: image};
            });

            await imageCollection.import(images.map((x) => x.doc));

            for (let imgIdx = 0; images.length > imgIdx; imgIdx++) {
                const fileEntry = images[imgIdx].obj;
                const fileRecKey = images[imgIdx].doc._key;
                console.log(`Processing image ${fileRecKey}:`);
                char = 0;

                const colors = fileEntry.colors!.map((c) => {
                    const color : BasicObject = RGB.fromInteger(c);

                    color['_key'] = `RGB(${color.r},${color.g},${color.b})`;
                    color[countKey] = 0;

                    return color;
                });

                const individualColors = _.chain(colors)
                    .reduce((coll, item) => {
                        if (!(item._key in coll)) {
                            coll[<string>item._key] = item;
                        }

                        (<BasicObject>coll[<string>item._key])[countKey] = 1 + <number>(<BasicObject>coll[<string>item._key])[countKey];
                        return coll;
                    }, <BasicObject>{})
                    .reduce((coll, value) => {
                        coll.push(<BasicObject>value);
                        return coll;
                    }, <BasicObject[]>[]).value();

                for (let i = 0; i < individualColors.length; i += chunkingSize) {
                    writeOne("C");
                    let chunk = individualColors.slice(i, i + chunkingSize);
                    await colorCollection.import(chunk.map(x => _.omit(x, [countKey])), {onDuplicate: 'ignore'});

                    writeOne("A");
                    await colorAssociations.import(chunk.map((color) => {
                        return {_from:`${CollectionNames.Images}/${fileRecKey}`, _to:`${CollectionNames.Colors}/${color._key}`, count:color[countKey]};
                    }));
                }

                console.log(` `);
            }
        }
    });
}

main();
