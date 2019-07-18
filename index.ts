interface IPage {
    citation: string;
    d: string;
    dzi: string;
    enum: string;
    h: number;
    s: string;
    t: string;
    w: number;
}
interface IBook {
    file_ext: string;
    root: string;
    thumb_ext: string;
    volume_count: number;
    pages: IPage[];
}

interface Paths {
    relative: string;
    url: string;
    disk: string;
}

const data = <IBook> require('./data.js');
const { spawnSync } = require('child_process');
const { dirname } = require("path");

const paths = data.pages.map((page, idx, pages) => {
    return <Paths> {
        relative: page.d,
        url: data.root + page.d,
        disk: '.' + page.d
    }
});

paths.forEach( (pathset, idx, all) => {
    spawnSync('mkdir', ['-p', dirname(__dirname+ '/' +pathset.relative)]);
    spawnSync('curl', [ pathset.url, '-o', __dirname+ '/' + pathset.relative ]);
    console.log("Completed "+__dirname+ '/' + pathset.relative+".");
});

console.log("Done");