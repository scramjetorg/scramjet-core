const gulp = require("gulp");
const {DataStream} = require("scramjet");
const {jsdoc2md} = require("../lib/util");
const rename = require("gulp-rename");
const log = require("fancy-log");

module.exports = (source, jd2mdConfig, dest) => {
    return function makeDocs() {
        return DataStream.from(gulp.src(source))
            .map(async (file) => {
                const output = await jsdoc2md(Object.assign({}, jd2mdConfig, { newLine: "\n", files: [file.path] }));
                // eslint-disable-next-line require-atomic-updates
                file.contents = Buffer.from(output);
                return file;
            })
            .on("error", function(err) {
                log.error("jsdoc2md failed", err.stack);
            })
            .pipe(rename(function(path) {
                path.extname = ".md";
            }))
            .pipe(gulp.dest(dest));
    };
};
