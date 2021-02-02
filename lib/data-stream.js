const {PromiseTransformStream} = require("./util/promise-transform-stream");
const {Readable, Writable, Transform} = require("stream");
const scramjet = require(".");

const {
    AsyncGeneratorFunction,
    GeneratorFunction,
    resolveCalleeBlackboxed,
    pipeIfTarget
} = require("./util/utils");

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
 * @memberof module:scramjet.
 * @alias DataStream
 * @borrows module:scramjet.DataStream#bufferify as module:scramjet.DataStream#toBufferStream
 * @borrows module:scramjet.DataStream#stringify as module:scramjet.DataStream#toStringStream
 * @extends import("stream").PassThrough
 */
class DataStream extends PromiseTransformStream {

    /**
     * Create the DataStream.
     *
     * @param {DataStreamOptions} [opts={}] Stream options passed to superclass
     *
     * @test test/methods/data-stream-constructor.js
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
     * You can also pass a `Function` or `AsyncFunction` that will be executed and it's outcome will be
     * passed again to `from` and piped to the initially returned stream. Any additional arguments will be
     * passed as arguments to the function.
     *
     * If a `String` is passed, scramjet will attempt to resolve it as a module and use the outcome
     * as an argument to `from` as in the Function case described above. For more information see {@link modules.md}
     *
     * A simple example from a generator:
     *
     * ```javascript
     * DataStream
     *   .from(function* () {
     *      while(x < 100) yield {x: x++};
     *   })
     *   .each(console.log)
     *   // {x: 0}
     *   // {x: 1}
     *   // ...
     *   // {x: 99}
     * ```
     *
     * @param {Array|Iterable<any>|AsyncGeneratorFunction|GeneratorFunction|AsyncFunction|Promise<any>|Function|string|Readable} input argument to be turned into new stream
     * @param {DataStreamOptions|Writable} [options={}] options for creation of a new stream or the target stream
     * @param {any[]} ...args additional arguments for the stream - will be passed to the function or generator
     * @return {DataStream}
     */
    static from(input, options, ...args) {
        const target = options instanceof this && options;

        const {errors: {StreamError}} = scramjet;

        if (input instanceof this) {
            return target ? input.pipe(target) : input;
        }

        if (input instanceof Readable || (
            typeof input.readable === "boolean" &&
            typeof input.pipe === "function" &&
            typeof input.on === "function"
        )) {
            const out = target || new this(
                Object.assign(
                    {},
                    options,
                    { referrer: input instanceof DataStream ? input : null }
                )
            );

            input.pipe(out);
            input.on("error", e => out.raise(e));
            return out;
        }

        if (input instanceof GeneratorFunction || input instanceof AsyncGeneratorFunction) {
            const iterator = input(...args);
            const iteratorStream = this.fromIterator(iterator, options);
            return pipeIfTarget(iteratorStream, target);
        }

        if (Array.isArray(input))
            return pipeIfTarget(this.fromArray(input, options), target);

        const iter = input[Symbol.iterator] || (Symbol.asyncIterator && input[Symbol.asyncIterator]);
        if (iter) {
            try {
                const iterator = iter.call(input);
                return pipeIfTarget(this.fromIterator(iterator, options), target);
            } catch(e) {
                const out = target || new this();
                out.raise(new StreamError(e, out, "EXTERNAL", null));

                return out;
            }
        }

        if (input instanceof Promise) {
            const out = new this(Object.assign({}, options));

            input
                .then(source => this.from(source, out))
                .catch(e => out.raise(new StreamError(e, out, "EXTERNAL", null)));

            return out;
        }

        if (typeof input === "function") {
            const out = new this(Object.assign({}, options));

            Promise.resolve(options)
                .then(input)
                .then(source => this.from(source, out))
                .catch(e => out.raise(new StreamError(e, out, "EXTERNAL", null)));

            return out;
        }

        if (typeof input === "string") {
            return new DataStream([]).use(input, ...args);
        }

        throw new Error("Cannot return a stream from passed object");
    }

    /**
     * @callback MapCallback
     * @memberof module:scramjet~
     * @param {any} chunk the chunk to be mapped
     * @returns {Promise<any>|any}  the mapped object
     */

    /**
     * Transforms stream objects into new ones, just like Array.prototype.map
     * does.
     *
     * Map takes an argument which is the Function function operating on every element
     * of the stream. If the function returns a Promise or is an AsyncFunction then the
     * stream will await for the outcome of the operation before pushing the data forwards.
     *
     * A simple example that turns stream of urls into stream of responses
     *
     * ```javascript
     * stream.map(async url => fetch(url));
     * ```
     *
     * Multiple subsequent map operations (as well as filter, do, each and other simple ops)
     * will be merged together into a single operation to improve performance. Such behaviour
     * can be suppressed by chaining `.tap()` after `.map()`.
     *
     * @param {MapCallback} func The function that creates the new object
     * @param {function(new:DataStream)} [ClassType=this.constructor] The class to be mapped to.
     * @chainable
     *
     * @test test/methods/data-stream-map.js
     */
    map(func, ClassType = this.constructor) {
        return this.pipe(new ClassType({
            promiseTransform: func,
            referrer: this
        }));
    }

    /**
     * @callback FilterCallback
     * @memberof module:scramjet~
     * @param {any} chunk the chunk to be filtered or not
     * @returns {Promise<Boolean>|Boolean} information if the object should remain in the filtered stream.
     */

    /**
     * Filters object based on the function outcome, just like Array.prototype.filter.
     *
     * Filter takes a Function argument which should be a Function or an AsyncFunction that
     * will be called on each stream item. If the outcome of the operation is `falsy` (`0`, `''`,
     * `false`, `null` or `undefined`) the item will be filtered from subsequent operations
     * and will not be pushed to the output of the stream. Otherwise the item will not be affected.
     *
     * A simple example that filters out non-2xx responses from a stream
     *
     * ```javascript
     * stream.filter(({statusCode}) => !(statusCode >= 200 && statusCode < 300));
     * ```
     *
     * @chainable
     * @param  {FilterCallback} func The function that filters the object
     *
     * @test test/methods/data-stream-filter.js
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
     * @memberof module:scramjet~
     * @param {any} accumulator the accumulator - the object initially passed or returned by the previous reduce operation
     * @param {object} chunk the stream chunk.
     * @return {Promise<any>|any}  accumulator for the next pass
     */

    /**
     * Reduces the stream into a given accumulator
     *
     * Works similarly to Array.prototype.reduce, so whatever you return in the
     * former operation will be the first operand to the latter. The result is a
     * promise that's resolved with the return value of the last transform executed.
     *
     * A simple example that sums values from a stream
     *
     * ```javascript
     * stream.reduce((accumulator, {value}) => accumulator + value);
     * ```
     *
     * This method is serial - meaning that any processing on an entry will
     * occur only after the previous entry is fully processed. This does mean
     * it's much slower than parallel functions.
     *
     * @async
     * @param {ReduceCallback} func The into object will be passed as the  first argument, the data object from the stream as the second.
     * @param {object} into Any object passed initially to the transform function
     *
     * @test test/methods/data-stream-reduce.js
     */
    reduce(func, into) {

        let last = Promise.resolve(into);

        return this.tap()
            .pipe(new PromiseTransformStream({
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
     * @memberof module:scramjet~
     * @async
     * @param {object} chunk source stream chunk
     * @returns {Promise<any>|any} the outcome is discarded
     */

    /**
     * Perform an asynchronous operation without changing or resuming the stream.
     *
     * In essence the stream will use the call to keep the backpressure, but the resolving value
     * has no impact on the streamed data (except for possible mutation of the chunk itself)
     *
     * @chainable
     * @param {DoCallback} func the async function
     */
    do(func) {
        return this.map(async (chunk) => (await func(chunk), chunk));
    }

    /**
     * Processes a number of functions in parallel, returns a stream of arrays of results.
     *
     * This method is to allow running multiple asynchronous operations and receive all the
     * results at one, just like Promise.all behaves.
     *
     * Keep in mind that if one of your methods rejects, this behaves just like Promise.all
     * you won't be able to receive partial results.
     *
     * @chainable
     * @param {Function[]} functions list of async functions to run
     *
     * @test test/methods/data-stream-all.js
     */
    all(functions) {
        return this.map(chunk => {
            const chunkPromise = Promise.resolve(chunk);
            return Promise.all(functions.map(func => chunkPromise.then(func)));
        });
    }

    /**
     * Processes a number of functions in parallel, returns the first resolved.
     *
     * This method is to allow running multiple asynchronous operations awaiting just the
     * result of the quickest to execute, just like Promise.race behaves.
     *
     * Keep in mind that if one of your methods it will only raise an error if that was
     * the first method to reject.
     *
     * @chainable
     * @param {Function[]} functions list of async functions to run
     *
     * @test test/methods/data-stream-race.js
     */
    race(functions) {
        return this.map(chunk => {
            const chunkPromise = Promise.resolve(chunk);
            return Promise.race(functions.map(func => chunkPromise.then(func)));
        });
    }

    /**
     * Allows processing items without keeping order
     *
     * This method useful if you are not concerned about the order in which the
     * chunks are being pushed out of the operation. The `maxParallel` option is
     * still used for keeping a number of simultaneous number of parallel operations
     * that are currently happening.
     *
     * @param {MapCallback} func the async function that will be unordered
     */
    unorder(func) {
        const waiting = [];
        const processing = Array(this._options.maxParallel).fill(null);
        const out = this._selfInstance({referrer: this});

        this
            .each(async chunk => {
                // we're using this race condition on purpose
                /* eslint-disable require-atomic-updates */
                let slot = processing.findIndex(x => x === null);
                if (slot < 0 && processing.length < this._options.maxParallel) slot = processing.length;
                if (slot < 0) slot = await new Promise(res => waiting.push(res));

                processing[slot] = Promise
                    .resolve(chunk)
                    .then(func)
                    .then(result => out.whenWrote(result))
                    .then(() => {
                        const next = waiting.shift();
                        if (next) next(slot);
                        else processing[slot] = null;
                    });
                /* eslint-enable require-atomic-updates */
            })
            .run()
            .then(() => Promise.all(processing))
            .then(() => out.end());

        return out;
    }

    /**
     * @callback IntoCallback
     * @memberof module:scramjet~
     * @async
     * @param {*} into stream passed to the into method
     * @param {any} chunk source stream chunk
     * @return {Promise<any>|any} resolution for the old stream (for flow control only)
     */

    /**
     * Allows own implementation of stream chaining.
     *
     * The async Function is called on every chunk and should implement writes in it's own way. The
     * resolution will be awaited for flow control. The passed `into` argument is passed as the first
     * argument to every call.
     *
     * It returns the DataStream passed as the second argument.
     *
     * @chainable
     * @param  {IntoCallback} func the method that processes incoming chunks
     * @param  {DataStream} into the DataStream derived class
     *
     * @test test/methods/data-stream-into.js
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
     * @callback UseCallback
     * @memberof module:scramjet~
     * @async
     * @param {DataStream} stream
     * @param  {any[]} ...parameters
     * @returns {DataStream}
     */

    /**
     * Calls the passed method in place with the stream as first argument, returns result.
     *
     * The main intention of this method is to run scramjet modules - transforms that allow complex transforms of
     * streams. These modules can also be run with [scramjet-cli](https://github.com/signicode/scramjet-cli) directly
     * from the command line.
     *
     * @chainable
     * @param {AsyncGeneratorFunction|GeneratorFunction|UseCallback|string|Readable} func if passed, the function will be called on self to add an option to inspect the stream in place, while not breaking the transform chain. Alternatively this can be a relative path to a scramjet-module. Lastly it can be a Transform stream.
     * @param {any[]} ...parameters any additional parameters top be passed to the module
     * @test test/methods/data-stream-use.js
     */
    use(func, ...parameters) {
        if (typeof func == "string") {
            func = require(func.startsWith(".") ? resolveCalleeBlackboxed(func) : func);
        }

        if (func instanceof Transform || (
            typeof func.readable === "boolean" && func.readable &&
            typeof func.writable === "boolean" && func.writable &&
            typeof func.pipe === "function" &&
            typeof func.on === "function"
        )) {
            return this.constructor.from(this.pipe(func));
        }

        if (func instanceof GeneratorFunction || func instanceof AsyncGeneratorFunction) {
            return this.constructor.from(func, {}, this, ...parameters);
        }

        if (typeof func === "function") {
            const result = func(this, ...parameters);
            if (result instanceof Promise) {
                const out = new this.constructor();
                result
                    .then(res => this.constructor.from(res).pipe(out))
                    .catch(e => out.raise(e));

                return out;
            } else {
                return result;
            }
        }

        throw new Error("Unknown argument type.");
    }

    /**
     * Consumes all stream items doing nothing. Resolves when the stream is ended.
     *
     * This is very convienient if you're looking to use up the stream in operations that work on each entry like `map`. This uncorks the stream
     * and allows all preceding operations to be run at any speed.
     *
     * All the data of the current stream will be discarded.
     *
     * The function returns a promise that is resolved when the stream ends.
     *
     * @async
     */
    async run() {
        return this.tap()
            .pipe(new DataStream())
            .on("data", () => 0)
            .whenEnd();
    }

    /**
     * Creates a pipeline of streams and returns a scramjet stream.
     *
     * This is similar to node.js stream pipeline method, but also takes scramjet modules
     * as possibilities in an array of transforms. It may be used to run a series of non-scramjet
     * transform streams.
     *
     * The first argument is anything streamable and will be sanitized by {@link DataStream..from}.
     *
     * Each following argument will be understood as a transform and can be any of:
     * * AsyncFunction or Function - will be executed by {@link DataStream..use}
     * * A transform stream that will be piped to the preceding stream
     *
     * @param {Array|Iterable<any>|AsyncGeneratorFunction|GeneratorFunction|AsyncFunction|Function|string|Readable} readable the initial readable argument that is streamable by scramjet.from
     * @param {Array<AsyncFunction|Function|Transform>} ...transforms Transform functions (as in {@link DataStream..use}) or Transform streams (any number of these as consecutive arguments)
     *
     * @returns {DataStream} a new DataStream instance of the resulting pipeline
     */
    static pipeline(readable, ...transforms) {
        const out = new this();
        let current = this.from(readable);

        (async () => {
            for (let transform of transforms) {
                if (transform instanceof Transform || (
                    typeof transform.readable === "boolean" && transform.readable &&
                    typeof transform.writable === "boolean" && transform.writable &&
                    typeof transform.pipe === "function" &&
                    typeof transform.on === "function"
                )) {
                    current = this.from(current.pipe(transform));
                } else {
                    current = this.from(current).use(transform);
                }
            }

            this
                .from(current)
                .pipe(out);

        })()
            .then()
            .catch(e => {
                return out.raise(e);
            });

        return out;
    }

    /**
     * Stops merging transform Functions at the current place in the command chain.
     *
     * @name tap
     * @chainable
     * @memberof module:scramjet.DataStream#
     * @method
     * @test test/methods/data-stream-tap.js
     */

    /**
     * Reads a chunk from the stream and resolves the promise when read.
     *
     * @async
     * @name whenRead
     * @memberof module:scramjet.DataStream#
     * @method
     */

    /**
     * Writes a chunk to the stream and returns a Promise resolved when more chunks can be written.
     *
     * @async
     * @name whenWrote
     * @memberof module:scramjet.DataStream#
     * @method
     * @param {*} chunk a chunk to write
     * @param {any[]} ...more more chunks to write
     */

    /**
     * Resolves when stream ends - rejects on uncaught error
     *
     * @async
     * @name whenEnd
     * @memberof module:scramjet.DataStream#
     * @method
     */

    /**
     * Returns a promise that resolves when the stream is drained
     *
     * @async
     * @name whenDrained
     * @memberof module:scramjet.DataStream#
     * @method
     */

    /**
     * Returns a promise that resolves (!) when the stream is errors
     *
     * @async
     * @name whenError
     * @memberof module:scramjet.DataStream#
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
     * @memberof module:scramjet.DataStream#
     * @name setOptions
     * @method
     * @param {DataStreamOptions} options
     * @chainable
     */

    /**
     * Returns a copy of the stream
     *
     * Creates a new stream and pushes all the data from the current one to the new one.
     * This can be called serveral times.
     *
     * @chainable
     * @param {TeeCallback|Writable} func The duplicate stream will be passed as first argument.
     */
    copy() {
        return this.tap().pipe(this._selfInstance());
    }

    /**
     * Duplicate the stream
     *
     * Creates a duplicate stream instance and passes it to the Function.
     *
     * @chainable
     * @param {TeeCallback|Writable} func The duplicate stream will be passed as first argument.
     *
     * @test test/methods/data-stream-tee.js
     */
    tee(func) {
        if (func instanceof Writable)
            return (this.tap().pipe(func), this);
        func(this.pipe(this._selfInstance()));
        return this.tap();
    }

    /**
     * @callback TeeCallback
     * @memberof module:scramjet~
     * @param {DataStream} teed The teed stream
     */

    /**
     * Performs an operation on every chunk, without changing the stream
     *
     * This is a shorthand for ```stream.on("data", func)``` but with flow control.
     * Warning: this resumes the stream!
     *
     * @chainable
     * @param  {MapCallback} func a Function called for each chunk.
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
     * Stops reading and emits end as soon as it finds the first chunk that evaluates
     * to false. If you're processing a file until a certain point or you just need to
     * confirm existence of some data, you can use it to end the stream before reaching end.
     *
     * Keep in mind that whatever you piped to the stream will still need to be handled.
     *
     * @chainable
     * @param  {FilterCallback} func The condition check
     *
     * @test test/methods/data-stream-while.js
     */
    while(func) {
        let condition = true;
        const out = this._selfInstance();
        return this.tap().pipe(out.filter(
            (chunk) => {
                const result = condition && func(chunk);
                if (condition != result) {
                    condition = result;
                    this.unpipe(out);
                    out.end();
                }

                return Promise
                    .resolve(result)
                    .then(result => result ? chunk : Promise.reject(DataStream.filter));
            }
        ));
    }

    /**
     * Reads the stream until the function outcome is truthy.
     *
     * Works opposite of while.
     *
     * @chainable
     * @param  {FilterCallback} func The condition check
     *
     * @test test/methods/data-stream-until.js
     */
    until(func) {
        let condition = false;
        const out = this._selfInstance();
        return this.tap().pipe(out).filter(
            (chunk) => {
                const result = condition || func(chunk);
                const ref = !result ? chunk : Promise.reject(DataStream.filter);

                if (condition != result) {
                    condition = result;
                    this.unpipe(out);
                    out.end();
                }

                return ref;
            }
        );
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
     * @memberof module:scramjet.DataStream#
     * @method
     * @param {Function} callback Error handler (async function)
     *
     * @test test/methods/data-stream-catch.js
     */

    /**
     * Executes all error handlers and if none resolves, then emits an error.
     *
     * The returned promise will always be resolved even if there are no successful handlers.
     *
     * @async
     * @name raise
     * @memberof module:scramjet.DataStream#
     * @method
     * @param {Error} err The thrown error
     *
     * @test test/methods/data-stream-raise.js
     */

    /**
     * Override of node.js Readable pipe.
     *
     * Except for calling overridden method it proxies errors to piped stream.
     *
     * @name pipe
     * @chainable
     * @ignore
     * @method
     * @memberof module:scramjet.DataStream#
     * @param  {NodeJS.WritableStream} to  Writable stream to write to
     * @param  {WritableOptions} [options={}]
     * @return {NodeJS.WritableStream}  the `to` stream
     */

    /**
     * Creates a BufferStream.
     *
     * The passed serializer must return a buffer.
     *
     * @meta.noReadme
     * @chainable
     * @param  {MapCallback} serializer A method that converts chunks to buffers
     * @return {BufferStream}  the resulting stream
     *
     * @test test/methods/data-stream-tobufferstream.js
     */
    bufferify(serializer) {
        return this.map(serializer, scramjet.BufferStream);
    }

    /**
     * Creates a StringStream.
     *
     * The passed serializer must return a string. If no serializer is passed chunks
     * toString method will be used.
     *
     * @chainable
     * @param  {MapCallback|never} [serializer] A method that converts chunks to strings
     * @return {StringStream} the resulting stream
     *
     * @test test/methods/data-stream-tostringstream.js
     */
    stringify(serializer = a => `${a}`) {
        return this.map(serializer, scramjet.StringStream);
    }

    /**
     * Create a DataStream from an Array
     *
     * @param  {Array<*>} array list of chunks
     * @param {DataStreamOptions} [options={}] the read stream options
     * @return {DataStream}
     *
     * @test test/methods/data-stream-fromarray.js
     */
    static fromArray(array, options = {}) {
        const ret = new this(options);
        array = array.slice();
        array.forEach((item) => ret.write(item));
        ret.end();
        return ret;
    }

    /**
     * Create a DataStream from an Iterator
     *
     * Doesn't end the stream until it reaches end of the iterator.
     *
     * @param {Iterator<any>} iterator the iterator object
     * @param {DataStreamOptions} [options={}] the read stream options
     * @return {DataStream}
     *
     * @test test/methods/data-stream-fromiterator.js
     */
    static fromIterator(iterator, options) {
        return new this(Object.assign({}, options, {
            // TODO: handle count argument
            // problem here is how do we know which promises are resolved and until where?
            // need to queue a number of promises up to maxParallel, but push them with
            // Promise.all with the previous one.
            async parallelRead() {
                const read = await iterator.next();
                if (read.done) {
                    return read.value ? [await read.value, null] : [null];
                } else {
                    return [await read.value];
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
     * @param  {Array} [initial=[]] Array to begin with (defaults to an empty array).
     * @returns {any[]}
     */
    toArray(initial = []) {
        return this.reduce(
            (arr, item) => (arr.push(item), arr),
            initial
        );
    }

    /**
     * Returns an async generator
     *
     * @return {Generator<Promise<any>>} Returns an iterator that returns a promise for each item.
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
     * @memberof module:scramjet.DataStream#
     * @name _selfInstance
     * @method
     * @return {DataStream}  an empty instance of the same class.
     * @test test/methods/data-stream-selfinstance.js
     */
}

/**
 * Transform async callback. The passed transform should return a new chunk, unless
 * the output should be filtered - if so, the transform should return `undefined`.
 *
 * Additionally the function can reject with `DataStream.filter` - the result will be
 * filtered and no other transforms will be run on the chunk.
 *
 * @callback ScramjetTransformCallback
 * @memberof module:scramjet~
 * @param {Buffer|string|any} chunk the stream chunk
 * @param {string} encoding encoding of the chunk
 * @returns {Promise<any|undefined>|any|undefined} the result, undefined will be treated as filtered out.
 */

/**
 * Write async callback. Await your async write and resolve.
 *
 * @callback ScramjetWriteCallback
 * @memberof module:scramjet~
 * @param {Buffer|string|any} chunk the stream chunk
 * @param {string} encoding encoding of the chunk
 * @returns {Promise<void>|void} should resolve when the write ends
 */

/**
 * Read async callback. Simply await your async operations and return the result as array.
 *
 * @callback ScramjetReadCallback
 * @memberof module:scramjet~
 * @param {number} count the number of chunks that should be read ("this is more like a set of guideline than actual rules").
 * @returns {Array<any>|Promise<Array<any>>} the read chunk.
 */

/**
 * Standard options for scramjet streams.
 *
 * Defines async transforms or read/write methods for a stream.
 * @typedef {object} DataStreamOptions
 * @memberof module:scramjet~
 * @property {ScramjetReadCallback} [promiseRead=null] an async function returning the next read item
 * @property {ScramjetWriteCallback} [promiseWrite=null] an async function writing the next written item
 * @property {ScramjetTransformCallback} [promiseTransform=null] an async function returning a transformed chunk
 * @property {ScramjetReadCallback} [promiseFlush=null] an async function run before transform stream ends to push last chunks from the buffer
 * @property {ScramjetTransformCallback} [beforeTransform=null] an async function run before the transform
 * @property {ScramjetTransformCallback} [afterTransform=null] an async function run after the transform
 * @property {number} [maxParallel=os.cpus.length*2] the number of transforms done in parallel
 * @property {DataStream} [referrer=null] a referring stream to point to (if possible the transforms will be pushed to it
 * @property {boolean} [objectMode=true] should the object mode be used instead of creating a new stream)
 * @property {number} [highWaterMark] The maximum number of bytes to store in the internal buffer before ceasing to read from the underlying resource. Default: 16384 (16KB), or 16 for objectMode streams.
 * @property {string} [encoding] If specified, then buffers will be decoded to strings using the specified encoding. Default: null.
 * @property {boolean} [emitClose] Whether or not the stream should emit 'close' after it has been destroyed. Default: true.
 * @property {Function} [read] Implementation for the stream._read() method.
 * @property {Function} [destroy] Implementation for the stream._destroy() method.
 * @property {Function} [construct] Implementation for the stream._construct() method.
 * @property {boolean} [autoDestroy] Whether this stream should automatically call .destroy() on itself after ending. Default: true.
 */

DataStream.prototype.toBufferStream = DataStream.prototype.bufferify;
DataStream.prototype.toStringStream = DataStream.prototype.stringify;

module.exports = DataStream;
