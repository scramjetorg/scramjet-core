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
 * @module scramjet
 * @extends {Object}
 */
module.exports = {
    /**
     * Creates a DataStream that's piped from the passed readable.
     *
     * @memberof module:scramjet
     * @param {Array|Iterable|GeneratorFunction|AsyncFunction|Readable} str and node.js readable stream (`objectMode: true` is advised)
     * @returns {DataStream}
     */
    from(str) {
        return this.DataStream.from(str);
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
     * @memberof module:scramjet
     * @readonly
     * @inject BufferStream
     * @see {@link buffer-stream.md}
     */
    get BufferStream() { return require("./buffer-stream"); },

    /**
     * Provides a lazy-load accessor to DataStream
     *
     * @memberof module:scramjet
     * @inject DataStream
     * @see {@link data-stream.md}
     */
    get DataStream() { return require("./data-stream"); },

    /**
     * Provides a lazy-load accessor to MultiStream
     *
     * @memberof module:scramjet
     * @inject MultiStream
     * @see {@link multi-stream.md}
     */
    get MultiStream() { return require("./multi-stream"); },

    /**
     * Provides a lazy-load accessor to StringStream
     *
     * @memberof module:scramjet
     * @inject StringStream
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
     * @example {@link ../samples/scramjet-plugin.js}
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
                    (prop) => Object.defineProperty(Stream.prototype, prop, Object.getOwnPropertyDescriptor(Mixin, prop))   // jshint ignore:line
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
