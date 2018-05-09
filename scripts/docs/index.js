const fg = require("fast-glob");
const {DataStream} = require('scramjet');
const fs = require('fs');

const targets = {
    'readme': 'esdoc/README.md',
    'index': 'esdoc/index.md',
    'string-stream': 'esdoc/string-stream.md'
};
const outputs = Object.entries(targets).reduce(
    (acc, [id, file]) => {
        const out = new DataStream();
        out
            .stringify(x => JSON.stringify(x) + '\n')
            .pipe(fs.createWriteStream(file));
        acc[id] = out;
        return acc;
    },
    {}
);

(async ({useInternal}) => {

    const pkgDir = await (require('pkg-dir')(__dirname));

    const ret = await (fg
        .stream(['lib/*.js'], {cwd: pkgDir})
        .pipe(new DataStream)
        .setOptions({pkgDir})
        .use('./espree')
        .use('./doctrine')
        .use('./signatures')
        .filter(({tags: {ignore, internal}}) => !ignore && (useInternal || !internal))
        .assign(({tags = {}, scope = '', file}) => {
            file = file.replace(/(^.*\/)|(\.[\w\d]+$)/g, '');
            const includedoc = tags.includedoc && tags.includedoc.description && tags.includedoc.description.split(/\s+/) || [];
            const output = ['all', file, scope, ...includedoc];
            return {output};
        })
        .map(
            async chunk => Promise.all(
                chunk.output
                    .filter(id => id in outputs)
                    .map(
                        id => outputs[id].whenWrote(chunk)
                    )
            )
        )
    );

    return ret
        .catch(e => (console.error("err", e), Promise.reject(e)))
        .each(x => console.error(x.output, x.signature))
        .run()
    ;
})({}).catch(e => (console.error(e), process.exit(1)));
