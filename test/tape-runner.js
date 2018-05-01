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

    console.log(ok ? "✓" : "✗", name);

    tests.forEach(
        ({ok, operator, actual, expected, name, error}) => {
            console.log('    ', ok ? "✓" : "✗", `${operator}(${name})`);
            if (error) {
                console.log('    ', error);
            }
            if (!ok && actual) {
                console.log('     => actual:', actual, 'expected:', expected)
            }
        }
    )

    return {name, ok};
};

const flattenTests = ({tests, conf, prefix = ''}) => {
    return {
        name: prefix,
        tests: Object.keys(tests)
            .filter(name => name.indexOf('test') === 0)
            .reduce((acc, name) => {
                if (typeof tests[name] === "function") {
                    acc.push({
                        name: `${prefix}:${name}`,
                        conf,
                        exec(t) {
                            return tests[name](tTest(t));
                        }
                    });

                    return acc;
                } else if (typeof tests[name] === "object") {
                    return acc.concat(flattenTests({tests: tests[name], conf, name: prefix + '/' + name}).tests);
                }
            }, [])
    };
};

const runTests = ({name, tests}) => {
    const htest = test.createHarness();
    DataStream.fromArray(tests)
        .map(({name, conf, exec}) => htest(name, conf, exec));

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
    const ret = new DataStream()
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

    return ret;
};
