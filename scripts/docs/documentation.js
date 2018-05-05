const {promisify} = require('util');
const fg = require("fast-glob");
const {DataStream} = require('scramjet');
const path = require("path");
const fs = require('fs');
const espree = require('espree');
const doctrine = require('doctrine');

const parser = require('./parser');
const mapper = require('./mapper');
const signatures = require('./signatures');

(async () => {

    const out = new DataStream();
    const ws = new Set();

    const pkgDir = await (require('pkg-dir')(__dirname));

    const ret = await (fg
        .stream(['lib/*.js'], {cwd: pkgDir})
        .pipe(new DataStream)
        .map(async file => ({
            file: file.replace(path.sep, '/'),
            basename: path.basename(file),
            content: await promisify(fs.readFile)(path.resolve(pkgDir, file))
        }))
        .assign(({content}) => ({ast: espree.parse(content, {
            ecmaVersion: 8,
            attachComment: true,
            loc: true,
            sourceType: "module"
        })}))
        .catch(
            e => out.raise(e)
        )
        .reduceNow(
            parser,
            out
        )
        .map(
            (espree) => {
                const doc = espree.doc;

                let doctrineOutput = {};
                if (doc && doc.source) {
                    doctrineOutput = doctrine.parse(doc.source, {unwrap: true, sloppy: true});

                    doctrineOutput.tags.forEach(x => {
                        (doctrineOutput[x.title] || (doctrineOutput[x.title] = [])).push(x);
                    });
                    delete doctrineOutput.tags;
                }

                return {
                    espree,
                    doctrine: doctrineOutput
                };
            }
        )
        .map(mapper)
        .assign(signatures)
        .each(console.error)
        .run()
    );

    return ret;
})().catch(e => (console.error(e), process.exit(1)));
