const {PromiseTransformStream} = require('./util/promise-transform-stream');
const {Readable} = require("stream");
const scramjet = require('./');
const path = require('path');

const getCalleeDirname = function(depth) {
    const p = Error.prepareStackTrace;
    Error.prepareStackTrace = (dummy, stack) => stack;
    const e = new Error();
    Error.captureStackTrace(e, arguments.callee);
    const stack = e.stack;
    Error.prepareStackTrace = p;
    return path.dirname(stack[depth].getFileName());
};

/**
 * DataStream is the primary stream type for Scramjet. When you parse your
 * stream, just pipe it you can then perform calculations on the data objects
 * streamed through your flow.
 *
 * ```javascript
 *  await (DataStream.fromArray([1,2,3,4,5]) // create a DataStream
 *      .map(readFile)                       // read some data asynchronously
 *      .map(sendToApi)                      // send the data somewhere
 *      .whenEnd());                         // wait until end
 * ```
 *
 * @extends stream.PassThrough
 */
class DataStream extends PromiseTransformStream {

    /**
     * Create the DataStream.
     *
     * @param {StreamOptions} opts Stream options passed to superclass
     *
     * @example {@link ../samples/data-stream-constructor.js}
     */
    constructor(opts) {
        super(Object.assign({
            objectMode: true,
            writableObjectMode: true,
            readableObjectMode: true
        }, opts));
        this._error_handlers = [];
    }

    /**
     * @callback MapCallback
     * @param {*} chunk the chunk to be mapped
     * @returns {Promise|*}  the mapped object
     */

    /**
     * Transforms stream objects into new ones, just like Array.prototype.map
     * does.
     *
     * @param {MapCallback} func The function that creates the new object
     * @param {Class} Clazz (optional) The class to be mapped to.
     * @return {DataStream}  mapped stream
     *
     * @example {@link ../samples/data-stream-map.js}
     */
    map(func, Clazz) {
        Clazz = Clazz || this.constructor;
        return this.pipe(new Clazz({
            parallelTransform: func,
            referrer: this
        }));
    }

    /**
     * @callback FilterCallback
     * @param {*} chunk the chunk to be filtered or not
     * @returns {Promise|Boolean}  information if the object should remain in
     *                             the filtered stream.
     */

    /**
     * Filters object based on the function outcome, just like
     * Array.prototype.filter.
     *
     * @param  {FilterCallback} func The function that filters the object
     * @return {DataStream}  filtered stream
     *
     * @example {@link ../samples/data-stream-filter.js}
     */
    filter(func) {
        return this.pipe(this._selfInstance({
            parallelTransform: func,
            afterTransform: (chunk, ret) => ret ? chunk : Promise.reject(DataStream.filter),
            referrer: this
        }));
    }

    /**
     * @callback ReduceCallback
     * @param {*} acc the accumulator - the object initially passed or retuned
     *                by the previous reduce operation
     * @param {Object} chunk the stream chunk.
     * @return {Promise|*}  accumulator for the next pass
     */

    /**
     * Reduces the stream into a given accumulator
     *
     * Works similarily to Array.prototype.reduce, so whatever you return in the
     * former operation will be the first operand to the latter.
     *
     * This method is serial - meaning that any processing on an entry will
     * occur only after the previous entry is fully processed. This does mean
     * it's much slower than parallel functions.
     *
     * @param  {TransformFunction} func The into object will be passed as the  first argument, the data object from the stream as the second.
     * @param  {Object} into Any object passed initally to the transform function
     * @return {Promise}  Promise resolved by the last object returned by the call of the transform function
     *
     * @example {@link ../samples/data-stream-reduce.js}
     */
    reduce(func, into) {

        return new Promise((res, rej) => {

            let last = Promise.resolve(into);

            this.tap().pipe(new PromiseTransformStream({
                parallelTransform: (chunk) => {
                    return last = last.then((acc) => func(acc, chunk));
                },
                referrer: this,
                initial: into
            }))
            .on("end", () => last.then(res))
            .on("error", rej)
            .resume();

        });

    }

    /**
     * @callback IntoCallback
     * @async
     * @param {*} into stream passed to the into method
     * @param {Object} chunk source stream chunk
     * @return {*}  resolution for the old stream (for flow control only)
     */

    /**
     * Pushes the data into another scramjet stream while keeping flow control and
     *
     * @param  {} func [description]
     * @param  {DataStream} into [description]
     * @return {DataStream}  the object passed as `into`
     */
    into(func, into) {
        if (!(into instanceof DataStream)) throw new Error("Stream must be passed!");

        if (!into._options.referrer)
            into.setOptions({referrer: this});

        this.tap()
            .catch(e => into.raise(e))
            .pipe(new DataStream({
                parallelTransform: async (chunk) => {
                    try {
                        await func(into, chunk);
                    } catch(e) {
                        into.raise(e);
                    }
                },
                referrer: this
            }))
            .on('end', () => into.end())
            .resume();

        return into;
    }

    /**
     * Calls the passed method in place with the stream as first argument, returns result.
     *
     * The main intention of this method is to run scramjet modules - transforms that allow complex transforms of
     * streams. These modules can also be run with [scramjet-cli](https://github.com/signicode/scramjet-cli) directly
     * from the command line.
     *
     * @param  {Function|String} func if passed, the function will be called on self
     *                         to add an option to inspect the stream in place,
     *                         while not breaking the transform chain.
     *                         Alternatively this can be a relative path to a scramjet-module.
     * @return {*}  anything the passed function returns
     *
     * @example {@link ../samples/data-stream-use.js}
     */
    use(func) {
        switch (typeof func) {
            case "function":
                return func(this);
            case "string":
                return require(func.startsWith('.') ? path.resolve(getCalleeDirname(1), func) : func)(this);
            default:
                throw new Error();
        }
    }

    /**
     * @callback TeeCallback
     * @param {DataStream} teed The teed stream
     */

    /**
     * Duplicate the stream
     *
     * Creates a duplicate stream instance and passes it to the callback.
     *
     * @param {TeeCallback} func The duplicate stream will be passed as first argument.
     * @return {DataStream}  self
     *
     * @example {@link ../samples/data-stream-tee.js}
     */
    tee(func) {
        func(this.pipe(this._selfInstance()));
        return this.tap();
    }

    /**
     * Performs an operation on every chunk, without changing the stream
     *
     * This is a shorthand for ```stream.on("data", func)``` but with flow control.
     * Warning: this resumes the stream!
     *
     * @chainable
     * @param  {MapCallback} func a callback called for each chunk.
     */
    each(func) {
        return this.tap().map(
            (a) => Promise.resolve(func(a))
                .then(() => a)
        ).resume();
    }

    /**
     * Reads the stream while the function outcome is truthy.
     *
     * Stops reading and emits end as soon as it ends.
     *
     * @param  {FilterCallback} func The condition check
     * @return {DataStream}  the shortened stream
     */
    while(func) {
        let condition = true;
        const out = this._selfInstance({
            parallelTransform: func,
            beforeTransform: (chunk) => condition ? chunk : Promise.reject(DataStream.filter),
            afterTransform: (chunk, ret) => {
                if (!ret) {
                    condition = false;
                    out.end();
                    return Promise.reject(DataStream.filter);
                } else {
                    return chunk;
                }
            },
            referrer: this
        });
        return this.pipe(out);
    }

    /**
     * Reads the stream until the function outcome is truthy.
     *
     * Works opposite of while.
     *
     * @param  {FilterCallback} func The condition check
     * @return {DataStream}  the shortened stream
     */
    until(func) {
        return this.while((...args) => Promise.resolve(func(...args)).then((a) => !a));
    }

    /**
     * Provides a way to catch errors in chained streams.
     *
     * The handler will be called as asynchronous
     *  - if it resolves then the error will be muted.
     *  - if it rejects then the error will be passed to the next handler
     *
     * If no handlers will resolve the error, an `error` event will be emitted
     *
     * @param {Function} callback Error handler (async function)
     * @chainable
     */
    catch(callback) {
        this._error_handlers.push(callback);
        return this;
    }

    /**
     * Executes all error handlers and if none resolves, then emits an error.
     *
     * The returned promise will always be resolved even if there are no successful handlers.
     *
     * @param  {Error} err The thrown error
     * @return {Promise}  the promise that will be resolved when the error is handled.
     */
    raise(err) {
        return this._error_handlers
            .reduce((err, handler) => err.catch(handler), Promise.reject(err))
            .catch((err) => this.emit('error', err))
        ;
    }

    /**
     * Override of node.js Readable pipe.
     *
     * Except for calling overridden method it proxies errors to piped stream.
     *
     * @param  {Writable} to  Writable stream to write to
     * @param  {WritableOptions} options
     * @return {Writable}  the `to` stream
     */
    pipe(to, options) {
        if (to === this) {
            return this;
        }

        if (this !== to && to instanceof DataStream) {
            to.setOptions({referrer: this});
            this.tap()
                .on("error", (...err) => to.raise(...err));
        } else if (to instanceof Readable) {
            this.on("error", (...err) => to.emit("error", ...err));
        }

        return super.pipe(to, options || {end: true});
    }

    /**
     * Creates a BufferStream
     *
     * @param  {MapCallback} serializer A method that converts chunks to buffers
     * @return {BufferStream}  the resulting stream
     *
     * @example {@link ../samples/data-stream-tobufferstream.js}
     */
    bufferify(serializer) {
        return this.map(serializer, scramjet.BufferStream);
    }

    /**
     * Creates a StringStream
     *
     * @param  {MapCallback} serializer A method that converts chunks to strings
     * @return {StringStream}  the resulting stream
     *
     * @example {@link ../samples/data-stream-tostringstream.js}
     */
    stringify(serializer) {
        return this.map(serializer, scramjet.StringStream);
    }

    /**
     * Consumes all stream items without doing anything
     *
     * @return {Promise} Resolved when the whole stream is read
     */
    async run() {
        return this.each(() => 0).whenEnd();
    }

    /**
     * Alias for {@link DataStream#stringify}
     * @function toStringStream
     */

    /*
     * Returns a DataStream from any node.js Readable Stream
     *
     * @param {ReadableStream} stream
     */
    static from(stream) {
        return stream.pipe(this._selfInstance());
    }

    /**
     * Create a DataStream from an Array
     *
     * @param  {Array} arr list of chunks
     * @return {DataStream}  the resulting stream
     *
     * @example {@link ../samples/data-stream-fromarray.js}
     */
    static fromArray(arr) {
        const ret = new DataStream();
        arr = arr.slice();
        process.nextTick(() => {
            arr.forEach((item) => ret.write(item));
            ret.end();
        });
        return ret;
    }


    /**
     * Create a DataStream from an Iterator
     *
     * Doesn't end the stream until it reaches end of the iterator.
     *
     * @param  {Iterator} iter the iterator object
     * @return {DataStream}  the resulting stream
     *
     * @example {@link ../samples/data-stream-fromiterator.js}
     */
    static fromIterator(iter) {
        return new DataStream({
            read() {
                const read = iter.next();
                if (read.done) {
                    this.push(null);
                } else {
                    Promise.resolve(read.value)
                        .then((value) => this.push(value));
                }
            }
        });
    }

    /**
     * Aggregates the stream into a single Array
     *
     * In fact it's just a shorthand for reducing the stream into an Array.
     *
     * @param  {Array} initial Optional array to begin with.
     * @return {Promise} Promise resolved with the resulting array on stream end.
     */
    toArray(initial) {
        return this.reduce(
            (arr, item) => (arr.push(item), arr),
            initial || []
        );
    }

    /**
     * Returns an async generator
     *
     * Ready for https://github.com/tc39/proposal-async-iteration
     *
     * @return {Iterable.<Promise.<*>>} Returns an iterator that returns a promise for each item.
     */
    toGenerator() {
        this.tap();
        const ref = this;
        return function*() {
            let ended = false;
            ref.on("end", () => ended = true);
            while (!ended) {
                yield ref.whenRead();
            }
            return;
        };
    }

    /**
     * Stops merging transform callbacks at the current place in the command chain.
     *
     * @name tap
     * @memberof DataStream#
     * @method
     * @example {@link ../samples/data-stream-tap.js}
     */

    /**
     * Reads a chunk from the stream and resolves the promise when read.
     *
     * @name whenRead
     * @memberof DataStream#
     * @method
     * @async
     * @return {Promise<Object>}  the read item
     */

    /**
     * Writes a chunk to the stream and returns a Promise resolved when more chunks can be written.
     *
     * @name whenWrote
     * @memberof DataStream#
     * @method
     * @async
     * @param {...*} data Chunk(s) to be written before resolving.
     * @return {Promise}
     */

    /**
     * Resolves when stream ends - rejects on uncaught error
     *
     * @name whenEnd
     * @memberof DataStream#
     * @method
     * @async
     * @return {Promise}
     */

    /**
     * Returns a promise that resolves when the stream is drained
     *
     * @name whenDrained
     * @memberof DataStream#
     * @method
     * @async
     * @return {Promise}
     */

    /**
     * Returns a promise that resolves (!) when the stream is errors
     *
     * @name whenError
     * @memberof DataStream#
     * @method
     * @async
     * @return {Promise}
     */

    /**
     * Allows resetting stream options.
     *
     * It's much easier to use this in chain than constructing new stream:
     *
     * ```javascript
     *     stream.map(myMapper).filter(myFilter).setOptions({maxParallel: 2})
     * ```
     *
     * @meta.conditions keep-order,chain
     *
     * @memberof DataStream#
     * @name setOptions
     * @method
     * @param {StreamOptions} options
     * @chainable
     */

    /**
     * Returns a new instance of self.
     *
     * Normally this doesn't have to be overridden.
     * When the constructor would use some special arguments this may be used to
     * override the object construction in {@link tee}...
     *
     * @memberof DataStream#
     * @return {DataStream}  an empty instance of the same class.
     * @example {@link ../samples/data-stream-selfinstance.js}
     */
    _selfInstance(...args) {
        return new this.constructor(...args);
    }

}

/**
 * Standard options for scramjet streams.
 *
 * @typedef {Object} StreamOptions
 * @property {Number} maxParallel the number of transforms done in parallel
 * @property {DataStream} referrer a referring stream to point to (if possible the transforms will be pushed to it
 *                                 instead of creating a new stream)
 */

DataStream.prototype.toBufferStream = DataStream.prototype.bufferify;
DataStream.prototype.toStringStream = DataStream.prototype.stringify;

module.exports = DataStream;
