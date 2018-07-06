const {exec: execp} = require("child_process");

module.exports = () => function scmClean (cb) {
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
