/** @ignore */
const scramjet = require(".");

/** @ignore */
const SPLIT_LINE = /\r\n?|\n/g;

/**
 * A stream of string objects for further transformation on top of DataStream.
 *
 * Example:
 *
 * ```js
 * StringStream.from(async () => (await fetch('https://example.com/data/article.txt')).text())
 *     .lines()
 *     .append("\r\n")
 *     .pipe(fs.createWriteStream('./path/to/file.txt'))
 * ```
 * @extends DataStream
 * @memberof module:scramjet.
 * @scope public
 */
class StringStream extends scramjet.DataStream {

    /**
     * Constructs the stream with the given encoding
     *
     * @param  {string} [encoding="utf-8"] the encoding to use
     * @param  {DataStreamOptions} [options={}] the encoding to use
     * @return {StringStream}  the created data stream
     *
     * @test test/methods/string-stream-constructor.js
     */
    constructor(encoding, options) {
        super(typeof encoding === "string" ? options : encoding);

        this.buffer = "";
        this.encoding = typeof encoding === "string" ? encoding : "utf8";
    }

    /**
     * @callback ShiftStringCallback
     * @memberof module:scramjet~
     * @param {string|any} shifted Shifted chars
     */

    /**
     * Shifts given length of chars from the original stream
     *
     * Works the same way as {@see DataStream.shift}, but in this case extracts
     * the given number of characters.
     *
     * @chainable
     * @alias module:scramjet.StringStream#pop
     * @alias module:scramjet.StringStream#shift
     * @param {number} bytes The number of characters to shift.
     * @param {ShiftStringCallback} func Function that receives a string of shifted chars.
     *
     * @test test/methods/string-stream-shift.js
     */
    shift(bytes, func) {
        const ret = "";
        const str = this.tap()._selfInstance({
            referrer: this
        });
        let offs = 0;

        const chunkHandler = (chunk) => {
            const length = Math.min(bytes - offs, chunk.length);
            chunk.substr(0, length);
            offs += length;
            if (length >= bytes) {
                unHook()
                    .then(
                        () => {
                            str.write(chunk.slice(length));
                            this.pipe(str);
                        }
                    );
            }
        };

        const endHandler = (...args) => {
            if (ret.length < bytes) {
                unHook();
            }
            str.end(...args);
        };

        const errorHandler = str.emit.bind(str, "error");

        const unHook = () => {
            this.removeListener("data", chunkHandler);
            this.removeListener("end", endHandler);
            this.removeListener("error", errorHandler);
            return Promise.resolve(ret)
                .then(func);
        };


        this.on("data", chunkHandler);
        this.on("end", endHandler);
        this.on("error", errorHandler);

        return str;
    }

    /**
     * A handy split by line regex to quickly get a line-by-line stream
     */
    static get SPLIT_LINE() {
        return SPLIT_LINE;
    }

    /**
     * Splits the string stream by the specified RegExp or string
     *
     * @chainable
     * @param  {RegExp|string} splitter What to split by
     *
     * @test test/methods/string-stream-split.js
     */
    split(splitter) {
        if (splitter instanceof RegExp || typeof splitter === "string") {
            return this.tap().pipe(this._selfInstance({
                transform(chunk, encoding, callback) {
                    this.buffer += chunk.toString(this.encoding);
                    const newChunks = this.buffer.split(splitter);
                    while(newChunks.length > 1) {
                        this.push(newChunks.shift());
                    }
                    this.buffer = newChunks[0];
                    callback();
                },
                flush(callback) {
                    this.push(this.buffer);
                    this.buffer = "";
                    callback();
                },
                referrer: this
            }));
        } else if (splitter instanceof Function) {
            return this.tap().pipe(new (this.constructor)({
                transform: splitter,
                referrer: this
            }));
        }
    }

    /**
     * Finds matches in the string stream and streams the match results
     *
     * @chainable
     * @param  {RegExp} matcher A function that will be called for every
     *                             stream chunk.
     *
     * @test test/methods/string-stream-match.js
     */
    match(matcher) {
        if (matcher instanceof RegExp) {
            const replaceRegex = (matcher.source.search(/\((?!\?)/g) > -1) ?
                new RegExp("[\\s\\S]*?" + matcher.source, (matcher.ignoreCase ? "i" : "") + (matcher.multiline ? "m" : "") + (matcher.unicode ? "u" : "") + "g") :
                new RegExp("[\\s\\S]*?(" + matcher.source + ")", (matcher.ignoreCase ? "i" : "") + (matcher.multiline ? "m" : "") + (matcher.unicode ? "u" : "") + "g")
                ;

            return this.tap().pipe(this._selfInstance({
                transform(chunk, encoding, callback) {
                    this.buffer = (this.buffer || "") + chunk.toString("utf-8");
                    this.buffer = this.buffer.replace(replaceRegex, (...match) => {
                        this.push(match.slice(1, match.length - 2).join(""));
                        return "";
                    });

                    callback();
                },
                referrer: this
            }));

        }
        throw new Error("Matcher must be a RegExp!");
    }

    /**
     * Transforms the StringStream to BufferStream
     *
     * Creates a buffer stream from the given string stream. Still it returns a
     * DataStream derivative and isn't the typical node.js stream so you can do
     * all your transforms when you like.
     *
     * @meta.noReadme
     * @chainable
     * @return {BufferStream}  The converted stream.
     *
     * @test test/methods/string-stream-tobufferstream.js
     */
    toBufferStream() {
        return this.tap().map(
            (str) => Buffer.from(str, this.encoding),
            new scramjet.BufferStream({
                referrer: this
            })
        );
    }

    toStringStream(encoding) {
        if (encoding)
            return this.tap().pipe(this._selfInstance(encoding, {
                referrer: this
            }));
        else
            return this;
    }

    /**
     * @callback ParseCallback
     * @memberof module:scramjet~
     * @param {string} chunk the transformed chunk
     * @return {Promise<any>|any}  the promise should be resolved with the parsed object
     */

    /**
      * Parses every string to object
      *
      * The method MUST parse EVERY string into a single object, so the string
      * stream here should already be split.
      *
      * @chainable
      * @param  {ParseCallback} parser The transform function
      * @param {function(new:DataStream)} [StreamClass] the output stream class to return
      * @return {DataStream}  The parsed objects stream.
      *
      * @test test/methods/string-stream-parse.js
      */
    parse(parser, StreamClass = scramjet.DataStream) {
        return this.tap().map(parser, StreamClass);
    }

    /**
     * Alias for {@link StringStream#parse}
     * @memberof module:scramjet.StringStream#
     * @method toDataStream
     */

    /**
      * @meta.noReadme
      * @ignore
      */
    _transform(chunk, encoding, callback) {
        this.push(chunk.toString(this.encoding));
        return callback();
    }

    /**
     * Creates a StringStream and writes a specific string.
     *
     * @param  {string} stream   the string to push the your stream
     * @param  {string} encoding optional encoding
     * @return {StringStream}          new StringStream.
     */
    static fromString(stream, encoding) {
        const st =  new this(encoding || "utf-8");
        st.end(stream);
        return st;
    }

    /**
     * Creates a pipeline of streams and returns a scramjet stream.
     *
     * @see DataStream.pipeline
     * @static
     * @param {Array|Iterable<any>|AsyncGeneratorFunction|GeneratorFunction|AsyncFunction|Function|string|Readable} readable the initial readable argument that is streamable by scramjet.from
     * @param {AsyncFunction|Function|Transform} transforms Transform functions (as in {@link DataStream..use}) or Transform streams (any number of these as consecutive arguments)
     *
     * @returns {StringStream} a new StringStream instance of the resulting pipeline
     */
    static pipeline(...args) {
        return scramjet.DataStream.pipeline.call(this, ...args);
    }

    /**
     * Create StringStream from anything.
     *
     * @see DataStream.from
     * @see module:scramjet.from
     *
     * @param {string|Array|Iterable<any>|AsyncGeneratorFunction|GeneratorFunction|AsyncFunction|Function|Readable} source argument to be turned into new stream
     * @param {DataStreamOptions|Writable} [options={}]
     * @return {StringStream}          new StringStream.
     */
    static from(source, options, ...args) {
        try {
            return scramjet.DataStream.from.call(this, source, options, ...args);
        } catch(e) {
            if (typeof source === "string") {
                return this.fromString(source);
            }
            throw e;
        }
    }

}

/**
 * @ignore
 */
StringStream.prototype.pop = StringStream.prototype.shift;

module.exports = StringStream;
