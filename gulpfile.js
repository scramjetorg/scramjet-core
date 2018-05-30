/* eslint-disable node/no-unpublished-require */
const {exec: execp} = require('child_process');
const path = require("path");
const {promisify} = require('util');
const fs = require('fs');

const gulp = require("gulp");
const rename = require("gulp-rename");
const log = require("fancy-log");
const dmd = require('dmd');
const jsdoc = require('jsdoc-api');
const jsdocParse = require('jsdoc-parse');
const tape_nodeunit_runner = require("./test/tape-runner");
const {DataStream} = require('./');

const lint = require("./scripts/tasks/lint");

gulp.task('lint', lint());

gulp.task("test_legacy", function () {
    return gulp.src("test/v1/*.js")
        .pipe(tape_nodeunit_runner({timeout: 5000}))
    ;
});

const jsdoc2md = async ({files, plugin}) => {
    const data = await jsdoc.explain({files});
    const parsed = await jsdocParse(data);
    const output = await dmd.async(parsed, { plugin, "member-index-format": "list" });

    return output;
};

gulp.task("readme", async () => {
    return promisify(fs.writeFile)(
        path.join(__dirname, 'README.md'),
        await jsdoc2md({files: ["lib/data-stream.js", "lib/string-stream.js", "lib/buffer-stream.js", "lib/multi-stream.js"], plugin: "jsdoc2md/plugin.js"})
    );
});

gulp.task("docs", gulp.series("readme", function() {
  return gulp.src("lib/*.js")
        .pipe(new DataStream())
        .map(async (file) => {
            const output = await jsdoc2md({ files: [file.path], plugin: "jsdoc2md/plugin-docs.js"});
            file.contents = Buffer.from(output);
            return file;
        })
        .on("error", function(err) {
            log.error("jsdoc2md failed", err.stack);
        })
        .pipe(rename(function(path) {
            path.extname = ".md";
        }))
        .pipe(gulp.dest("docs/"));
}));

gulp.task("scm_clean", gulp.series("docs", function (cb) {
    execp("git status --porcelain", (err, stdout) => {
        if (err) {
            cb(err);
        } else if (stdout.trim()) {
            cb(new Error("Workdir not clean!"));
        } else {
            cb();
        }
    });
}));

gulp.task("test", gulp.series("lint", "test_legacy"));
gulp.task("default", gulp.series("readme", "lint", "docs", "test_legacy"));
gulp.task("prerelease", gulp.series("default", "scm_clean"));
