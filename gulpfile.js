/* eslint-disable node/no-unpublished-require */
const gulp = require("gulp");
const path = require("path");
const gutil = require("gulp-util");
const {DataStream} = require('./');
const rename = require("gulp-rename");
const nodeunit_runner = require("gulp-nodeunit-runner");
const {exec: execp} = require('child_process');
const eslint = require('gulp-eslint');
const jsdoc = require('jsdoc-api');
const jsdocParse = require('jsdoc-parse');
const dmd = require('dmd');
const {promisify} = require('util');
const fs = require('fs');

gulp.task('lint', () => {
    // ESLint ignores files with "node_modules" paths.
    // So, it's best to have gulp ignore the directory as well.
    // Also, Be sure to return the stream from the task;
    // Otherwise, the task may end before the stream has finished.
    return gulp.src(['**/*.js','!node_modules/**'])
        // eslint() attaches the lint output to the "eslint" property
        // of the file object so it can be used by other modules.
        .pipe(eslint())
        // eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format())
        // To have the process exit with an error code (1) on
        // lint error, return the stream and pipe to failAfterError last.
        .pipe(eslint.failAfterError());
});

gulp.task("test_legacy", function () {
    return gulp.src("test/v1/*.js")
        .pipe(nodeunit_runner({reporter: "verbose"}))
    ;
});

gulp.task("scm_clean", ["default"], function(cb){
    execp("git status --porcelain", (err, stdout) => {
        if (err) {
            cb(err);
        } else if (stdout.trim()) {
            cb(new Error("Workdir not clean!"));
        } else {
            cb();
        }
    });
});

const jsdoc2md = async ({files, plugin}) => {

    const data = await jsdoc.explain({files});
    const parsed = await jsdocParse(data);
    const output = await dmd.async(parsed, {plugin});

    return output;
};

gulp.task("readme", async () => {
    return promisify(fs.writeFile)(
        path.join(__dirname, 'README.md'),
        await jsdoc2md({files: ["lib/data-stream.js", "lib/string-stream.js", "lib/buffer-stream.js", "lib/multi-stream.js"], plugin: "jsdoc2md/plugin.js"})
    );
});

gulp.task("docs", ["readme"], function() {
  return gulp.src("lib/*.js")
        .pipe(new DataStream())
        .map(async (file) => {
            const output = await jsdoc2md({files: [file.path]});
            file.contents = Buffer.from(output);
            return file;
        })
        .on("error", function(err) {
            gutil.log(gutil.colors.red("jsdoc2md failed"), err.stack);
        })
        .pipe(rename(function(path) {
            path.extname = ".md";
        }))
        .pipe(gulp.dest("docs/"));
});

gulp.task("test", ["lint", "test_legacy"]);
gulp.task("default", ["readme", "lint", "docs", "test_legacy"]);
gulp.task("prerelease", ["scm_clean"]);
