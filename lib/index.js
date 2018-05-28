const {plgctor} = require('./util/promise-transform-stream');

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
 * @name scramjet
 * @extends {Object}
 */
module.exports = {
    /**
     * Creates a DataStream that's piped from the passed readable.
     *
     * @param {Readable} str and node.js readable stream (`objectMode: true` is advised)
     * @returns {DataStream}
     */
    from(str) {
        return this.DataStream.from(str);
    },

    /**
     * Creates a DataStream from an Array
     *
     * @param {Array<*>} args
     * @returns {DataStream}
     */
    fromArray(...args) {
        return this.DataStream.fromArray(...args);
    },

    /**
     * Provides a lazy-load accessor to BufferStream
     * @memberOf scramjet
     * @type BufferStream
     * @see {@link buffer-stream.md}
     */
    get BufferStream() { return require("./buffer-stream"); },

    /**
     * Provides a lazy-load accessor to DataStream
     * @memberOf scramjet
     * @type DataStream
     * @see {@link data-stream.md}
     */
    get DataStream() { return require("./data-stream"); },

    /**
     * Provides a lazy-load accessor to MultiStream
     * @memberOf scramjet
     * @type MultiStream
     * @see {@link multi-stream.md}
     */
    get MultiStream() { return require("./multi-stream"); },

    /**
     * Provides a lazy-load accessor to StringStream
     * @memberOf scramjet
     * @type StringStream
     * @see {@link string-stream.md}
     */
    get StringStream() { return require("./string-stream"); },

    /**
     * Provides a lazy-load accessor to PromiseTransformStream - the base class of scramjet streams
     * @memberOf scramjet
     * @type PromiseTransformStream
     */
    get PromiseTransformStream() { return require("./util/promise-transform-stream").PromiseTransformStream; },

    /**
     * Definition of a single mixin for a specific Scramjet class
     *
     * @typedef {Object} StreamMixin
     * @property {Function} constructor optional constructor that will be called in the stream constructor (this has to be an own property!)
     * @property {Function} * any name given will be mixed in to the scramjet stream (except for constructor)
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
     * @param  {ScramjetPlugin} mixin the plugin object
     * @chainable
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
     * @param {Number} version The required version (currently only: 1)
     */
    API(version) {
        if (version === 1) {
            return module.exports;
        }
    }
};
