const {jsdoc2md} = require("../lib/util");
const path = require("path");
const {promisify} = require("util");
const fs = require("fs");

module.exports = (config) => {
    return async () => {
        return promisify(fs.writeFile)(
            path.join(__dirname, "README.md"),
            await jsdoc2md(config)
        );
    };
};
