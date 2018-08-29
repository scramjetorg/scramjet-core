
# Scramjet core

## Scramjet Core 4.16.6

This is the last intended minor API change to `scramjet-core` before the v5 series.

* Async iterator and async generators fix of `DataStream.from` in node 10
* Fixed bug causing "out of sequence" errors on a number of raised and handled errors.
* Added `DataStream..do` method for simple operations without affecting the stream, but keeping backpressure.
* Modified `DataStream.from` static method to accept pretty much any sensible input
* Error handling rethrow fixes. `cause` now carries the error that actually spawned the issue.
* Fix `DataStream.from` operation in derived classes, now return the same class of stream as context of the call.

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
