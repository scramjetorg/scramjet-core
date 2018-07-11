const scramjet = require(process.env.SCRAMJET_TEST_HOME || "../../");

module.exports = {
    test_plugin(test) {
        test.ok(typeof scramjet.plugin === "function", "Must expose 'plugin'");
        test.done();
    },
    test_BufferStream(test) {
        test.ok(typeof scramjet.BufferStream === "function", "Must expose ctor for 'BufferStream'");
        let stream;
        test.doesNotThrow(() => stream = new scramjet.BufferStream(), Error, "Must be able to construct 'BufferStream' with no args");
        test.ok(stream instanceof scramjet.PromiseTransformStream, "Must extend 'PromiseTransformStream'");
        test.done();
    },
    test_DataStream(test) {
        test.ok(typeof scramjet.DataStream === "function", "Must expose ctor for 'DataStream'");
        let stream;
        test.doesNotThrow(() => stream = new scramjet.DataStream(), Error, "Must be able to construct 'DataStream' with no args");
        test.ok(stream instanceof scramjet.PromiseTransformStream, "Must extend 'PromiseTransformStream'");
        test.done();
    },
    test_StringStream(test) {
        test.ok(typeof scramjet.StringStream === "function", "Must expose ctor for 'StringStream'");
        let stream;
        test.doesNotThrow(() => stream = new scramjet.StringStream(), Error, "Must be able to construct 'StringStream' with no args");
        test.ok(stream instanceof scramjet.PromiseTransformStream, "Must extend 'PromiseTransformStream'");
        test.done();
    },
    test_MultiStream(test) {
        test.ok(typeof scramjet.MultiStream === "function", "Must expose ctor for 'MultiStream'");
        test.doesNotThrow(() => new scramjet.MultiStream(), Error, "Must be able to construct 'MultiStream' with no args");
        test.done();
    },
    test_PromiseTransformStream(test) {
        test.ok(typeof scramjet.PromiseTransformStream === "function", "Must expose ctor for 'PromiseTransformStream' with no args");
        test.doesNotThrow(() => new scramjet.PromiseTransformStream(), Error, "Must be able to construct 'PromiseTransformStream'");
        test.done();
    },
    test_API(test) {
        test.ok(typeof scramjet.API === "function", "Must expose 'API'");
        test.done();
    },
};
