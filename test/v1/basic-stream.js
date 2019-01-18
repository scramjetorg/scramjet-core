const {PromiseTransformStream} = require(process.env.SCRAMJET_TEST_HOME || "../../");

const getStream = (x = 100) => {
    const ret = new PromiseTransformStream();
    let cnt = 0;
    for (let i = 0; i < x; i++)
        ret.write({val: cnt++});
    process.nextTick(() => ret.end());
    return ret;
};
const arr = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
    20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
    30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
    40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
    50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
    60, 61, 62, 63, 64, 65, 66, 67, 68, 69
];

const fromArray = (arr) => {
    const ret = new PromiseTransformStream();

    for (const item of arr)
        ret.write(item);
    ret.end();
    return ret;
};

const toArray = async (stream) => {
    const ret = [];

    stream.on("data", (x) => ret.push(x));

    await stream.whenEnd();
    return ret;
};

module.exports = {
    test_pipe: {
        async sync(test) {
            test.expect(1);
            const input = arr.slice();
            const output = arr.slice();

            const src = new PromiseTransformStream({
                promiseRead(many) {
                    return input.splice(0, many);
                }
            });
            const tgt = new PromiseTransformStream({
                promiseWrite(chunk) {
                    if (output.indexOf(chunk) > -1) output.splice(output.indexOf(chunk), 1);
                }
            });

            await src.pipe(
                new PromiseTransformStream({promiseTransform(chunk) {
                    return chunk+2;
                }})
            ).pipe(
                tgt
            ).whenFinished();

            test.deepEqual(output, [0, 1], "All chunks but two removed");
            test.done();
        }
    },
    test_read: {
        async starve(test) {
            test.expect(2);
            const comp = arr.slice();
            const stream = new PromiseTransformStream({promiseRead() {
                return comp.splice(0, 1);
            }});
            test.ok(stream instanceof PromiseTransformStream, "Stream still implements a PromiseTransformStream");

            const ret = await toArray(stream);
            test.deepEqual(ret, arr, "Stream must read the array in sync");
            test.done();
        },
        async sync(test) {
            test.expect(2);
            const comp = arr.slice();
            const stream = new PromiseTransformStream({parallelRead(many) {
                return comp.splice(0, many);
            }});
            test.ok(stream instanceof PromiseTransformStream, "Stream still implements a PromiseTransformStream");

            const ret = await toArray(stream);
            test.deepEqual(ret, arr, "Stream must read the array in sync");
            test.done();
        },
        async async(test) {
            test.expect(2);
            const comp = arr.slice();
            const stream = new PromiseTransformStream({async promiseRead(many) {
                return new Promise((res) => process.nextTick(() => res(comp.splice(0, many))));
            }});
            test.ok(stream instanceof PromiseTransformStream, "Stream still implements a PromiseTransformStream");

            const ret = await toArray(stream);
            test.deepEqual(ret, arr, "Stream must read the array in async");
            test.done();
        }
    },
    test_write: {
        async sync(test) {
            const stream = fromArray([1, 2, 3, 4]);
            const comp = [];
            await stream.pipe(
                new PromiseTransformStream({
                    async promiseWrite(chunk/* , encoding*/) {
                        comp.push(chunk);
                    }
                })
            ).whenFinished();

            test.deepEqual(comp, [1, 2, 3, 4], "Should write all chunks in order");
            test.done();
        },
        async async(test) {
            const stream = fromArray([1, 2, 3, 4]);
            const arr = [];
            await stream.pipe(
                new PromiseTransformStream({
                    promiseWrite(chunk/* , encoding*/) {
                        return new Promise((res) => setTimeout(() => {
                            arr.push(chunk);
                            res();
                        }, 30 + chunk % 2 * 40));
                    }
                })
            ).whenFinished();

            test.deepEqual(arr, [1, 2, 3, 4], "Should write all chunks in order");
            test.done();
        }
    },
    test_transform: {
        sync(test) {
            // TODO: Implement tests here.
            test.done();
        },
        async async(test) {
            // TODO: Implement tests here.
            test.done();
        }
    },
    test_when: {
        end(test) {
            test.expect(2);

            let ended = false;
            let notDone = true;

            const stream = getStream().pipe(new PromiseTransformStream({
                promiseTransform: (a) => a
            })).resume();

            stream.on("end", () => {
                ended = true;
            });

            (async () => {
                await stream.whenEnd();
                notDone = false;
                test.ok(ended, "Stream is ended");
                test.done();
            })()
                .catch(
                    (err) => {
                        test.ok(false, "Should not throw: " + err.stack);
                    }
                )
            ;

            test.ok(notDone, "Does not resolve before the stream ends");
        }
    },
    test_options: {
        set(test) {
            const x = new PromiseTransformStream({test: 1});
            test.equals(x._options.test, 1, "Option can be set in constructor");

            x.setOptions({test: 2, maxParallel: 17});
            test.equals(x._options.test, 2, "Any option can be set");
            test.equals(x._options.maxParallel, 17, "Default options can be set at any point");

            test.done();
        },
        fromReferrer(test) {
            const x = new PromiseTransformStream({test: 1});
            const y = new PromiseTransformStream({test: 3});

            x.pipe(y);
            x.setOptions({test: 2, maxParallel: 17});

            test.equals(y._options.referrer, x, "Referrer is set correctly");
            test.equals(x._options.test, 2, "Any option can be set");
            test.equals(y._options.test, 3, "Own option is always more important than referrer's");
            test.equals(y._options.maxParallel, 17, "Options are passed from referrer even if set after the reference");
            test.done();
        }
    }
};
