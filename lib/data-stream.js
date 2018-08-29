const {PromiseTransformStream} = require("./util/promise-transform-stream");
const {Readable, Writable} = require("stream");
const scramjet = require(".");
const path = require("path");

const getCalleeDirname = function(depth) {
    const p = Error.prepareStackTrace;
    Error.prepareStackTrace = (dummy, stack) => stack;
    const e = new Error();
    Error.captureStackTrace(e, arguments.callee);
    const stack = e.stack;
    Error.prepareStackTrace = p;
    return path.dirname(stack[depth].getFileName());
};

let AsyncGeneratorFunction = function() {};
try {
    AsyncGeneratorFunction = require("./util/async-generator-constructor");
} catch (e) {} // eslint-disable-line

const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;

const pipeIfTarget = (stream, target) => (target ? stream.pipe(target) : stream);

/**
 * DataStream is the primary stream type for Scramjet. When you parse your
 * stream, just pipe it you can then perform calculations on the data objects
 * streamed through your flow.
 *
 * Use as:
 *
 * ```javascript
 * const { DataStream } = require('scramjet');
 *
 * await (DataStream.from(aStream) // create a DataStream
 *     .map(findInFiles)           // read some data asynchronously
 *     .map(sendToAPI)             // send the data somewhere
 *     .run());                    // wait until end
 * ```
 *
 * @borrows DataStream#bufferify as DataStream#toBufferStream
 * @borrows DataStream#stringify as DataStream#toStringStream
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
    }

    /**
     * Returns a DataStream from pretty much anything sensibly possible.
     *
     * Depending on type:
     * * `self` will return self immediately
     * * `Readable` stream will get piped to the current stream with errors forwarded
     * * `Array` will get iterated and all items will be pushed to the returned stream.
     *   The stream will also be ended in such case.
     * * `GeneratorFunction` will get executed to return the iterator which will be used as source for items
     * * `AsyncGeneratorFunction` will also work as above (including generators) in node v10.
     * * `Iterable`s iterator will be used as a source for streams
     *
     * You can also pass a `Function` or `AsyncFunction` that will result in anything passed to `from`
     * subsequently. You can use your stream immediately though.
     *
     * @chainable
     * @param {Array|Iterable|AsyncGeneratorFunction|GeneratorFunction|AsyncFunction|Function|Readable} str argument to be turned into new stream
     * @param {StreamOptions|Writable} options
     */
    static from(stream, options, ...args) {
        const target = options instanceof this && options;

        if (stream instanceof this) {
            return target ? stream.pipe(target) : stream;
        }

        if (stream instanceof Readable || (
            typeof stream.readable === "boolean" &&
            typeof stream.pipe === "function" &&
            typeof stream.on === "function"
        )) {
            const out = target || new this(
                Object.assign(
                    {},
                    options,
                    { referrer: stream instanceof DataStream ? stream : null }
                )
            );

            stream.pipe(out);
            stream.on("error", e => out.raise(e));
            return out;
        }

        if (stream instanceof GeneratorFunction || stream instanceof AsyncGeneratorFunction) {
            const iterator = stream(...args);
            const iteratorStream = this.fromIterator(iterator, options);
            return pipeIfTarget(iteratorStream, target);
        }

        if (Array.isArray(stream))
            return pipeIfTarget(this.fromArray(stream, options), target);

        const iter = stream[Symbol.iterator] || stream[Symbol.asyncIterator];
        if (iter)
            return pipeIfTarget(this.fromIterator(iter(), options), target);

        if (typeof stream === "function") {
            const out = new this(Object.assign({}, options));

            Promise.resolve(options)
                .then(stream)
                .then(source => this.from(source, out))
                .catch(e => this.raise(e));

            return out;
        }

        throw new Error("Cannot return a stream from passed object");
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
     * @chainable
     *
     * @example {@link ../samples/data-stream-map.js}
     */
    map(func, Clazz) {
        Clazz = Clazz || this.constructor;
        return this.pipe(new Clazz({
            promiseTransform: func,
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
     * @chainable
     * @param  {FilterCallback} func The function that filters the object
     *
     * @example {@link ../samples/data-stream-filter.js}
     */
    filter(func) {
        return this.pipe(this._selfInstance({
            promiseTransform: func,
            afterTransform: (chunk, ret) => ret ? chunk : Promise.reject(DataStream.filter),
            referrer: this
        }));
    }

    /**
     * @callback ReduceCallback
     * @param {*} acc the accumulator - the object initially passed or returned
     *                by the previous reduce operation
     * @param {Object} chunk the stream chunk.
     * @return {Promise|*}  accumulator for the next pass
     */

    /**
     * Reduces the stream into a given accumulator
     *
     * Works similarly to Array.prototype.reduce, so whatever you return in the
     * former operation will be the first operand to the latter. The result is a
     * promise that's resolved with the return value of the last transform executed.
     *
     * This method is serial - meaning that any processing on an entry will
     * occur only after the previous entry is fully processed. This does mean
     * it's much slower than parallel functions.
     *
     * @async
     * @param  {ReduceCallback} func The into object will be passed as the  first argument, the data object from the stream as the second.
     * @param  {Object} into Any object passed initially to the transform function
     *
     * @example {@link ../samples/data-stream-reduce.js}
     */
    reduce(func, into) {

        let last = Promise.resolve(into);

        return this.tap().pipe(new PromiseTransformStream({
            promiseTransform: (chunk) => {
                return last = last.then((acc) => func(acc, chunk));
            },
            referrer: this,
            initial: into
        }))
            .resume()
            .whenFinished()
            .then(() => last);
    }

    /**
     * @callback DoCallback
     * @async
     * @param {Object} chunk source stream chunk
     */

    /**
     * Perform an asynchroneous operation without changing or resuming the stream.
     *
     * In essence the stream will use the call to keep the backpressure, but the resolving value
     * has no impact on the streamed data (except for possile mutation of the chunk itself)
     *
     * @chainable
     * @param {DoCallback} func the async function
     */
    do(func) {
        return this.map(async (chunk) => (await func(chunk), chunk));
    }

    /**
     * @callback IntoCallback
     * @async
     * @param {*} into stream passed to the into method
     * @param {Object} chunk source stream chunk
     * @return {*}  resolution for the old stream (for flow control only)
     */

    /**
     * Allows own implementation of stream chaining.
     *
     * The async callback is called on every chunk and should implement writes in it's own way. The
     * resolution will be awaited for flow control. The passed `into` argument is passed as the first
     * argument to every call.
     *
     * It returns the DataStream passed as the second argument.
     *
     * @chainable
     * @param  {IntoCallback} func the method that processes incoming chunks
     * @param  {DataStream} into the DataStream derived class
     *
     * @example {@link ../samples/data-stream-into.js}
     */
    into(func, into) {
        if (!(into instanceof DataStream)) throw new Error("Stream must be passed!");

        if (!into._options.referrer)
            into.setOptions({referrer: this});
        this.tap()
            .catch(e => into.raise(e))
            .pipe(new (this.constructor)({
                promiseTransform: async (chunk) => {
                    try {
                        await func(into, chunk);
                    } catch(e) {
                        into.raise(e);
                    }
                },
                referrer: this
            }))
            .on("end", () => into.end())
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
     * @chainable
     * @param {Function|String} func if passed, the function will be called on self to add an option to inspect the stream in place, while not breaking the transform chain. Alternatively this can be a relative path to a scramjet-module.
     * @param {*} [...args] any additional args top be passed to the module
     * @example {@link ../samples/data-stream-use.js}
     */
    use(func, ...args) {
        switch (typeof func) {
        case "function":
            return func(this, ...args);
        case "string":
            return require(func.startsWith(".") ? path.resolve(getCalleeDirname(1), func) : func)(this, ...args);
        default:
            throw new Error("Only function or string allowed.");
        }
    }

    /**
     * Consumes all stream items doing nothing. Resolves when the stream is ended.
     *
     * @async
     */
    async run() {
        return this.pipe(new PromiseTransformStream({
            promiseWrite: () => 1,
            referrer: this
        })).whenFinished();
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
     * @async
     * @name whenRead
     * @memberof DataStream#
     * @method
     */

    /**
     * Writes a chunk to the stream and returns a Promise resolved when more chunks can be written.
     *
     * @async
     * @name whenWrote
     * @memberof DataStream#
     * @method
     * @param {*} chunk a chunk to write
     * @param {...*} [more] more chunks to write
     */

    /**
     * Resolves when stream ends - rejects on uncaught error
     *
     * @async
     * @name whenEnd
     * @memberof DataStream#
     * @method
     */

    /**
     * Returns a promise that resolves when the stream is drained
     *
     * @async
     * @name whenDrained
     * @memberof DataStream#
     * @method
     */

    /**
     * Returns a promise that resolves (!) when the stream is errors
     *
     * @async
     * @name whenError
     * @memberof DataStream#
     * @method
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
     * @callback TeeCallback
     * @param {DataStream} teed The teed stream
     */

    /**
     * Duplicate the stream
     *
     * Creates a duplicate stream instance and passes it to the callback.
     *
     * @chainable
     * @param {TeeCallback|Writable} func The duplicate stream will be passed as first argument.
     *
     * @example {@link ../samples/data-stream-tee.js}
     */
    tee(func) {
        if (func instanceof Writable)
            return (this.tap().pipe(func), this);
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
     * @chainable
     * @param  {FilterCallback} func The condition check
     *
     * @example {@link ../samples/data-stream-while.js}
     */
    while(func) {
        let condition = true;
        const out = this._selfInstance({
            promiseTransform: func,
            beforeTransform: (chunk) => condition ? chunk : Promise.reject(DataStream.filter),
            afterTransform: (chunk, ret) => {
                if (!ret) {
                    condition = false;
                    out.end();
                    return Promise.reject(DataStream.filter);
                } else {
                    return condition ? chunk : Promise.reject(DataStream.filter);
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
     * @chainable
     * @param  {FilterCallback} func The condition check
     *
     * @example {@link ../samples/data-stream-until.js}
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
     * @chainable
     * @name catch
     * @memberof DataStream#
     * @method
     * @param {Function} callback Error handler (async function)
     *
     * @example {@link ../samples/data-stream-catch.js}
     */

    /**
     * Executes all error handlers and if none resolves, then emits an error.
     *
     * The returned promise will always be resolved even if there are no successful handlers.
     *
     * @async
     * @name raise
     * @memberof DataStream#
     * @method
     * @param {Error} err The thrown error
     *
     * @example {@link ../samples/data-stream-raise.js}
     */

    /**
     * Override of node.js Readable pipe.
     *
     * Except for calling overridden method it proxies errors to piped stream.
     *
     * @chainable
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
     * @meta.noReadme
     * @chainable
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
     * @chainable
     * @param  {MapCallback} serializer A method that converts chunks to strings
     * @return {StringStream}  the resulting stream
     *
     * @example {@link ../samples/data-stream-tostringstream.js}
     */
    stringify(serializer) {
        return this.map(serializer, scramjet.StringStream);
    }

    /**
     * Create a DataStream from an Array
     *
     * @param  {Array} arr list of chunks
     * @return {DataStream}
     *
     * @example {@link ../samples/data-stream-fromarray.js}
     */
    static fromArray(arr, options) {
        const ret = new this(options);
        arr = arr.slice();
        arr.forEach((item) => ret.write(item));
        ret.end();
        return ret;
    }

    /**
     * Create a DataStream from an Iterator
     *
     * Doesn't end the stream until it reaches end of the iterator.
     *
     * @param  {Iterator} iter the iterator object
     * @return {DataStream}
     *
     * @example {@link ../samples/data-stream-fromiterator.js}
     */
    static fromIterator(iter, options) {
        return new this(Object.assign({}, options, {
            async parallelRead() {
                const read = await iter.next();
                if (read.done) {
                    return read.value ? [read.value, null] : [null];
                } else {
                    return [read.value];
                }
            }
        }));
    }

    /**
     * Aggregates the stream into a single Array
     *
     * In fact it's just a shorthand for reducing the stream into an Array.
     *
     * @async
     * @param  {Array} initial Optional array to begin with.
     * @returns {Array}
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
        return function* () {
            let ended = false;
            ref.on("end", () => ended = true);
            while (!ended) {
                yield ref.whenRead();
            }
            return;
        };
    }

    /**
     * Returns a new instance of self.
     *
     * Normally this doesn't have to be overridden.
     * When the constructor would use some special arguments this may be used to
     * override the object construction in {@link tee}...
     *
     * @meta.noReadme
     * @memberof DataStream#
     * @name _selfInstance
     * @method
     * @return {DataStream}  an empty instance of the same class.
     * @example {@link ../samples/data-stream-selfinstance.js}
     */
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
