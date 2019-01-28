/** @ignore */
const {plgctor} = require("./util/promise-transform-stream");

/**
 * Scramjet main exports expose all the stream classes and a number of methods.
 *
 * All scramjet streams allow writing, reading or transform modes - currently
 * exclusively (meaning you can't have two at once). Any of the scramjet streams
 * can be constructed with the following options passed to mimic node.js standard streams:
 *
 * * `async promiseTransform(chunk)` - transform method that resolves with a single output chunk
 * * `async promiseWrite(chunk)` - write method that that resolves when chunk is written
 * * `async promiseRead(count)` - read method that resolves with an array of chunks when called
 *
 * See {@link https://nodejs.org/api/stream.html#stream_api_for_stream_implementers node.js API for stream implementers for details}
 *
 * The object exposes the following classes:
 *
 * * `DataStream` {@see DataStream} - the basic object stream of any type
 * * `StringStream` {@see StringStream} - a stream of strings
 * * `BufferStream` {@see BufferStream} - a stream of buffers
 * * `MultiStream` {@see MultiStream} - a group of streams
 * * `NumberStream` {@see NumberStream} - a stream of numbers
 * * `WindowStream` {@see WindowStream} - a stream of windows of objects
 *
 * The general concept of Scramjet streams is facilitating node's TransformStream mechanism so that you don't need
 * to create a number of streams and create the pipeline, but use the concept of chaining instead. When you call `parse`
 * method for instance, scramjet creates a new stream, pipes it to the callee and forwards errors.
 *
 * What's worth mentioning - scramjet tries to limit the number of created transform streams and pushes the transforms
 * one after another into the same stream class therefore a code `stream.map(transform1).map(transform2).filter(transform3)`
 * will only operate on a single transform stream that evaluates all three transforms one after another.
 *
 * @module scramjet
 * @extends {Object}
 */
module.exports = {
    /**
     * Creates a DataStream that's piped from the passed readable.
     *
     * @memberof module:scramjet
     * @param {Array|Iterable|GeneratorFunction|AsyncFunction|Readable} stream and node.js readable stream (`objectMode: true` is advised)
     * @returns {DataStream}
     */
    from(stream) {
        return this.DataStream.from(stream);
    },

    /**
     * Creates a DataStream from an Array
     *
     * @memberof module:scramjet
     * @param {Array<*>} args
     * @returns {DataStream}
     */
    fromArray(...args) {
        return this.DataStream.fromArray(...args);
    },

    get ScramjetOptions() { return require("./util/options"); },

    /**
     * Creates a safe wrapper for scramjet transform module. See [Modules documentation](modules.md) for more info.
     *
     * @param {UseCallback} transform
     * @param {CreateModuleOptions} options
     * @param  {...any} initialArgs
     */
    createTransformModule(transform, {StreamClass = module.exports.DataStream} = {}, ...initialArgs) {
        return function (stream, ...extraArgs) {
            return StreamClass.from(stream)
                .use(transform, ...initialArgs, ...extraArgs);
        };
    },

    /**
     * Creates a safe wrapper for scramjet read module. See [Modules documentation](modules.md) for more info.
     *
     * @param {Array|Iterable|AsyncGeneratorFunction|GeneratorFunction|AsyncFunction|Function|String|Readable} anything
     * @param {CreateModuleOptions} options
     * @param  {...any} initialArgs
     */
    createReadModule(anything, {StreamClass = module.exports.DataStream} = {}, ...initialArgs) {
        StreamClass = StreamClass || this.DataStream;

        return (...extraArgs) => {
            return StreamClass.from(anything, ...initialArgs, ...extraArgs);
        };
    },

    /**
     * Options for createModule
     *
     * @typedef CreateModuleOptions
     * @prop {DataStream} StreamClass defines what class should the module assume
     */

    /**
     * Exposes error classes (undocumented)
     *
     * @memberof module:scramjet
     * @readonly
     * @type {ScramjetErrors}
     */
    get errors()  { return require("./util/stream-errors"); },

    /**
     * Provides a lazy-load accessor to BufferStream
     *
     * @inject BufferStream
     * @readonly
     * @memberof module:scramjet
     * @see {@link buffer-stream.md}
     */
    get BufferStream() { return require("./buffer-stream"); },

    /**
     * Provides a lazy-load accessor to DataStream
     *
     * @inject DataStream
     * @readonly
     * @memberof module:scramjet
     * @see {@link data-stream.md}
     */
    get DataStream() { return require("./data-stream"); },

    /**
     * Provides a lazy-load accessor to MultiStream
     *
     * @inject MultiStream
     * @readonly
     * @memberof module:scramjet
     * @see {@link multi-stream.md}
     */
    get MultiStream() { return require("./multi-stream"); },

    /**
     * Provides a lazy-load accessor to StringStream
     *
     * @inject StringStream
     * @readonly
     * @memberof module:scramjet
     * @see {@link string-stream.md}
     */
    get StringStream() { return require("./string-stream"); },

    /**
     * Provides a lazy-load accessor to PromiseTransformStream - the base class of scramjet streams
     *
     * @memberof module:scramjet
     * @class
     */
    get PromiseTransformStream() { return require("./util/promise-transform-stream").PromiseTransformStream; },



    /**
     * Definition of a single mixin for a specific Scramjet class. Should contain any number of stream methods.
     *
     * @typedef {Object} StreamMixin
     * @property {Function} constructor optional constructor that will be called in the stream constructor (this has to be an own property!)
     */

    /**
     * Definition of a plugin in Scramjet
     *
     * @typedef {Object} ScramjetPlugin
     * @memberof module:scramjet
     * @internal
     * @property {StreamMixin} BufferStream definition of constructor and properties for the BufferStream prototype.
     * @property {StreamMixin} DataStream definition of constructor and properties for the DataStream prototype.
     * @property {StreamMixin} MultiStream definition of constructor and properties for the MultiStream prototype.
     * @property {StreamMixin} StringStream definition of constructor and properties for the StringStream prototype.
     */

    /**
     * Add a global plugin to scramjet - injects mixins into prototypes.
     *
     * @memberof module:scramjet
     * @param  {ScramjetPlugin} mixin the plugin object
     * @return {scramjet}
     *
     * @test test/methods/scramjet-plugin.js
     */
    plugin(mixins) {
        for (const key of Object.keys(mixins)) {
            if (key in this) {
                const Mixin = mixins[key];
                const Stream = this[key];
                if (Mixin.hasOwnProperty("constructor") && Stream[plgctor]) {
                    Stream[plgctor].ctors.push(Mixin.constructor);
                    delete Mixin.constructor;
                }
                Object.getOwnPropertyNames(Mixin).forEach(
                    (prop) => Object.defineProperty(Stream.prototype, prop, Object.getOwnPropertyDescriptor(Mixin, prop))
                );
            } else {
                this[key] = mixins[key];
            }
        }
        return this;
    },

    /**
     * Gets an API version (this may be important for future use)
     *
     * @memberof module:scramjet
     * @param {Number} version The required version (currently only: 1)
     * @return {scramjet}
     */
    API(version) {
        if (version === 1) {
            return module.exports;
        }
    }
};

// ----- Externals documentation -----

/**
 * Asynchronous Generator.
 *
 * @external AsyncGeneratorFunction
 * @see https://github.com/tc39/proposal-async-iteration#async-generator-functions
 */

/**
 * Generator function (`function* ()`).
 *
 * @external GeneratorFunction
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/GeneratorFunction
 */

/**
 * Simple Node.js Passthrough stream.
 *
 * @external stream.PassThrough
 * @see https://nodejs.org/api/stream.html#stream_class_stream_passthrough
 */
