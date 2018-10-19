import {StreamError} from "./stream-errors";

/**
 * Generate write methods on the stream class.
 *
 * @internal
 * @param  {ScramjetOptions} newOptions Sanitized options passed to scramjet stream
 * @return {Boolean} returns true if creation of new stream is not necessary (promise can be pushed to queue)
 */
export default () => function mkWrite(that, newOptions) {
    that.tap().setOptions(
        {
            // transforms: [],
            promiseWrite: newOptions.promiseWrite
        }
    );

    that.pipe = () => {
        throw new Error("Method not allowed on a Writable only stream");
    };

    that._write = (chunk, encoding, callback) => {
        Promise.resolve(chunk)
            .then((chunk) => that._options.promiseWrite(chunk, encoding))
            .then(() => callback())
            .catch(
                (e) => that.raise(new StreamError(e, that, "EXTERNAL", chunk), chunk)
            );
    };
};
