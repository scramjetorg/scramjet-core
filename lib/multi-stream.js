const OUT = Symbol("OUT");

/** @ignore */
const mergesortStream = require("./util/merge-sort-stream");
/** @ignore */
const EventEmitter = require("events").EventEmitter;
/** @ignore */
const scramjet = require("./");
const { DataStream, PromiseTransformStream } = scramjet;

/**
 * An object consisting of multiple streams than can be refined or muxed.
 *
 * The idea behind a MultiStream is being able to mux and demux streams when needed.
 *
 * Usage:
 * ```javascript
 * new MultiStream([...streams])
 *  .mux();
 *
 * new MultiStream(function*(){ yield* streams; })
 *  .map(stream => stream.filter(myFilter))
 *  .mux();
 * ```
 *
 * @memberof module:scramjet.
 */
class MultiStream extends EventEmitter {

    /**
     * Crates an instance of MultiStream with the specified stream list
     *
     * @param  {stream.Readable[]|AsyncGenerator<Readable>|Generator<Readable>} streams the list of readable streams (other objects will be filtered out!)
     * @param  {object} [options={}] Optional options for the super object. ;)
     *
     * @test test/methods/multi-stream-constructor.js
     */
    constructor(streams, ...args) {

        super(args.length ? args[0] : streams);

        /**
         * Array of all streams
         * @type {Array}
         */
        this.streams = [];

        /**
         * Source of the MultiStream.
         *
         * This is nulled when the stream ends and is used to control the
         *
         * @type {DataStream}
         */
        this.source = null;

        if (Array.isArray(streams)) {
            streams.forEach((str) => this.add(str));
        } else if (streams) {
            this.source = scramjet.DataStream
                .from(streams)
                .do(stream => this.add(stream))
                .run()
                .then(() => this._checkEmpty(true))
            ;
        }
    }

    /**
     * Constructs MultiStream from any number of streams-likes
     *
     * @param {Array<Array|Iterable<any>|AsyncGeneratorFunction|GeneratorFunction|AsyncFunction|Function|string|Readable>} streams the array of input streamlike elements
     * @param {function(new:DataStream)} [StreamClass=DataStream]
     * @returns {MultiStream}
     */
    static from(streams, StreamClass = DataStream) {
        if (!(StreamClass.prototype instanceof PromiseTransformStream))
            throw new Error("From can instantiate stream-like classes only");

        // We should handle non-arrays here as well
        return new this(streams.map(x => StreamClass.from(x)));
    }

    /**
     * Returns the current stream length
     * @return {number}
     */
    get length() {
        return this.streams.length;
    }


    /**
     * @callback MultiMapCallback
     * @memberof module:scramjet~
     * @async
     * @param {DataStream} stream
     * @returns {DataStream}
     */

    /**
     * Returns new MultiStream with the streams returned by the transform.
     *
     * Runs a callback for every stream, returns a new MultiStream of mapped
     * streams and creates a new MultiStream consisting of streams returned
     * by the Function.
     *
     * @chainable
     * @param  {MultiMapCallback} aFunc Add callback (normally you need only this)
     * @param  {MultiMapCallback} rFunc Remove callback, called when the stream is removed
     * @return {Promise<MultiStream>}  the mapped instance
     *
     * @test test/methods/multi-stream-map.js
     */
    map(aFunc, rFunc) {
        return Promise.all(
            this.streams.map(
                (s) => {
                    return Promise.resolve(s)
                        .then(aFunc)
                    ;
                }
            )
        ).then(
            (streams) => {
                const out = new (this.constructor)(
                    streams
                );

                this.on(
                    "add",
                    (stream) => Promise.resolve(stream)
                        .then(aFunc)
                        .then(out.add.bind(out))
                );

                if (rFunc)
                    this.on(
                        "remove",
                        (stream) => Promise.resolve(stream)
                            .then(rFunc)
                            .then(out.remove.bind(out))
                    );

                return out;
            }
        );
    }

    /**
     * Calls Array.prototype.find on the streams
     *
     * @param  {any[]} ...args arguments for
     * @return {DataStream}  found DataStream
     */
    find(...args) {
        return this.streams.find(...args);
    }

    each(aFunc, rFunc) {
        return Promise.all(
            this.streams.map(
                (s) => {
                    return Promise.resolve(s)
                        .then(aFunc)
                    ;
                }
            )
        ).then(
            () => {
                this.on(
                    "add",
                    (stream) => Promise.resolve(stream).then(aFunc)
                );

                if (rFunc)
                    this.on(
                        "remove",
                        (stream) => Promise.resolve(stream).then(rFunc)
                    );

                return this;
            }
        );
    }

    /**
     * Filters the stream list and returns a new MultiStream with only the
     * streams for which the Function returned true
     *
     * @chainable
     * @param  {Function} func Filter ran in Promise::then (so you can
     *                                  return a promise or a boolean)
     * @return {MultiStream}  the filtered instance
     *
     * @test test/methods/multi-stream-filter.js
     */
    filter(func) {
        return Promise.all(
            this.streams.map(
                (s) => Promise.resolve(s)
                    .then(func)
                    .then((o) => o ? s : null)
            )
        ).then(
            (streams) => {
                const out = new (this.constructor)(
                    streams.filter((s) => s)
                );
                this.on(
                    "add",
                    (stream) => Promise.resolve(stream)
                        .then(func)
                        .then(out.add.bind(out))
                );
                this.on(
                    "remove", out.remove.bind(out)
                );
                return out;
            }
        );
    }

    /**
     * Muxes the streams into a single one
     *
     * @todo For now using comparator will not affect the mergesort.
     * @todo Sorting requires all the streams to be constantly flowing, any
     *       single one drain results in draining the muxed too even if there
     *       were possible data on other streams.
     *
     * @param  {Function} [comparator] Should return -1 0 or 1 depending on the
     *                                  desired order. If passed the chunks will
     *                                  be added in a sorted order.
     * @param {function(new:DataStream)} [ClassType=DataStream] the class to be outputted
     * @return {DataStream}  The resulting DataStream
     *
     * @test test/methods/multi-stream-mux.js
     */
    mux(comparator = undefined, ClassType = scramjet.DataStream) {

        this[OUT] = new ClassType();

        if (!comparator) {

            const unpipeStream = (stream) => {
                if (stream) stream.unpipe(this[OUT]);
                this[OUT].setMaxListeners(this.streams.length);
            };

            const pipeStream = (stream) => {
                this[OUT].setMaxListeners(this.streams.length);
                stream.pipe(this[OUT], {end: false});
            };

            this.on("add", pipeStream);
            this.on("remove", unpipeStream);

            this.streams.forEach(pipeStream);

            this.on("empty", () => this[OUT].end());

            return this[OUT];
        }

        return mergesortStream(this, comparator, 0, ClassType);
    }

    /**
     * Adds a stream to the MultiStream
     *
     * If the stream was muxed, filtered or mapped, this stream will undergo the
     * same transforms and conditions as if it was added in constructor.
     *
     * @meta.noReadme
     * @param {Readable} stream [description]
     *
     * @test test/methods/multi-stream-add.js
     */
    add(stream) {

        if (stream) {
            this.streams.push(stream);
            this.setMaxListeners(this.streams.length + EventEmitter.defaultMaxListeners);
            this.emit("add", stream, this.streams.length - 1);
            stream.on("end", () => this.remove(stream));
        }

        return this;
    }

    /**
     * Removes a stream from the MultiStream
     *
     * If the stream was muxed, filtered or mapped, it will be removed from same
     * streams.
     *
     * @meta.noReadme
     * @param {Readable} stream [description]
     *
     * @test test/methods/multi-stream-remove.js
     */
    remove(stream) {

        const strIndex = this.streams.indexOf(stream);
        if (strIndex >= 0) {
            this.setMaxListeners(this.streams.length + EventEmitter.defaultMaxListeners);
            this.streams.splice(strIndex, 1);
            this.emit("remove", stream, strIndex);
        }

        this._checkEmpty();

        return this;
    }

    _checkEmpty(ended) {
        if (ended) this.source = null;
        if (!this.source && !this.streams.length) this.emit("empty");
    }

}

module.exports = MultiStream;
