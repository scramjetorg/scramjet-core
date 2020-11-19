
# Scramjet core

This is the last intended minor API change to `scramjet-core` before the v5 series.


## Scramjet Core 4.31.2: Fix compatibility for nodejs 15.x

* 7cf152a - Fix tests in v15
* 0c55228 - Dependencies update
* d021a3c - Docs update

## Scramjet Core 4.30.1: Hotfix from Promise

* a937630 - Hotfix
* c5e3ef6 - Allow Promise in from, fix declaration of parse

## Scramjet Core 4.29.2: Filtered package contents fix

* 9e34741 - Add missing files
* b6425e6 - Fix missing files
* 6a12f76 - Fix docs generation
* b6ddf71 - Dependencies update.
* 073352e - Lower package size by removing unneeded items

## Scramjet Core 4.28.3: Dependencies update

* 0e284e7 - Dependencies update.

## Scramjet Core 4.28.2: Dependencies update

* 58f426d - Dependencies update.

## Scramjet Core 4.28.1: Minor test fix and dependencies update

* 3f83c46 - Fix tests to work on faster CPUs

## Scramjet Core 4.28.0: TS Compat: remove pipe from docs

* df8deb6 - Dependencies update.
* 5be3fc7 - TS Compat: Remove pipe from docs

## Scramjet Core 4.27.8: Dependencies update

* 3515a02 - Dependencies update.

## Scramjet Core 4.27.7: Dependecies update

* 4e29202 - Dependencies update.

## Scramjet Core 4.27.6: Fix npmignore

* e4ec031 - Fix npmignore

## Scramjet Core 4.27.5: Readme fix attempt


## Scramjet Core 4.27.4: Readme fix attempt

* 5da2d0d - Changelog update

## Scramjet Core 4.27.3: Readme fix attempt

* 6b19f52 - Add npmignore
* cbce7f0 - Dependencies update

## Scramjet Core 4.27.0: Dependencies update and a small fix

* dddf971 - Docs update
* 94118b4 - Dependencies update.
* 5178b4a - Update ts typings

## Scramjet Core 4.26.0: Fix typescript defs and deps upgrade

* 492badc - Fix docs
* 6c572cc - Dependencies update.
* 14ad05f - Fix definitions for typescript

## Scramjet Core 4.25.2: Remove support for node v8.x

* 2a582c2 - Dropping support for node v8.x
* d4364ba - Scramjet is now a startup!
* 2e1f98c - Dependencies update.
* 9f4ca07 - Dependencies update.

## Scramjet Core 4.25.0: New copy method

* 6eb2092 - Fix tests and nodeunit
* 00055e0 - Add new method copy, fix tests for tee

## Scramjet Core 4.24.4: Dependency update

* e0dec30 - Dependencies update.

## Scramjet Core 4.24.3: Dependencies update

* 5381a84 - Dependencies update.
* d32b15c - Dependencies update.

## Scramjet Core 4.24.2: Dependencies update

* 20b7c5b - Dependencies update.

## Scramjet Core 4.24.1: Dependencies update

* 3c0d932 - Dependencies update.
* 9b7e09c - Dependencies update.

## Scramjet Core 4.24.0: Fix optional arguments definitions

* 34a1d1c - Fix optional argument definition
* ecaae81 - Fix optional argument definition
* 8fc4c62 - Dependencies update.
* ebdd275 - Remove unnecessary CNAME file
* 0f412ae - Documentation fixes

## Scramjet Core 4.23.0: MultiStream.from, docs & dependencies update

* 021d6bc - Fix return value
* b23bcbe - Dependencied update and docs update
* b83b8f0 - Add MultiStream..from, clarify docs

## Scramjet Core 4.22.7 - Documentation fixes

* 9f7abb7 - Dependencies update.
* 449879e - Fix docs for ts generation
* cacd32d - Fix test case on unOrder
* fe64aa4 - Fix scripts issue making eslint testing only core
* 52b16ff - Update to work with eslint v6.x
* 1b007af - Remove breaking changes from DataStream.into

## Scramjet Core 4.22.0: Major jsdoc fixes

* db5256c - Update docs.
* 877a7ac - Dependencies update.
* 8d3824e - Fix typos in docs
* 5827e16 - Add scramjet.ScramjetErrors docs
* 1db07e1 - Remove docs from core
* 84c15a9 - Fix documentation for typescript
* 48dca6b - Fixes for better TypeScript definition and docs

## Scramjet Core 4.21.0: More Generators

* 923044a - Allow usage of iterators in MultiStream, add default serializer in stringify
* e8717c4 - Dependencies update.

## Scramjet Core 4.20.0: Fix optional arguments definitions for TypeScript

* 8421494 - Dependencies update, fix optional arguments for TypeScript.

## Scramjet Core 4.19.0: All and race

* 3508bdb - New methods all and race
* 8dc4711 - Use scramjet rules for eslint

## Scramjet Core 4.18.6: Spelling fixes and documentation updates

* bc6a4c3 - Dependencies update.
* 93cc7ce - Changelog update
* 9c1c5c3 - Lots of spelling fixes across all documentation.

## Scramjet Core 4.18.5: Fix whenRead/ing past end.

* 2832be4 - Dependencies update.
* 95e9fe3 - Fix for #33, new tests for whenRead

## Scramjet Core 4.18.4: Fix operation of createTransformModule and createReadModule

* 4fa120f - Fix module creation methods.

## Scramjet Core 4.18.3: chore: Fixes wording in docs

* 95af4d8 - Fix docs
* b0d6b4f - Fix wording as mentioned in #26

## Scramjet Core 4.18.2: Fixes pipeline and use operation on String and Buffer streams

* ce35809 - Update docs
* 5415ca1 - Some documentation
* 7daf1fc - Fix lint issue
* 7db797d - Dependencies update.
* 13ae597 - Fix and extend coverage for use command with strings
* bb705dc - Fix pipeline method on string and buffer streams
* fc8edc3 - Dependencies update.

## Scramjet Core 4.18.1: Dependencies update

* 67d959b - Fix unorder test not to break down
* 75b2159 - Dependencies update

* 2832be4 - Dependencies update.
* 95e9fe3 - Fix for #33, new tests for whenRead

## Scramjet Core 4.18.0 - 4.18.0: Allow usage of generators in use, new unorder method

* 0d22964 - Documentation fixes
* c25a20f - Fix usage of dataStream.use with generators
* 99973ad - Pass additional arguments to from in use
* 5492cfc - Fix tests for unorder
* c6d7267 - Allow use of anything streamable on dataStream.use
* 598783d - Fix some documentation entries
* ac3a6d1 - Fix unorder operation on multiple slots
* fdb7d94 - Add the unorder method

## Scramjet Core 4.17.1 - 4.17.1: Pipeline

* 2d54035 - Dependencies update: eslint scramjet tape
* 83f5587 - Catch errors on failed stream.push
* c451de9 - Fix documentation
* c44cd96 - Add safety wrappers for scramjet modules
* 811bfb9 - Fix documentation and ts definition of some methods

## Scramjet Core 4.17.0 - 4.17.0: Pipeline

* f4bc86f - Allow creating `pipeline` with a new method.
* b265321 - Allow usage of `async function` in `use`.
* f4d59ee - Documentation fix
* 3ef8c4a - Dependencies update.
* 93a13fd - Now each version will also be tested with FOSSA for possible license pollution

## Scramjet Core 4.16.17 - 4.16.17: Iterator and AsyncIterator error handling fixes

* 0c32cd3 - Changelog and skip asyncIterable test when not suppported
* 30d4b96 - Add error handling for iterator functions in read

## Scramjet Core 4.16.16 - 4.16.16: From fixes

* 700c9d2 - Use unpipe in while when data is no longer needed.
* b410644 - Fixes the case when a transform is pushed onto a stream with standard transform
* 9b9ff16 - Dependencies update.

## Scramjet Core 4.16.15 - 4.16.15: JSDoc fixes

* 9bb1eff - Docs update
* 9b9ff16 - Dependencies update.
* 4b7cb13 - Fix ts.d documentation base
* 14fb6d4 - cleanup package-lock.json

## Scramjet Core 4.16.14 - 4.16.14: Non-promise based transforms fix

* cabf6fd - Changelog update
* 700c9d2 - Use unpipe in while.
* b410644 - Fixes the case when a transform is pushed onto a stream with standard transform

## Scramjet Core 4.16.13 - Fix travis environment failures

* b47a711 - Dependencies update.
* d062814 - Omit errors occuring on travis environment if TRAVIS=true

## Scramjet Core 4.16.12 - Dependencies update

* 30cd99f - Dependencies update.

## Scramjet Core 4.16.11 - Fix execution of flushPromise on read only streams.

* a3eabd1 - Fix execution of flushPromise on read only streams.

## Scramjet Core 4.16.10 - Documentation fix

* 4ed1804 - Update docs
* 8c65108 - Fix documentation of pipe()

## Scramjet Core 4.16.9 - Fix flush promise error handling

* faaf91d - Changelog and docs
* 2a4729c - Update dependencies
* 87eb936 - Fix tests to reflect the expected flow, fix "error" event handling in pipe()
* ebd073e - Fix error to be handled before flush promise, make errors passed consistently between streams

## Scramjet Core 4.16.8 - Error handling and ordering fixes.

* b821baa - Changelog update
* d4e3664 - Dependencies update.
* 01d983e - New tests for processing using error handling
* 4f8ab46 - Fix resolution or errors and chunks returned from catch as well as ordering of those
* 8f5f5fb - Improve type docs on BufferStream.from and StringStream.from
* ba2af04 - Fix error handling in DataStream.from

## Scramjet Core 4.16.7 - Dependencies update.

* 9188cd3 - Dependencies update
* 519a6c8 - remove typo

## Scramjet Core 4.16.6 - Fix `DataStream.from` operation

* 4509fdc - Dependencies update.
* dd7bf6b - Fix `DataStream.from` operation in child classes.

## Scramjet Core 4.16.5 - Datastream.from async generator and iterator fix

* 8dd5470 - Update docs and changelog
* 056c58c - Dependencies update.
* d2c6643 - Async iterator fix and allow AsyncGenerators in node v10.

## Scramjet Core 4.16.4 - Error handling fixes

* a6eff31 - Changelog update
* f7975dc - Dependencies update.
* c7f71b5 - Fix promise resolution order in multiple handled errors scenario.
* 65470d6 - Better run operation

## Scramjet Core 4.16.3 - Error handling fixes.

* 409493e - Fix error handling
* 4fbe189 - Dependencies update

## Scramjet Core 4.16.2 - Dependencies update

* 5b2337f - Fix push operation after error handling
* 8bbe1c6 - Update dependencies

## Scramjet Core 4.16.1 - Fix from to work for non-standard streams (i.e. userland version from npm)

* bc5fe87 - Assume readable stream if protocol is sustained

## Scramjet Core 4.16.0 - do and from methods final feature release in v4

* 4f5a798 - Change CRLF to LF in docs generation on windows
* e4c4a3a - Fix a typo... Oops...
* fe8016f - Update docs
* bc58039 - Eslint fix
* b894623 - Dependencies update
* b251a35 - Fixes in from method
* df91eeb - DataStream.from method extension + Changelog
* d56bc10 - DataStream..do method

## Scramjet Core 4.15.1 - Dependencies update

* 8b80ab9 - Dependencies update.
* 7b5efe2 - Dependencies update.
* 04bf18b - Eslint fixes
* 7a9c762 - Fully tested options class

## Scramjet Core 4.15.0 - Allow tee'ing to streams directly, not only functions

* f16ee1a - Docs changes
* 78f739c - Dependencies update.
* 73eb6c5 - New feature tested
* f534bc5 - More messaging from the shared gulp task
* 6881f4b - Allow DataStream..tee to handle simple stream

## Scramjet Core 4.14.1

* Expose gulp tasks and linter config for derived modules
* Use tape runner from separate module
* Depencencies update
* Fix code quality issues
* Fix readable only streams.

## Scramjet Core 4.13.2

* Documentation fixes

## Scramjet Core 4.13.1

* Fix error handling and make sure that catch/raise methods are working correctly.
* Fix docs to better work with typescript declarations
* Update dependencies

## Scramjet Core 4.13.0

* Allow "read only" scramjet streams
* Allow "write only" scramjet streams
* Update dependencies.
* Better documentation and tests.
* More efficient `reduce`

## Scramjet Core 4.12.0

* Fix the `from` method.
* Changelog and docs update, docs generated with new templates
* Added tests for `DataStream.from`

## Scramjet Core 4.11.1

* Fix `into` method: forward errors and end stream correctly.
* Streams will now resume immediately, not on nextTick.
* Typo fixes and code clarity fixes.

## Scramjet Core 4.11.0

* Allow multiple items in `whenWrote` (all arguments will be written to the stream),
* Clearer and fixed documentation,
* Better gitignore, added test for relative modules.

## Scramjet Core 4.10.0

* Relative modules - allow using paths relative to the current file like in `require` in `DataStream..use` method.
* New `into` method allowing any rewrite while keeping flow control and error propagation,
* Make test reporter push info to standard error.

## Scramjet Core 4.9.2

* Fix reporter for tests

## Scramjet Core 4.9.1

* Changed no longer supported `nodeunit` in favor of `tape`.
* Improved travis build speed.

## Scramjet Core 4.9.0

* Node v10 support.

## Scramjet Core 4.8.0

* Fixed the EventEmitter leak messages from all scenarios.
* Added `run` method on every stream to resume the flow.
* `catch` method available on every stream (allows handling errors without breaking the stream).
* `whenDrained` and `whenEnd` methods available on every stream (returns a promise resolved on next `drain` or `end` event).
* `DataStream.toGenerator` method added (support for async generators).
* Addition of two MultiStream methods: `find` and `length` (getter).

## Scramjet Core 4.0.0

* Dropped support for node.js v6.
* Perfomance improvements in base transforms operation.

## Scramjet Core 3.2.0

* Improved stream merge.
* Added new methods: `DataStream::until` and `DataStream::while`.

## Scramjet Core 3.1.3

* Addition of a plugin interface.
* Allow adding more stream types via plugins.

## Scramjet Core 3.0.0

* Removal of non-core methods and separation of scramjet and scramjet-core.

# Scramjet 2.x

* The interface for the following classes is now considered stable:
  - ```DataStream```
  - ```StringStream```
  - ```BufferStream```
  - ```MultiStream```
* This means that no already existing method will change the interface and
  essentially the current protocol will be backwards compatible.
* Relicensed to the MIT License

## Scramjet 2.11.1

* Fixed default encoding of StringStream to "utf8"
* DataStream.fromIterator now allows asynchronous operations (by returning a promise)
* The promised plugins doc is here. :)

## Scramjet 2.11.0

* Added whenRead and whenWrote methods docs (meaning that as of 2.11 they're fully supported).
* Renamed group to separate, an alias still exists though...
* Promised plugins will be documented in more detail in 2.11.1

## Scramjet 2.10.0

scramjet.plugin interface added for plugins. More docs to come in 2.10.1.

## Scramjet 2.9.0

DataStream.fromIterator static method added, cluster method hinted.

## Scramjet 2.8.0

Implemented DataStream::timeBatch, minor docs fix

## Scramjet 2.7.0

Implemented DataStream::group.

## Scramjet 2.6.1

Fix regression on StringStream::match.

## Scramjet 2.6.0

New methods!

* StringStream.fromString - static, works like DataStream:fromArray
* StringStream::append - appends anything to every chunk
* StringStream::prepend - prepends anything to every chunk
* DataStream::unshift - writes some chunks at call time
* DataStream::flatten - a shorthand for flattening chunks which are arrays
* DataStream::batch - batch aggregation of chunks by length

Examples yet to come.

## Scramjet 2.5.2

* Dev dependencies update (nodeunit, jsdoc-to-markdown)

## Scramjet 2.5.0

* Added `use` method.

## Scramjet 2.4.2

* Removed dependency on mergesort-stream and almost 30% performance improvement on muxing streams

## Scramjet 2.4.1

* flatMap method introduced on DataStream

## Scramjet 2.3.0

* Asynchronous tranforms on multiple streams are merged into one.
* New .tap() method introduced to be able to revert to previous behavior
* Benchmark added (but is also released separately)
* Misleading pop() name changed to shift(), but old one still kept for
  compatibility

## Scramjet 2.2.1

* Asynchronous transforms now run in parallel, exact documentation on how to
  control it to follow
* Fixed a bug causing not raising exceptions properly

## Scramjet 2.1.1

* better docs and autogenerated readme

## Scramjet 2.1.0

* pop method now working consistently in Buffer and String Streams (pops a
  number of bytes instead of buffers/strings)
* breakup method introduced in BufferStream - breaks stream up into set length
  chunks.
* DataStream fromArray and toArray shorthand methods added.
* toBufferStream/toStringStream methods added on StringStream and BufferStream
* DataStream remap function added
* DataStream pop now operates on a copy of the original array.

## Scramjet 2.0.0

Initial release of the MIT licensed and stable version.

# Scramjet 1.x

With the release of 2.x the 1.x branch will no longer get support. The last
version in code is identical to 2.0.0 and future releases in the next major
will still be backwards compatible.

## Version 1.5.0

* Change MultiStream methods to work asynchronously (return Promise instead of
    the streams)
* Document MultiStream add/remove methods
* Enforce stricter jshint

## Version 1.4.2

* Improve tee and pop methods overriding
* Fix ```stream.end``` handling in ```reduce```

## Version 1.4.0

Interface changes:
* ```DataStream::reduceNow``` introduced to allow reducing into an object
  returned instantly.
* ```StringStream::pop``` implemented
* ```StringStream::separate``` and ```StringStream::slice``` prosposed

Added proper tests for ```DataStream``` and ```StringStream``` and travis.ci.

## Version 1.3.1

* Simplified stream transformations.
* Improved docs

## Version 1.3.0

Interface changes:
* ```DataStream::reduce``` now returns a Promise instead of the first object
  passed. The promise is resolved on end of input stream.
* ```StringStream::match``` added, returns a stream of matches in the passed
  regexp.
  * Added Gulp
    * Added Gulp task for docs creation (called docs).

Bugfixes:
* Fixed error in MultiStream.mux
* Fixed error in the flush method in split/match.
