[![Master Build Status](https://travis-ci.org/signicode/scramjet-core.svg?branch=master)](https://travis-ci.org/signicode/scramjet-core)
[![Develop Build Status](https://travis-ci.org/signicode/scramjet-core.svg?branch=develop)](https://travis-ci.org/signicode/scramjet-core)
[![Dependencies](https://david-dm.org/signicode/scramjet-core/status.svg)](https://david-dm.org/signicode/scramjet-core)
[![Dev Dependencies](https://david-dm.org/signicode/scramjet-core/dev-status.svg)](https://david-dm.org/signicode/scramjet-core?type=dev)
[![Known Vulnerabilities](https://snyk.io/test/github/signicode/scramjet-core/badge.svg)](https://snyk.io/test/github/signicode/scramjet-core)

Scramjet core
---------------

This is the minimal, dependency free version of [`scramjet`](https://github.com/signicode/scramjet) used as of Scramjet
version 3.0.0 as a base for `scramjet` and scramjet plugins.

Unless you are sure, you should be better off with using the main repo and module.

It is built upon the logic behind three well known javascript array operations - namingly map, filter and reduce. This
means that if you've ever performed operations on an Array in JavaScript - you already know Scramjet like the back of
your hand.

## Usage

Scramjet uses functional programming to run transformations on your data streams in a fashion very similar to the well
known event-stream node module. Most transformations are done by passing a transform function. You can write your
function in three ways:

1. Synchronous

 Example: a simple stream transform that outputs a stream of objects of the same id property and the length of the value string.

 ```javascript
    datastream.map(
        (item) => ({id: item.id, length: item.value.length})
    )
 ```

2. Asynchronous using ES2015 async await

Example: A simple stream that uses Fetch API to get all the contents of all entries in the stream

```javascript
datastream.map(
    async (item) => fetch(item)
)
```

3. Asynchronous using Promises

 Example: A simple stream that fetches an url mentioned in the incoming object

 ```javascript
    datastream.map(
        (item) => new Promise((resolve, reject) => {
            request(item.url, (err, res, data) => {
                if (err)
                    reject(err); // will emit an "error" event on the stream
                else
                    resolve(data);
            });
        })
    )
 ```

The actual logic of this transform function is as if you passed your function to the ```then``` method of a Promise
resolved with the data from the input stream.

## API Docs

Here's the list of the exposed classes and methods, please review the specific documentation for details:

* [```scramjet.DataStream```](docs/data-stream.md) - the base class for all scramjet classes.
* [```scramjet.BufferStream```](docs/buffer-stream.md) - a DataStream of Buffers.
* [```scramjet.StringStream```](docs/string-stream.md) - a DataStream of Strings.
* [```scramjet.MultiStream```](docs/multi-stream.md) - a DataStream of Strings.
* [```scramjet.plugin```](docs/index.md) - method for adding plugins, please see the docs
* [more on plugins](docs/plugins.md) - a description and link.

Note that:

* Most of the methods take a callback argument that operates on the stream items.
* The callback, unless it's stated otherwise, will receive an argument with the next chunk.
* If you want to perform your operations asynchronously, return a Promise, otherwise just return the right value.

The quick reference of the exposed classes:


<a name="DataStream"></a>
### DataStream ⇐ stream.PassThrough

DataStream is the primary stream type for Scramjet. When you parse your
stream, just pipe it you can then perform calculations on the data objects
streamed through your flow.

```javascript
 await (DataStream.fromArray([1,2,3,4,5]) // create a DataStream
     .map(readFile)                       // read some data asynchronously
     .map(sendToApi)                      // send the data somewhere
     .whenEnd());                         // wait until end
```

[Detailed DataStream docs here](docs/data-stream.md)

| Method | Description | Example
|--------|-------------|---------
| new DataStream(opts) | Create the DataStream. |  |
| dataStream.map(func, Clazz) ⇒ [<code>DataStream</code>](#DataStream) | Transforms stream objects into new ones, just like Array.prototype.map | [map example](../samples/data-stream-map.js) |
| dataStream.filter(func) ⇒ [<code>DataStream</code>](#DataStream) | Filters object based on the function outcome, just like | [filter example](../samples/data-stream-filter.js) |
| dataStream.reduce(func, into) ⇒ <code>Promise</code> | Reduces the stream into a given accumulator | [reduce example](../samples/data-stream-reduce.js) |
| dataStream.into(func, into) ⇒ [<code>DataStream</code>](#DataStream) | Pushes the data into another scramjet stream while keeping flow control and |  |
| dataStream.use(func) ⇒ <code>\*</code> | Calls the passed method in place with the stream as first argument, returns result. | [use example](../samples/data-stream-use.js) |
| dataStream.tee(func) ⇒ [<code>DataStream</code>](#DataStream) | Duplicate the stream | [tee example](../samples/data-stream-tee.js) |
| dataStream.each(func) ↩︎ | Performs an operation on every chunk, without changing the stream |  |
| dataStream.while(func) ⇒ [<code>DataStream</code>](#DataStream) | Reads the stream while the function outcome is truthy. |  |
| dataStream.until(func) ⇒ [<code>DataStream</code>](#DataStream) | Reads the stream until the function outcome is truthy. |  |
| dataStream.catch(callback) ↩︎ | Provides a way to catch errors in chained streams. |  |
| dataStream.raise(err) ⇒ <code>Promise</code> | Executes all error handlers and if none resolves, then emits an error. |  |
| dataStream.pipe(to, options) ⇒ <code>Writable</code> | Override of node.js Readable pipe. |  |
| dataStream.bufferify(serializer) ⇒ [<code>BufferStream</code>](#BufferStream) | Creates a BufferStream | [bufferify example](../samples/data-stream-tobufferstream.js) |
| dataStream.stringify(serializer) ⇒ [<code>StringStream</code>](#StringStream) | Creates a StringStream | [stringify example](../samples/data-stream-tostringstream.js) |
| dataStream.run() ⇒ <code>Promise</code> | Consumes all stream items without doing anything |  |
| dataStream.toArray(initial) ⇒ <code>Promise</code> | Aggregates the stream into a single Array |  |
| dataStream.toGenerator() ⇒ <code>Iterable.&lt;Promise.&lt;\*&gt;&gt;</code> | Returns an async generator |  |
| dataStream.tap() | Stops merging transform callbacks at the current place in the command chain. | [tap example](../samples/data-stream-tap.js) |
| dataStream.whenRead() ⇒ <code>Promise.&lt;Object&gt;</code> | Reads a chunk from the stream and resolves the promise when read. |  |
| dataStream.whenWrote(...data) ⇒ <code>Promise</code> | Writes a chunk to the stream and returns a Promise resolved when more chunks can be written. |  |
| dataStream.whenEnd() ⇒ <code>Promise</code> | Resolves when stream ends - rejects on uncaught error |  |
| dataStream.whenDrained() ⇒ <code>Promise</code> | Returns a promise that resolves when the stream is drained |  |
| dataStream.whenError() ⇒ <code>Promise</code> | Returns a promise that resolves (!) when the stream is errors |  |
| dataStream.setOptions(options) ↩︎ | Allows resetting stream options. |  |
| DataStream.fromArray(arr) ⇒ [<code>DataStream</code>](#DataStream) | Create a DataStream from an Array | [fromArray example](../samples/data-stream-fromarray.js) |
| DataStream.fromIterator(iter) ⇒ [<code>DataStream</code>](#DataStream) | Create a DataStream from an Iterator | [fromIterator example](../samples/data-stream-fromiterator.js) |


<a name="StringStream"></a>
### StringStream ⇐ DataStream

A stream of string objects for further transformation on top of DataStream.

[Detailed StringStream docs here](docs/string-stream.md)

| Method | Description | Example
|--------|-------------|---------
| new StringStream(encoding) | Constructs the stream with the given encoding |  |
| stringStream.shift(bytes, func) ⇒ [<code>StringStream</code>](#StringStream) | Shifts given length of chars from the original stream | [shift example](../samples/string-stream-shift.js) |
| stringStream.split(splitter) ⇒ [<code>StringStream</code>](#StringStream) | Splits the string stream by the specified regexp or string | [split example](../samples/string-stream-split.js) |
| stringStream.match(splitter) ⇒ [<code>StringStream</code>](#StringStream) | Finds matches in the string stream and streams the match results | [match example](../samples/string-stream-match.js) |
| stringStream.toBufferStream() ⇒ [<code>StringStream</code>](#StringStream) | Transforms the StringStream to BufferStream | [toBufferStream example](../samples/string-stream-tobufferstream.js) |
| stringStream.parse(parser) ⇒ [<code>DataStream</code>](#DataStream) | Parses every string to object | [parse example](../samples/string-stream-parse.js) |
| StringStream.SPLIT_LINE | A handly split by line regex to quickly get a line-by-line stream |  |
| StringStream.fromString(str, encoding) ⇒ [<code>StringStream</code>](#StringStream) | Creates a StringStream and writes a specific string. |  |


<a name="BufferStream"></a>
### BufferStream ⇐ DataStream

A factilitation stream created for easy splitting or parsing buffers.

Useful for working on built-in Node.js streams from files, parsing binary formats etc.

A simple use case would be:

```javascript
 fs.createReadStream('pixels.rgba')
     .pipe(new BufferStream)         // pipe a buffer stream into scramjet
     .breakup(4)                     // split into 4 byte fragments
     .parse(buf => [
         buf.readInt8(0),            // the output is a stream of R,G,B and Alpha
         buf.readInt8(1),            // values from 0-255 in an array.
         buf.readInt8(2),
         buf.readInt8(3)
     ]);
```

[Detailed BufferStream docs here](docs/buffer-stream.md)

| Method | Description | Example
|--------|-------------|---------
| new BufferStream(opts) | Creates the BufferStream |  |
| bufferStream.shift(chars, func) ⇒ [<code>BufferStream</code>](#BufferStream) | Shift given number of bytes from the original stream | [shift example](../samples/string-stream-shift.js) |
| bufferStream.split(splitter) ⇒ [<code>BufferStream</code>](#BufferStream) | Splits the buffer stream into buffer objects | [split example](../samples/buffer-stream-split.js) |
| bufferStream.breakup(number) ⇒ [<code>BufferStream</code>](#BufferStream) | Breaks up a stream apart into chunks of the specified length | [breakup example](../samples/buffer-stream-breakup.js) |
| bufferStream.stringify(encoding) ⇒ [<code>StringStream</code>](#StringStream) | Creates a string stream from the given buffer stream | [stringify example](../samples/buffer-stream-tostringstream.js) |
| bufferStream.parse(parser) ⇒ [<code>DataStream</code>](#DataStream) | Parses every buffer to object | [parse example](../samples/buffer-stream-parse.js) |


<a name="MultiStream"></a>
### MultiStream

An object consisting of multiple streams than can be refined or muxed.

[Detailed MultiStream docs here](docs/multi-stream.md)

| Method | Description | Example
|--------|-------------|---------
| new MultiStream(streams, options) | Crates an instance of MultiStream with the specified stream list |  |
| multiStream.streams : <code>Array</code> | Array of all streams |  |
| multiStream.length ⇒ <code>number</code> | Returns the current stream length |  |
| multiStream.map(aFunc) ⇒ [<code>MultiStream</code>](#MultiStream) | Returns new MultiStream with the streams returned by the tranform. | [map example](../samples/multi-stream-map.js) |
| multiStream.find(...args) ⇒ [<code>DataStream</code>](#DataStream) | Calls Array.prototype.find on the streams |  |
| multiStream.filter(func) ⇒ [<code>MultiStream</code>](#MultiStream) | Filters the stream list and returns a new MultiStream with only the | [filter example](../samples/multi-stream-filter.js) |
| multiStream.mux(cmp) ⇒ [<code>DataStream</code>](#DataStream) | Muxes the streams into a single one | [mux example](../samples/multi-stream-mux.js) |
| multiStream.add(stream) | Adds a stream to the MultiStream | [add example](../samples/multi-stream-add.js) |
| multiStream.remove(stream) | Removes a stream from the MultiStream | [remove example](../samples/multi-stream-remove.js) |



## CLI

Check out the command line interface for simplified scramjet usage with [scramjet-cli](https://www.npmjs.com/package/scramjet-cli)

    $ sjr -i http://datasource.org/file.csv ./transform-module-1 ./transform-module-1 | gzip > logs.gz

## License and contributions

As of version 2.0 Scramjet is MIT Licensed.

## Help wanted

The project need's your help! There's lots of work to do - transforming and muxing, joining and splitting, browserifying, modularizing, documenting and issuing those issues.

If you want to help and be part of the Scramjet team, please reach out to me, signicode on Github or email me: scramjet@signicode.com.
