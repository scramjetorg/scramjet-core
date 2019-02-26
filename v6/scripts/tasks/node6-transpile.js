"use strict";

const gulp = require("gulp");

const babel = require("gulp-babel");

module.exports = (src = "lib/**/*.js", dest = "lib-6/", options = {
  presets: [["@babel/preset-env", {
    "targets": {
      node: "6.0.0"
    },
    "useBuiltIns": "usage",
    "exclude": ["es6.promise"]
  }]]
}) => () => gulp.src(src).pipe(babel(options)).pipe(gulp.dest(dest));