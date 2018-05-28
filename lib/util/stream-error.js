class StreamError extends Error {

    constructor(message, stream, code = "GENERAL", chunk) {
        super();

        this.chunk = chunk;
        this.stream = stream;
        this.code = "ERR_SCRAMJET_" + code;
    }

    get stack() {
        super.stack + "\n---raised in---\n" + this.streamTrace;
    }

}

module.exports = {StreamError};
