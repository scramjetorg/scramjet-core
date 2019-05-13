const dmd = require("dmd");
const jsdoc = require("jsdoc-api");
const jsdocParse = require("jsdoc-parse");

const jsdoc2md = async ({files, ...options}) => {
    const data = await jsdoc.explain({files});
    const parsed = await jsdocParse(data);
    const output = await dmd.async(parsed, {
        ...options,
        "member-index-format": "list"
    });

    return output;
};

module.exports = {
    jsdoc2md
};
