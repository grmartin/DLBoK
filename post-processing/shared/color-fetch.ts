import arango from 'arangojs';
import {Schema} from './arango';
import {AggregatedColor} from './palette';

const fs = require('fs');

const CollectionNames = Schema.Constants.Collections;

// The Arango aggregation over 64M colorAssociations rows is slow (~70s) and
// is unaffected by any downstream palette tunables, so its result is cached
// on disk and reused until forceRefresh is requested.
const FETCH_CACHE_PATH = `${__dirname}/../.aggregated-colors-cache.json`;

async function fetchAggregatedColorsFromArango(): Promise<AggregatedColor[]> {
    const settings = require('../settings').arango;
    const db = arango({url: settings.host}).useDatabase(settings.db);
    db.useBasicAuth(settings.user, settings.pass);

    const cursor = await db.query(`
        FOR a IN ${CollectionNames.ColorAssociations}
            COLLECT color = a._to
            AGGREGATE cnt = SUM(a.count)
            LET c = DOCUMENT(color)
            RETURN {r: c.r, g: c.g, b: c.b, count: cnt}
    `);

    return await cursor.all();
}

export async function fetchAggregatedColors(forceRefresh: boolean = false): Promise<AggregatedColor[]> {
    if (!forceRefresh && fs.existsSync(FETCH_CACHE_PATH)) {
        console.error(`Using cached aggregated colors from ${FETCH_CACHE_PATH} (pass --refresh to re-fetch).`);
        return JSON.parse(fs.readFileSync(FETCH_CACHE_PATH, 'utf8'));
    }

    const colors = await fetchAggregatedColorsFromArango();
    fs.writeFileSync(FETCH_CACHE_PATH, JSON.stringify(colors));
    return colors;
}
