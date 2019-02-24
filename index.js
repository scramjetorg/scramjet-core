const ver = process.version.slice(1).split(".");

module.exports = require(+ver[0] > 8 && +ver[1] > 3 ? "./lib/index" : "./lib-6/index");
