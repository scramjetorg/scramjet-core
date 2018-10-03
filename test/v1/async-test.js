const DataStream = require(process.env.SCRAMJET_TEST_HOME || "../../").DataStream;
const StreamError = require(process.env.SCRAMJET_TEST_HOME || "../../").errors.StreamError;

const getStream = () => {
    const ret = new DataStream();
    let cnt = 0;
    for (let i = 0; i < 100; i++)
        ret.write({val: cnt++});
    process.nextTick(() => ret.end());
    return ret;
};

const decorateAsynchronously = async (chunk) => new Promise((res) => {
    setTimeout(
        () => res(Object.assign({ref: true}, chunk)),
        7+3*(chunk.val%4)
    );
});

const decorateAsynchronouslyWithError = async (chunk) => {
    if (chunk.val === 22) {
        return new Promise((res, rej) => {
            setTimeout(() => rej(new Error("Err")), 100);
        });
    } else {
        return decorateAsynchronously(chunk);
    }
};

const decorateAsynchronouslyWithLotsOfErrors = async (chunk) => {
    if (!(chunk.val % 4)) {
        throw new Error("err");
    } else {
        return decorateAsynchronously(chunk);
    }
};

module.exports = {
    test_ok(test) {
        test.expect(3);
        const a = [];
        getStream()
            .map(decorateAsynchronously)
            .each((i) => a.push(i))
            .on(
                "end",
                () => {
                    test.ok(a[0].ref, "called asynchronous map");
                    test.equals(a.length, 100, "accumulated all items");
                    test.ok(
                        a[0].val === 0 &&
                        a[1].val === 1 &&
                        a[2].val === 2 &&
                        a[3].val === 3,
                        "Order should be preserved " + JSON.stringify(a[3])
                    );
                    test.done();
                }
            )
            .on(
                "error",
                (e) => test.ok(false, "should not fail! " + e)
            );
    },
    test_err(test) {
        if (process.env.TRAVIS === "true")
            return test.done();

        test.expect(3);

        getStream()
            .map(decorateAsynchronouslyWithError)
            .once("error", (e, chunk) => {
                test.ok(true, "Should emit error");
                test.ok(e instanceof Error, "Thrown should be an instance of Error");
                test.equals(chunk.val, 22, "Should error on and pass catch 22... I mean chunk...");
                test.done();
            })
            .once("end", () => {
                test.fail("Should not end!");
                test.done();
            });
    },
    test_error_flow(test) {
        test.expect(2);

        let z = 0;
        getStream()
            .map(decorateAsynchronouslyWithLotsOfErrors)
            .catch((e, chunk) => (z++, chunk))
            .toArray()
            .then(
                ret => {
                    test.equals(z, 25, "Should call catch on every fourth element");
                    test.equals(ret.length, 100, "Should contain all elements");
                    test.done();
                },
                err => {
                    test.fail(err, "Should not throw");
                    test.done();
                }
            )
        ;
    },
    test_error_filtering(test) {
        test.expect(2);

        let z = 0;
        getStream()
            .map(decorateAsynchronouslyWithLotsOfErrors)
            .catch(() => (z++, undefined))
            .toArray()
            .then(
                ret => {
                    test.equals(z, 25, "Should call catch on every fourth element");
                    test.equals(ret.length, 75, "Should contain all elements");
                    test.done();
                },
                err => {
                    test.fail(err, "Should not throw");
                    test.done();
                }
            )
        ;
    },
    test_catch(test) {
        test.expect(5);

        getStream()
            .map(decorateAsynchronouslyWithError)
            .catch(({cause, chunk}) => {
                test.equal(cause.message, "Err", "Should pass the error in {cause}");
                test.equal(chunk.val, 22, "Should fail on the catch 22... chunk...");
            })
            .toArray()
            .then(
                ret => {
                    test.equals(ret.length, 99, "Should contain all items except one");
                    test.equals(ret[21].val, 21, "Should preserver order of elements (part 1)");
                    test.equals(ret[22].val, 23, "Should preserver order of elements (part 2)");
                    test.done();
                },
                err => {
                    test.fail(err);
                    test.done();
                }
            );
    },
    test_catch_chaining(test) {
        test.expect(10);

        let cause1 = null;

        getStream()
            .map(decorateAsynchronouslyWithError)
            .catch(({cause, chunk}) => {
                test.equal(cause.message, "Err", "Should pass the error in {cause}");
                test.equal(chunk.val, 22, "Should fail on the catch 22... chunk...");
                cause1 = cause;
                throw cause;
            })
            .catch((err) => {
                const {cause, chunk} = err;

                test.ok(err instanceof StreamError, "Should be passing StreamErrors");
                test.equal(cause1, cause, "Should pass on the same cause");
                test.equal(chunk.val, 22, "Should pass on the same chunk");
                throw (cause1 = new Error("Err2"));
            })
            .pipe(new DataStream())
            .catch(({cause}) => {
                test.equal(cause1, cause, "Should pass the new error");
                throw cause;
            })
            .pipe(new DataStream())
            .catch(({cause}) => {
                test.equal(cause1, cause, "Should pass the new error");
            })
            .toArray()
            .then(
                ret => {
                    test.equals(ret.length, 99, "Should not reject and contain all items except one");
                    test.equals(ret[21].val, 21, "Should preserver order of elements (part 1)");
                    test.equals(ret[22].val, 23, "Should preserver order of elements (part 2)");
                    test.done();
                },
                err => {
                    test.fail(err);
                    test.done();
                }
            );


    }
};
