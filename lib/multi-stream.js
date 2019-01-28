/** @ignore */
const OUT = Symbol("OUT");

/** @ignore */
const mergesortStream = require("./util/merge-sort-stream");
/** @ignore */
const EventEmitter = require("events").EventEmitter;
/** @ignore */
const scramjet = require("./");

/**
 * An object consisting of multiple streams than can be refined or muxed.
 */
class MultiStream extends EventEmitter {

    /**
     * Crates an instance of MultiStream with the specified stream list
     *
     * @param  {stream.Readable[]} streams the list of readable streams (other
     *                                     objects will be filtered out!)
     * @param  {Object} options Optional options for the super object. ;)
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

        if (Array.isArray(streams))
            streams.forEach(
                (str) => this.add(str)
            );
    }

    /**
     * Returns the current stream length
     * @return {number}
     */
    get length() {
        return this.streams.length;
    }

    /**
     * Returns new MultiStream with the streams returned by the transform.
     *
     * Runs Function for every stream, returns a new MultiStream of mapped
     * streams and creates a new MultiStream consisting of streams returned
     * by the Function.
     *
     * @chainable
     * @param  {MapCallback} aFunc Mapper ran in Promise::then (so you can
     *                                  return a promise or an object)
     * @return {MultiStream}  the mapped instance
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
     * @param  {Arguments} args arguments for
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
     * @param  {TransformFunction} func Filter ran in Promise::then (so you can
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
     * @param  {ComparatorFunction} comparator Should return -1 0 or 1 depending on the
     *                                  desired order. If passed the chunks will
     *                                  be added in a sorted order.
     * @return {DataStream}  The resulting DataStream
     *
     * @test test/methods/multi-stream-mux.js
     */
    mux(comparator, Clazz) {

        this[OUT] = Clazz ? new Clazz() : new scramjet.DataStream();

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

        return mergesortStream(this, comparator, 0, Clazz);
    }

    /**
     * Adds a stream to the MultiStream
     *
     * If the stream was muxed, filtered or mapped, this stream will undergo the
     * same transforms and conditions as if it was added in constructor.
     *
     * @meta.noReadme
     * @param {stream.Readable} stream [description]
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
     * @param {stream.Readable} stream [description]
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

        if (!this.streams.length) {
            this.emit("empty");
        }

        return this;
    }

}

module.exports = MultiStream;
