
/**
 * Generate write methods on the stream class.
 *
 * @internal
 * @param  {ScramjetOptions} newOptions Sanitized options passed to scramjet stream
 * @return {Boolean} returns true if creation of new stream is not necessary (promise can be pushed to queue)
 */
module.exports = () => function mkRead(newOptions) {
    this.tap().setOptions(
        {
            // transforms: [],
            writePromise: newOptions.parallelWrite
        }
    );

    this._write = (chunk, encoding, callback) => {
        Promise.resolve(chunk)
            .then((chunk) => this._options.writePromise(chunk, encoding))
            .then(() => callback())
            .catch(
                (e) => Promise.resolve(null, this.emit("error", e, chunk))
            );
    };

    this._writev = (chunks, callback) => {
        let last = Promise.resolve();
        chunks.reduce(
            (last, [chunk, encoding]) => last.then(
                () => this._options.writePromise(chunk, encoding)
                    .catch(
                        (e) => Promise.resolve(null, this.emit("error", e, chunk))
                    )
            ),
            last
        )
        .then(() => callback())
        .catch(
            (e) => Promise.resolve(null, this.emit("error", e))
        );

    };

};
