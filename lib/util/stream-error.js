const os = require('os');
const combineStack = (stack, ...errors) => {
    return errors.reduce(
        (stack, trace) => {
            if (typeof trace === 'string')
                return stack + trace + os.EOL;
            else
                return stack;
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
