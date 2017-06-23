/**
 * @module ScramjetCore
 */

const {PromiseTransformStream} = require('./util/promise-transform-stream');
const scramjet = require('./');

// const cpus = require("os").cpus();

/**
 * DataStream is the primary stream type for Scramjet. When you parse your
 * stream, just pipe it you can then perform calculations on the data objects
 * streamed through your flow.
 *
 * @classdesc
 * @extends stream.PassThrough
 */
class DataStream extends PromiseTransformStream {

    /**
     * Standard options for scramjet streams.
     *
     * @typedef {Object} StreamOptions
     * @property {Number} maxParallel the number of transforms done in parallel
     * @property {DataStream} referrer a referring stream to point to (if possible the transforms will be pushed to it
     *                                 instead of creating a new stream)
     */

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
     * Stops merging transform callbacks at the current place in the command chain.
     *
     * @name tap
     * @function
     * @example {@link ../samples/data-stream-tap.js}
     */

    /**
     * Reads a chunk from the stream and resolves the promise when read.
     *
     * @name whenRead
     * @function
     * @return {Promise<Object>}  the read item
     */

    /**
     * Writes a chunk to the stream and returns a Promise resolved when more chunks can be written.
     *
     * @name whenWrote
     * @function
     * @return {Promise<Object>}  the read item
     */

    /**
     *
     * Allows resetting stream options.
     *
     * @name setOptions
     * @function
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
     * @private
     * @return {DataStream}  an empty instance of the same class.
     *
     * @example {@link ../samples/data-stream-selfinstance.js}
     */
    _selfInstance(...args) {
        return new this.constructor(...args);
    }

    /**
     * Calls the passed in place with the stream as first argument, returns result.
     *
     * @param  {Function} func if passed, the function will be called on self
     *                         to add an option to inspect the stream in place,
     *                         while not breaking the transform chain
     * @return {*}  anything the passed function returns
     *
     * @example {@link ../samples/data-stream-use.js}
     */
    use(func) {
        return func && func(this.tap());
    }

    /**
     * @callback TeeCallback
     * @param {DataStream} teed The teed stream
     */

    /**
     * Duplicate the stream
     *
     * Creates a duplicate stream instance and pases it to the callback.
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
     * @param  {TransformFunction} func The into object will be passed as the
     * first argument, the data object from the stream as the second.
     * @param  {Object} into Any object passed initally to the transform
     * function
     * @return {Promise}  Promise resolved by the last object returned by the
     * call of the transform function
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
     * Performs an operation on every chunk, without changing the stream
     *
     * This is a shorthand for ```stream.on("data", func)```
     *
     * @chainable
     * @param  {MapCallback} func a callback called for each chunk.
     */
    each(func) {
        this.tap().on("data", func);
        return this;
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
            beforeTransform: (chunk) => condition ? Promise.resolve(chunk) : Promise.reject(DataStream.filter),
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
     * Works oposite of while.
     *
     * @param  {FilterCallback} func The condition check
     * @return {DataStream}  the shortened stream
     */
    until(func) {
        return this.while((...args) => Promise.resolve(func(...args)).then((a) => !a));
    }

    /**
     * Override of node.js Readable pipe.
     *
     * Except for calling overriden method it proxies errors to piped stream.
     *
     * @param  {Writable} to  Writable stream to write to
     * @param  {WritableOptions} options
     * @return {Writable}  the `to` stream
     */
    pipe(to, options) {
        if (to === this) {
            return this;
        }

        this.on("error", (...err) => to.emit("error", ...err));
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
    toBufferStream(serializer) {
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
     * Alias for {@link DataStream#stringify}
     * @function toStringStream
     */

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
     * @return {Promise}  Promise resolved with the resulting array on stream
     *                    end.
     */
    toArray(initial) {
        return this.reduce(
            (arr, item) => (arr.push(item), arr),
            initial || []
        );
    }

}

DataStream.prototype.toStringStream = DataStream.prototype.stringify;

module.exports = DataStream;
