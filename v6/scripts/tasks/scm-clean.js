"use strict";

const _require = require("child_process"),
      execp = _require.exec;

module.exports = () => function scmClean(cb) {
  execp("git status --porcelain", (err, stdout) => {
    if (err) {
      cb(err);
    } else if (stdout.trim()) {
      cb(new Error("Workdir not clean: \n  " + stdout.trim().replace("\n", "  \n")));
    } else {
      cb();
    }
  });
};