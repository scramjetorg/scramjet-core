const { StreamError } = require("./stream-errors");

/**
 * Generate read methods on the stream class.
 *
 * @internal
 * @param  {ScramjetOptions} newOptions Sanitized options passed to scramjet stream
 * @return {Boolean} returns true if creation of new stream is not necessary (promise can be pushed to queue)
 */
module.exports = () => function mkRead(newOptions) {
    this.setOptions(
        {
            // transforms: [],
            promiseRead: newOptions.promiseRead
        }
    );

    let chunks = [];
    let done = false;
    // TODO: implement the actual parallel logic - items can be promises and should be flushed when resolved.
    const pushSome = () => Array.prototype.findIndex.call(chunks, chunk => {
        return !this.push(chunk);
    }) + 1;

    // let last = Promise.resolve();
    // let processing = [];

    this.on("pipe", () => {
        throw new Error("Cannot pipe to a Readable stream");
    });

    this._read = (size) => {
        let add = 0;
        Promise.resolve()
            .then(() => {
                if (!done) {
                    return Promise.resolve(size)
                        .then(this._options.promiseRead)
                        .then(nw => {
                            chunks.push(...nw);
                            add = nw.length;
                        });
                }
            })
            .then(() => {
                const pushed = pushSome();
                chunks = chunks.slice(pushed || Infinity);

                done = done || !add;
                if (done && !chunks.length) {
                    return new Promise((res, rej) => this._flush((err) => err ? rej(err) : res()))
                        .then(() => this.push(null));
                }
            })
            .catch(e => this.raise(new StreamError(e, this)));
    };

};
