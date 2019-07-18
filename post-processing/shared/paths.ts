import * as path from 'path';
import * as fs from 'fs';

export namespace Paths {
    var rootPath: string | null;

    export function getRoot() {
        if (rootPath == null) {
            rootPath = process!.mainModule!.paths
                .map(x=>path.resolve(path.join(x, '../')))
                .filter((x)=>fs.existsSync(path.join(x, '.touchstone-E0489D70-1A9F-41BD-9D63-3E7FBD5AB83C')))
                .shift() || null;
        }
        return rootPath;
    }

    export function getOutputPath() {
        return path.join(getRoot()!, 'data/');
    }

    export function getInputPath() {
        return path.join(getRoot()!, 'images/trim/content/14/jpeg/');
    }

    export namespace Filters {
        export const nonResourceForks = (x: string): boolean => x.match(/^(\._|\.DS_Store)/) === null;
        export const hasJpegExtension = (x: string): boolean => x.match(/\.jpe?g$/i) !== null;
    }
}
