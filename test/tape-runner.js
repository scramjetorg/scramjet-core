const {DataStream} = require('../');
const test = require("tape");
const tTest = (t) => {
    return Object.assign(t, {
        expect: t.plan,
        done: t.end,
        equals: t.equal
    });
};

const mpath = require('path');

const reporter = ({tests, name}) => {
    const ok = !tests.find(({ok}) => !ok);

    console.error(ok ? "✓" : "✗", name);

    tests.forEach(
        ({ok, operator, actual, expected, name, error}) => {
            console.error('    ', ok ? "✓" : "✗", `${operator}(${name})`);
            if (error) {
                console.error('    ', error);
            }
            if (!ok && actual) {
                console.error('     => actual:', actual, 'expected:', expected)
            }
        }
    )

    return {name, ok};
};

const flattenTests = ({tests, conf = {}, prefix = ''}) => {
    return {
        name: prefix,
        tests: Object.keys(tests)
            .reduce((acc, name) => {
                if (typeof tests[name] === "function") {
                    acc.push({
                        name: `${prefix}`,
                        conf,
                        async exec(t) {
                            return tests[name](tTest(t));
                        }
                    });

                    return acc;
                } else if (typeof tests[name] === "object") {
                    return acc.concat(flattenTests({tests: tests[name], conf, prefix: prefix + '/' + name}).tests);
                }
            }, [])
    };
};

const runTests = ({name, tests}) => {
    const htest = test.createHarness();

    let current = null;
    const acc = new DataStream;

    htest.createStream({objectMode: true})
        .pipe(new DataStream)
        .each((chunk) => {
            switch (chunk.type) {
                case "test":
                    current = Object.assign({}, chunk, {
                        tests: []
                    })
                    break;
                case "assert":
                    current.tests.push(chunk);
                    break;
                case "end":
                    const last = current;
                    current = null;
                    return acc.whenWrote(last);
            }
        })
        .on("end", () => acc.end())
    ;

    DataStream.fromArray(tests)
        .map(({name, conf, exec}) => htest(name, conf, exec))
        .catch(e => {
            console.error("Error!", e && e.stack)
        });

    return acc
        .map(reporter)
        .toArray()
        .then((result) => ({
            name,
            result,
            ok: !result.find(({ok}) => !ok)
        }))
};

module.exports = (conf) => {
    return new DataStream()
        .map(({path}) => ({
            prefix: mpath.basename(path).replace(/\.js$/, ''),
            conf,
            tests: require(path)
        }))
        .map(flattenTests)
        .map(runTests)
        .until(
            ({name, ok}) => {
                if (!ok) throw new Error(`Unit test errors occurred in ${name}`);
                return;
            }
        );
};

module.exports.flattenTests = flattenTests;
module.exports.runTests = runTests;
