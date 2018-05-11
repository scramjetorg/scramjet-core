module.exports = (out, {getStream}) => {
    out.concat(
        getStream('data-stream'),
        getStream('string-stream'),
        getStream('buffer-stream'),
        getStream('multi-stream')
    );
};
