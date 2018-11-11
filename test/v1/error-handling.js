const {DataStream} = require(process.env.SCRAMJET_TEST_HOME || "../../");

const arr = [
    0,  1,  2,  3,  4,  5,  6,  7,  8,  9,
    10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
    20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
    30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
    40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
    50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
    60, 61, 62, 63, 64, 65, 66, 67, 68, 69,
    70, 71, 72, 73, 74, 75, 76, 77, 78, 79,
    80, 81, 82, 83, 84, 85, 86, 87, 88, 89,
    90, 91, 92, 93, 94, 95, 96, 97, 98, 99,
];

// ------- stream sources -------

const sources = {
    simple_error: (ref) => DataStream
        .from(arr)
        .map(x => {
            if (x === 84) throw (ref.thrown = new Error("Eight and fourty"));
            return {x};
        }),

    sync_iterator_and_items: (ref) => DataStream
        .from({
            [Symbol.iterator]: function* () {
                yield* arr.slice(0, 84).map(x => ({x}));
                yield Promise.reject(ref.thrown = new Error("Eight and fourty"));
                yield* arr.slice(85).map(x => ({x}));
            }
        }),

    sync_iterator_async_items: (ref) => DataStream
        .from({
            [Symbol.iterator]: function* () {
                yield* arr.slice(0, 84).map(x => new Promise(res => res({x})));
                yield new Promise((res, rej) => rej(ref.thrown = new Error("Eight and fourty")));
                yield* arr.slice(85).map(x => new Promise(res => res({x})));
            }
        })
};

// ------- stream transform types -------

const transforms = {
    none: (stream) => stream,

    piped: (stream) => stream
        .pipe(new DataStream())
        .map(({x}) => ({a: 1, x})),

    tapped: (stream) => stream
        .tap()
        .map(({x}) => ({a: 1, x})),

    mergeable: (stream) => stream
        .map(({x}) => ({a: 1, x}))

};

// ------- stream error handling tests -------
const tests = {
    entry_count: (errorStream, transform, test) => {
        test.expect(1);

        const ref = {thrown: {}};
        errorStream(ref)
            .use(transform, ref)
            .catch(() => undefined)
            .toArray()
            .then(
                (arr) => test.equals(arr.length, 99, "Should contain one less item"),
                () => test.ok(false, "Should not reject if error was handled")
            )
            .then(
                () => test.done()
            )

        ;

    },

    in_promise: (errorStream, transform, test) => {
        test.expect(2);

        const ref = {thrown: {}};
        errorStream(ref)
            .use(transform, ref)
            .run()
            .catch(e => {
                test.equals(e.cause, ref.thrown, "Should throw the wrapped error");
                test.equals(e.cause.message, "Eight and fourty", "Should convey the message");
            })
            .then(() => test.done());
    },

    in_catch: (errorStream, transform, test) => {
        test.expect(2);

        const ref = {thrown: {}};
        errorStream(ref)
            .use(transform, ref)
            .catch(e => {
                test.equals(e.cause, ref.thrown, "Should throw the wrapped error");
                test.equals(e.cause.message, "Eight and fourty", "Should convey the message");
            })
            .run()
            .catch(() => test.ok(false, "Must not call catch if error already caught"))
            .then(() => test.done());
    },

    in_handler: (errorStream, transform, test) => {
        test.expect(1);

        const ref = {thrown: {}};
        errorStream(ref)
            .use(transform, ref)
            .run()
            .then(
                () => test.ok(false, "Should not resolve if error was unhandled"),
                () => test.ok(true, "Must not call catch if error already caught")
            )
            .then(
                () => test.done()
            );
    }
};

// ------- Other cases -------

const otherTests = {
    failing_iterator_accessor(test) {
        test.expect(2);

        let thrown;
        DataStream
            .from({
                [Symbol.iterator]: function () {
                    throw (thrown = new Error("Not even one"));
                }
            })
            .run()
            .catch(e => {
                test.equals(e.cause, thrown, "Should throw the wrapped error");
                test.equals(e.cause.message, "Not even one", "Should convey the message");
            })
            .then(() => test.done());
    },
    failing_generator(test) {
        test.expect(2);

        let thrown;
        DataStream
            .from(function* () {
                yield 1;
                throw (thrown = new Error("All but one"));
            })
            .run()
            .catch(e => {
                test.equals(e.cause, thrown, "Should throw the wrapped error");
                test.equals(e.cause.message, "All but one", "Should convey the message");
            })
            .then(() => test.done());
    }
};

// ------- Output -------

module.exports = Array
    .from(function* genRet() {
        for (let [sourceName, sourceFunction] of Object.entries(sources))
            for (let [transformName, transformFunction] of Object.entries(transforms))
                for (let [testName, testFunction] of Object.entries(tests))
                    yield [
                        `source:${sourceName} transform:${transformName} test:${testName}`,
                        (test) => testFunction(sourceFunction, transformFunction, test)
                    ];
    }())
    .concat(Object.entries(otherTests))
    .reduce((acc, [k, v]) => (acc[k] = v, acc), {});

