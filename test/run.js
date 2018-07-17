#!/usr/bin/env node

const { DataStream } = require("scramjet");
const path = require("path");

DataStream
    .fromArray([{path: path.resolve(process.cwd(), process.argv[2])}])
    .use("nodeunit-tape-compat", {timeout: 10000})
;
