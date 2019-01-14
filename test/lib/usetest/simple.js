module.exports = (stream, ref) => {
    return stream.map(x => x + ref);
};
