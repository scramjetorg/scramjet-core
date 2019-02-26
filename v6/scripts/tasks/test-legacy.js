"use strict";

const path = require("path");

const gulp = require("gulp");

const _require = require("../../"),
      DataStream = _require.DataStream;

const _tape = require("tape");

const tape = require("tape-promise").default(_tape); // decorate tape


module.exports = function testLegacy(src) {
  const cache = Object.keys(require.cache).reduce((acc, k) => (acc[k] = true, acc), {});
  return () => DataStream.from(gulp.src(src)).map(file => [path.basename(file.path), require(file.path)]).map(([name, tests]) => Object.keys(tests).map(k => {
    if (typeof tests[k] === "function") {
      return {
        [`${name}/${k}`]: tests[k]
      };
    } else {
      return Object.keys(tests[k]).reduce((out, test) => (out[`${name}/${k}:${test}`] = tests[k][test], out), {});
    }
  }).reduce((acc, tests) => Object.assign(acc, tests), {})).into((out, obj) => {
    return Object.keys(obj).forEach(k => out.write([k, obj[k]]));
  }, new DataStream()).map(([name, test]) => tape(name, t => Promise.resolve(t).then(test))).run().then(() => {
    // Delete any modules that were added to the require cache
    Object.keys(require.cache).filter(function (k) {
      return !cache[k];
    }).forEach(function (k) {
      delete require.cache[k];
    });
  });
};