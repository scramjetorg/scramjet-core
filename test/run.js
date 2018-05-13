#!/usr/bin/env node

const {DataStream} = require('scramjet');
const path = require('path');
const tapeRunner = require('./tape-runner');

DataStream.fromArray([{path: path.resolve(process.cwd(), process.argv[2])}])
    .pipe(tapeRunner({timeout: 5000}));
