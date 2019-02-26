#!/usr/bin/env node
"use strict";

const _require = require("../"),
      DataStream = _require.DataStream;

const path = require("path");

DataStream.fromArray([{
  path: path.resolve(process.cwd(), process.argv[2])
}]).use("nodeunit-tape-compat", {
  timeout: 10000
});