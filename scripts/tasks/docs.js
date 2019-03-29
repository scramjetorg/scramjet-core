const gulp = require("gulp");
const {jsdoc2md} = require("../lib/util");
const rename = require("gulp-rename");
const log = require("fancy-log");
const through2 = require("through2");

module.exports = (source, jd2mdConfig, dest) => {
    return function makeDocs() {
        return gulp.src(source)
            .pipe(
                through2((file, _, done) => jsdoc2md(
                    Object.assign({}, jd2mdConfig, {newLine: "\n", files: [file.path]})
                )
                    .then((output) => (file.contents = Buffer.from(output), file))
                    .then(done)
                ))
            .on("error", function(err) {
                log.error("jsdoc2md failed", err.stack);
            })
            .pipe(rename(function(path) {
                path.extname = ".md";
            }))
            .pipe(gulp.dest(dest));
    };
};
