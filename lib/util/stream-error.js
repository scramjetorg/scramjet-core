const os = require('os');
const combineStack = (stack, ...errors) => {
    return errors.reduce(
        (stack, trace) => {
            if (trace.indexOf('\n') >= 0)
                return stack + os.EOL + trace.substr(trace.indexOf('\n'));

            else
                return stack + os.EOL + trace;
        },
        stack
    );
};

class StreamError extends Error {

    constructor(message, stream, code = "GENERAL", chunk) {

        if (message instanceof StreamError)
            return message;

        const cause = [];
        if (message instanceof Error) {
            cause.push(message.stack);
            message = message.message;
        }

        super(message);

        this.chunk = chunk;
        this.stream = stream;
        this.code = "ERR_SCRAMJET_" + code;

        const stack = this.stack;

        Object.defineProperty(this, 'stack', {
            get: function () {
                return combineStack(stack, '  caused by:', ...cause, '--- raised in ---', stream.constructed);
            }
        });

    }

}

module.exports = {StreamError, combineStack};
