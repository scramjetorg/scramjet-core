"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const _require = require(process.env.SCRAMJET_TEST_HOME || "../../"),
      DataStream = _require.DataStream;

const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69];
module.exports = {
  test_pipe: {
    sync(test) {
      return _asyncToGenerator(function* () {
        test.plan(1);
        const input = arr.slice();
        const output = arr.slice();
        const src = new DataStream({
          promiseRead(many) {
            return input.splice(0, many);
          }

        });
        const tgt = new DataStream({
          promiseWrite(chunk) {
            if (output.indexOf(chunk) > -1) output.splice(output.indexOf(chunk), 1);
          }

        });
        yield src.pipe(new DataStream({
          promiseTransform(chunk) {
            return chunk + 2;
          }

        })).pipe(tgt).whenFinished();
        test.deepEqual(output, [0, 1], "All chunks but two removed");
        test.end();
      })();
    }

  },

  test_callee(test) {
    const _require2 = require("../../lib/util/utils"),
          resolveCalleeBlackboxed = _require2.resolveCalleeBlackboxed;

    const path = require("path");

    test.equals(resolveCalleeBlackboxed("test"), path.resolve(__dirname, "test"));
    test.end();
  },

  test_read: {
    starve(test) {
      return _asyncToGenerator(function* () {
        test.plan(2);
        const comp = arr.slice();
        const stream = new DataStream({
          promiseRead() {
            return comp.splice(0, 1);
          }

        });
        test.ok(stream instanceof DataStream, "Stream still implements a DataStream");
        test.deepEqual((yield stream.toArray()), arr, "Stream must read the array in sync");
        test.end();
      })();
    },

    sync(test) {
      return _asyncToGenerator(function* () {
        test.plan(2);
        const comp = arr.slice();
        const stream = new DataStream({
          parallelRead(many) {
            return comp.splice(0, many);
          }

        });
        test.ok(stream instanceof DataStream, "Stream still implements a DataStream");
        test.deepEqual((yield stream.toArray()), arr, "Stream must read the array in sync");
        test.end();
      })();
    },

    async(test) {
      return _asyncToGenerator(function* () {
        test.plan(2);
        const comp = arr.slice();
        const stream = new DataStream({
          promiseRead(many) {
            return _asyncToGenerator(function* () {
              return new Promise(res => process.nextTick(() => res(comp.splice(0, many))));
            })();
          }

        });
        test.ok(stream instanceof DataStream, "Stream still implements a DataStream");
        test.deepEqual((yield stream.toArray()), arr, "Stream must read the array in async");
        test.end();
      })();
    }

  },
  test_write: {
    sync(test) {
      return _asyncToGenerator(function* () {
        const stream = DataStream.fromArray([1, 2, 3, 4]);
        const comp = [];
        yield stream.pipe(new DataStream({
          promiseWrite(chunk
          /*, encoding*/
          ) {
            return _asyncToGenerator(function* () {
              comp.push(chunk);
            })();
          }

        })).whenFinished();
        test.deepEqual(comp, [1, 2, 3, 4], "Should write all chunks in order");
        test.end();
      })();
    },

    async(test) {
      return _asyncToGenerator(function* () {
        const stream = DataStream.fromArray([1, 2, 3, 4]);
        const arr = [];
        yield stream.pipe(new DataStream({
          promiseWrite(chunk
          /*, encoding*/
          ) {
            return new Promise(res => setTimeout(() => {
              arr.push(chunk);
              res();
            }, 30 + chunk % 2 * 40));
          }

        })).whenFinished();
        test.deepEqual(arr, [1, 2, 3, 4], "Should write all chunks in order");
        test.end();
      })();
    }

  },
  test_transform: {
    sync(test) {
      // TODO: Implement tests here.
      test.end();
    },

    async(test) {
      return _asyncToGenerator(function* () {
        // TODO: Implement tests here.
        test.end();
      })();
    }

  }
};