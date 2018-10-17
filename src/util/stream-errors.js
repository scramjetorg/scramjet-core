import {EOL} from "os";

/**
 * Combines multiple stack instances.
 *
 * @param {String} stack main stack
 * @param  {...String} errors cause stacks
 * @return {String} combined stack
 */
export const combineStack = (stack, ...errors) => {
    return errors.reduce(
        (stack, trace) => {
            if (!trace) return stack;
            if (trace.indexOf("\n") >= 0)
                return stack + EOL + trace.substr(trace.indexOf("\n") + 1);

            return stack + EOL + trace;
        },
        stack
    );
};

/**
 * Stream error class
 */
export class StreamError extends Error {

    /**
     * Stream error constructor
     * @param {Error|String} cause the cause of the error
     * @param {PromiseTransformStream} stream the stream
     * @param {String} code informative category
     * @param {*} chunk the chunk on which the error occured
     */
    constructor(cause, stream, code = "GENERAL", chunk = null) {
        code = cause.code || code;
        stream = cause.stream || stream;
        chunk = cause.chunk || chunk;

        super(cause.message);

        if (cause instanceof StreamError)
            return cause;

        this.chunk = chunk;
        this.stream = stream;
        this.code = "ERR_SCRAMJET_" + code;
        this.cause = cause;

        const stack = this.stack;
        Object.defineProperty(this, "stack", {
            get: function() {
                return combineStack(
                    stack,
                    "  caused by:",
                    cause.stack,
                    `  --- raised in ${stream.name} constructed ---`,
                    stream.constructed
                );
            }
        });

        /** Needed to fix babel errors. */
        this.constructor = StreamError;
        this.__proto__ = StreamError.prototype;
    }

}

