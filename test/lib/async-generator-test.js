// eslint-disable-next-line node/no-unsupported-features/es-syntax
module.exports = async function*() {
    await new Promise(res => process.nextTick(res));
    yield 1;
    yield 2;
    return 3;
};
