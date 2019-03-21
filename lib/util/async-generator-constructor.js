if (process.version.split(".") < 10)
    module.exports = {};
else
// eslint-disable-next-line node/no-unsupported-features/es-syntax
    module.exports = Object.getPrototypeOf(async function*(){}).constructor;
