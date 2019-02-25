const ver = process.version.slice(1).split(".");

module.exports = require(+ver[0] > 8 && +ver[1] > 3 ? "./lib/index" : "./v6/lib/index");
