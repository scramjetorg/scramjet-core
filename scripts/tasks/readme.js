const {jsdoc2md, promisify} = require("../lib/util");
const fs = require("fs");

module.exports = (config, target) => {
    return async () => {
        return promisify(fs.writeFile)(
            target,
            await jsdoc2md(config)
        );
    };
};
