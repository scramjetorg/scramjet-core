const {jsdoc2md} = require("../lib/util");
const {promisify} = require("util");
const fs = require("fs");

module.exports = (config, target) => {
    return async () => {
        return promisify(fs.writeFile)(
            target,
            await jsdoc2md(config)
        );
    };
};
