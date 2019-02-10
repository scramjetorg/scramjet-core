![Scramjet Logo](https://signicode.com/scramjet-logo-light.svg)

<a name="DataStream"></a>

## DataStream : stream.PassThrough
DataStream is the primary stream type for Scramjet. When you parse your
stream, just pipe it you can then perform calculations on the data objects
streamed through your flow.

Use as:

```javascript
const { DataStream } = require('scramjet');

await (DataStream.from(aStream) // create a DataStream
    .map(findInFiles)           // read some data asynchronously
    .map(sendToAPI)             // send the data somewhere
    .run());                    // wait until end
```

**Kind**: global class  
**Extends**: <code>stream.PassThrough</code>  

* [DataStream](#DataStream)  <code>stream.PassThrough</code>
    * [new DataStream(opts)](#new_DataStream_new)
    * [dataStream.map(func, ClassType)](#DataStream+map) ↺
    * [dataStream.filter(func)](#DataStream+filter) ↺
    * [dataStream.reduce(func, into)](#DataStream+reduce)
    * [dataStream.do(func)](#DataStream+do) ↺
    * [dataStream.all(functions)](#DataStream+all) ↺
    * [dataStream.race(functions)](#DataStream+race) ↺
    * [dataStream.unorder(func)](#DataStream+unorder)
    * [dataStream.into(func, into)](#DataStream+into) ↺
    * [dataStream.use(func)](#DataStream+use) ↺
    * [dataStream.run()](#DataStream+run)
    * [dataStream.tap()](#DataStream+tap)
    * [dataStream.whenRead()](#DataStream+whenRead)
    * [dataStream.whenWrote(chunk, [...more])](#DataStream+whenWrote)
    * [dataStream.whenEnd()](#DataStream+whenEnd)
    * [dataStream.whenDrained()](#DataStream+whenDrained)
    * [dataStream.whenError()](#DataStream+whenError)
    * [dataStream.setOptions(options)](#DataStream+setOptions) ↺
    * [dataStream.tee(func)](#DataStream+tee) ↺
    * [dataStream.each(func)](#DataStream+each) ↺
    * [dataStream.while(func)](#DataStream+while) ↺
    * [dataStream.until(func)](#DataStream+until) ↺
    * [dataStream.catch(callback)](#DataStream+catch) ↺
    * [dataStream.raise(err)](#DataStream+raise)
    * [dataStream.pipe(to, options)](#DataStream+pipe) ↺ <code>Writable</code>
    * [dataStream.bufferify(serializer)](#DataStream+bufferify) ↺ <code>BufferStream</code>
    * [dataStream.stringify(serializer)](#DataStream+stringify) ↺ <code>StringStream</code>
    * [dataStream.toArray(initial)](#DataStream+toArray) ⇄ <code>Array</code>
    * [dataStream.toGenerator()](#DataStream+toGenerator)  <code>Iterable.&lt;Promise.&lt;\*&gt;&gt;</code>
    * [dataStream.toBufferStream(serializer)](#DataStream+toBufferStream) ↺ <code>BufferStream</code>
    * [dataStream.toStringStream(serializer)](#DataStream+toStringStream) ↺ <code>StringStream</code>
    * [DataStream:from(input, options)](#DataStream.from)  [<code>DataStream</code>](#DataStream)
    * [DataStream:pipeline(readable, ...transforms)](#DataStream.pipeline)  [<code>DataStream</code>](#DataStream)
    * [DataStream:fromArray(array, options)](#DataStream.fromArray)  [<code>DataStream</code>](#DataStream)
    * [DataStream:fromIterator(iterator, options)](#DataStream.fromIterator)  [<code>DataStream</code>](#DataStream)
    * [DataStream:MapCallback](#DataStream.MapCallback)  <code>Promise</code> \| <code>\*</code>
    * [DataStream:FilterCallback](#DataStream.FilterCallback)  <code>Promise</code> \| <code>Boolean</code>
    * [DataStream:ReduceCallback](#DataStream.ReduceCallback)  <code>Promise</code> \| <code>\*</code>
    * [DataStream:DoCallback](#DataStream.DoCallback) ⇄ <code>function</code>
    * [DataStream:IntoCallback](#DataStream.IntoCallback) ⇄ <code>\*</code>
    * [DataStream:TeeCallback](#DataStream.TeeCallback)  <code>function</code>

<a name="new_DataStream_new"></a>

### new DataStream(opts)
Create the DataStream.


| Param | Type | Description |
| --- | --- | --- |
| opts | [<code>StreamOptions</code>](#StreamOptions) | Stream options passed to superclass |

<a name="DataStream+map"></a>

### dataStream.map(func, ClassType) ↺
Transforms stream objects into new ones, just like Array.prototype.map
does.

Map takes an argument which is the Function function operating on every element
of the stream. If the function returns a Promise or is an AsyncFunction then the
stream will await for the outcome of the operation before pushing the data forwards.

A simple example that turns stream of urls into stream of responses

```javascript
stream.map(async url => fetch(url));
```

Multiple subsequent map operations (as well as filter, do, each and other simple ops)
will be merged together into a single operation to improve performance. Such behaviour
can be suppressed by chaining `.tap()` after `.map()`.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Test**: test/methods/data-stream-map.js  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>MapCallback</code> | The function that creates the new object |
| ClassType | <code>Class</code> | (optional) The class to be mapped to. |

<a name="DataStream+filter"></a>

### dataStream.filter(func) ↺
Filters object based on the function outcome, just like Array.prototype.filter.

Filter takes a Function argument which should be a Function or an AsyncFunction that
will be called on each stream item. If the outcome of the operation is `falsy` (`0`, `''`,
`false`, `null` or `undefined`) the item will be filtered from subsequent operations
and will not be pushed to the output of the stream. Otherwise the item will not be affected.

A simple example that filters out non-2xx responses from a stream

```javascript
stream.filter(({statusCode}) => !(statusCode >= 200 && statusCode < 300));
```

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Test**: test/methods/data-stream-filter.js  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>FilterCallback</code> | The function that filters the object |

<a name="DataStream+reduce"></a>

### dataStream.reduce(func, into) ⇄
Reduces the stream into a given accumulator

Works similarly to Array.prototype.reduce, so whatever you return in the
former operation will be the first operand to the latter. The result is a
promise that's resolved with the return value of the last transform executed.

A simple example that sums values from a stream

```javascript
stream.reduce((accumulator, {value}) => accumulator + value);
```

This method is serial - meaning that any processing on an entry will
occur only after the previous entry is fully processed. This does mean
it's much slower than parallel functions.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Test**: test/methods/data-stream-reduce.js  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>ReduceCallback</code> | The into object will be passed as the  first argument, the data object from the stream as the second. |
| into | <code>Object</code> | Any object passed initially to the transform function |

<a name="DataStream+do"></a>

### dataStream.do(func) ↺
Perform an asynchronous operation without changing or resuming the stream.

In essence the stream will use the call to keep the backpressure, but the resolving value
has no impact on the streamed data (except for possible mutation of the chunk itself)

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>DoCallback</code> | the async function |

<a name="DataStream+all"></a>

### dataStream.all(functions) ↺
Processes a number of functions in parallel, returns a stream of arrays of results.

This method is to allow running multiple asynchronous operations and receive all the
results at one, just like Promise.all behaves.

Keep in mind that if one of your methods rejects, this behaves just like Promise.all
you won't be able to receive partial results.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Test**: test/methods/data-stream-all.js  

| Param | Type | Description |
| --- | --- | --- |
| functions | <code>Array.&lt;function()&gt;</code> | list of async functions to run |

<a name="DataStream+race"></a>

### dataStream.race(functions) ↺
Processes a number of functions in parallel, returns the first resolved.

This method is to allow running multiple asynchronous operations awaiting just the
result of the quickest to execute, just like Promise.race behaves.

Keep in mind that if one of your methods it will only raise an error if that was
the first method to reject.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Test**: test/methods/data-stream-race.js  

| Param | Type | Description |
| --- | --- | --- |
| functions | <code>Array.&lt;function()&gt;</code> | list of async functions to run |

<a name="DataStream+unorder"></a>

### dataStream.unorder(func)
Allows processing items without keeping order

This method useful if you are not concerned about the order in which the
chunks are being pushed out of the operation. The `maxParallel` option is
still used for keeping a number of simultaneous number of parallel operations
that are currently happening.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>MapCallback</code> | the async function that will be unordered |

<a name="DataStream+into"></a>

### dataStream.into(func, into) ↺
Allows own implementation of stream chaining.

The async Function is called on every chunk and should implement writes in it's own way. The
resolution will be awaited for flow control. The passed `into` argument is passed as the first
argument to every call.

It returns the DataStream passed as the second argument.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Test**: test/methods/data-stream-into.js  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>IntoCallback</code> | the method that processes incoming chunks |
| into | [<code>DataStream</code>](#DataStream) | the DataStream derived class |

<a name="DataStream+use"></a>

### dataStream.use(func) ↺
Calls the passed method in place with the stream as first argument, returns result.

The main intention of this method is to run scramjet modules - transforms that allow complex transforms of
streams. These modules can also be run with [scramjet-cli](https://github.com/signicode/scramjet-cli) directly
from the command line.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Test**: test/methods/data-stream-use.js  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>AsyncGeneratorFunction</code> \| <code>GeneratorFunction</code> \| <code>AsyncFunction</code> \| <code>function</code> \| <code>String</code> \| <code>Readable</code> | if passed, the function will be called on self to add an option to inspect the stream in place, while not breaking the transform chain. Alternatively this can be a relative path to a scramjet-module. Lastly it can be a Transform stream. |
| [...parameters] | <code>\*</code> | any additional parameters top be passed to the module |

<a name="DataStream+run"></a>

### dataStream.run() ⇄
Consumes all stream items doing nothing. Resolves when the stream is ended.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+tap"></a>

### dataStream.tap()
Stops merging transform Functions at the current place in the command chain.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Test**: test/methods/data-stream-tap.js  
<a name="DataStream+whenRead"></a>

### dataStream.whenRead() ⇄
Reads a chunk from the stream and resolves the promise when read.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+whenWrote"></a>

### dataStream.whenWrote(chunk, [...more]) ⇄
Writes a chunk to the stream and returns a Promise resolved when more chunks can be written.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>\*</code> | a chunk to write |
| [...more] | <code>\*</code> | more chunks to write |

<a name="DataStream+whenEnd"></a>

### dataStream.whenEnd() ⇄
Resolves when stream ends - rejects on uncaught error

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+whenDrained"></a>

### dataStream.whenDrained() ⇄
Returns a promise that resolves when the stream is drained

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+whenError"></a>

### dataStream.whenError() ⇄
Returns a promise that resolves (!) when the stream is errors

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+setOptions"></a>

### dataStream.setOptions(options) ↺
Allows resetting stream options.

It's much easier to use this in chain than constructing new stream:

```javascript
    stream.map(myMapper).filter(myFilter).setOptions({maxParallel: 2})
```

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Meta.conditions**: keep-order,chain  

| Param | Type |
| --- | --- |
| options | [<code>StreamOptions</code>](#StreamOptions) | 

<a name="DataStream+tee"></a>

### dataStream.tee(func) ↺
Duplicate the stream

Creates a duplicate stream instance and passes it to the Function.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Test**: test/methods/data-stream-tee.js  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>TeeCallback</code> \| <code>Writable</code> | The duplicate stream will be passed as first argument. |

<a name="DataStream+each"></a>

### dataStream.each(func) ↺
Performs an operation on every chunk, without changing the stream

This is a shorthand for ```stream.on("data", func)``` but with flow control.
Warning: this resumes the stream!

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>MapCallback</code> | a Function called for each chunk. |

<a name="DataStream+while"></a>

### dataStream.while(func) ↺
Reads the stream while the function outcome is truthy.

Stops reading and emits end as soon as it finds the first chunk that evaluates
to false. If you're processing a file until a certain point or you just need to
confirm existence of some data, you can use it to end the stream before reaching end.

Keep in mind that whatever you piped to the stream will still need to be handled.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Test**: test/methods/data-stream-while.js  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>FilterCallback</code> | The condition check |

<a name="DataStream+until"></a>

### dataStream.until(func) ↺
Reads the stream until the function outcome is truthy.

Works opposite of while.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Test**: test/methods/data-stream-until.js  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>FilterCallback</code> | The condition check |

<a name="DataStream+catch"></a>

### dataStream.catch(callback) ↺
Provides a way to catch errors in chained streams.

The handler will be called as asynchronous
 - if it resolves then the error will be muted.
 - if it rejects then the error will be passed to the next handler

If no handlers will resolve the error, an `error` event will be emitted

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Test**: test/methods/data-stream-catch.js  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | Error handler (async function) |

<a name="DataStream+raise"></a>

### dataStream.raise(err) ⇄
Executes all error handlers and if none resolves, then emits an error.

The returned promise will always be resolved even if there are no successful handlers.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Test**: test/methods/data-stream-raise.js  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>Error</code> | The thrown error |

<a name="DataStream+pipe"></a>

### dataStream.pipe(to, options) : Writable ↺
Override of node.js Readable pipe.

Except for calling overridden method it proxies errors to piped stream.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Returns**: <code>Writable</code> - the `to` stream  

| Param | Type | Description |
| --- | --- | --- |
| to | <code>Writable</code> | Writable stream to write to |
| options | <code>WritableOptions</code> |  |

<a name="DataStream+bufferify"></a>

### dataStream.bufferify(serializer) : BufferStream ↺
Creates a BufferStream.

The passed serializer must return a buffer.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Returns**: <code>BufferStream</code> - the resulting stream  
**Meta.noreadme**:   
**Test**: test/methods/data-stream-tobufferstream.js  

| Param | Type | Description |
| --- | --- | --- |
| serializer | <code>MapCallback</code> | A method that converts chunks to buffers |

<a name="DataStream+stringify"></a>

### dataStream.stringify(serializer) : StringStream ↺
Creates a StringStream.

The passed serializer must return a string.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Returns**: <code>StringStream</code> - the resulting stream  
**Test**: test/methods/data-stream-tostringstream.js  

| Param | Type | Description |
| --- | --- | --- |
| serializer | <code>MapCallback</code> | A method that converts chunks to strings |

<a name="DataStream+toArray"></a>

### dataStream.toArray(initial) : Array ⇄
Aggregates the stream into a single Array

In fact it's just a shorthand for reducing the stream into an Array.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  

| Param | Type | Description |
| --- | --- | --- |
| initial | <code>Array</code> | Optional array to begin with. |

<a name="DataStream+toGenerator"></a>

### dataStream.toGenerator() : Iterable.<Promise.<*>>
Returns an async generator

Ready for https://github.com/tc39/proposal-async-iteration

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>Iterable.&lt;Promise.&lt;\*&gt;&gt;</code> - Returns an iterator that returns a promise for each item.  
<a name="DataStream+toBufferStream"></a>

### dataStream.toBufferStream(serializer) : BufferStream ↺
Creates a BufferStream.

The passed serializer must return a buffer.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Returns**: <code>BufferStream</code> - the resulting stream  
**Meta.noreadme**:   
**Test**: test/methods/data-stream-tobufferstream.js  

| Param | Type | Description |
| --- | --- | --- |
| serializer | <code>MapCallback</code> | A method that converts chunks to buffers |

<a name="DataStream+toStringStream"></a>

### dataStream.toStringStream(serializer) : StringStream ↺
Creates a StringStream.

The passed serializer must return a string.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Returns**: <code>StringStream</code> - the resulting stream  
**Test**: test/methods/data-stream-tostringstream.js  

| Param | Type | Description |
| --- | --- | --- |
| serializer | <code>MapCallback</code> | A method that converts chunks to strings |

<a name="DataStream.from"></a>

### DataStream:from(input, options) : DataStream
Returns a DataStream from pretty much anything sensibly possible.

Depending on type:
* `self` will return self immediately
* `Readable` stream will get piped to the current stream with errors forwarded
* `Array` will get iterated and all items will be pushed to the returned stream.
  The stream will also be ended in such case.
* `GeneratorFunction` will get executed to return the iterator which will be used as source for items
* `AsyncGeneratorFunction` will also work as above (including generators) in node v10.
* `Iterable`s iterator will be used as a source for streams

You can also pass a `Function` or `AsyncFunction` that will be executed and it's outcome will be
passed again to `from` and piped to the initially returned stream. Any additional arguments will be
passed as arguments to the function.

If a `String` is passed, scramjet will attempt to resolve it as a module and use the outcome
as an argument to `from` as in the Function case described above. For more information see [modules.md](modules.md)

A simple example from a generator:

```javascript
DataStream
  .from(function* () {
     while(x < 100) yield x++;
  })
  .each(console.log)
  // 0
  // 1...
  // 99
```

**Kind**: static method of [<code>DataStream</code>](#DataStream)  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>Array</code> \| <code>Iterable</code> \| <code>AsyncGeneratorFunction</code> \| <code>GeneratorFunction</code> \| <code>AsyncFunction</code> \| <code>function</code> \| <code>String</code> \| <code>Readable</code> | argument to be turned into new stream |
| options | [<code>StreamOptions</code>](#StreamOptions) \| <code>Writable</code> |  |

<a name="DataStream.pipeline"></a>

### DataStream:pipeline(readable, ...transforms) : DataStream
Creates a pipeline of streams and returns a scramjet stream.

This is similar to node.js stream pipeline method, but also takes scramjet modules
as possibilities in an array of transforms. It may be used to run a series of non-scramjet
transform streams.

The first argument is anything streamable and will be sanitized by [DataStream..from](DataStream..from).

Each following argument will be understood as a transform and can be any of:
* AsyncFunction or Function - will be executed by [DataStream..use](DataStream..use)
* A transform stream that will be piped to the preceding stream

**Kind**: static method of [<code>DataStream</code>](#DataStream)  
**Returns**: [<code>DataStream</code>](#DataStream) - a new DataStream instance of the resulting pipeline  

| Param | Type | Description |
| --- | --- | --- |
| readable | <code>Array</code> \| <code>Iterable</code> \| <code>AsyncGeneratorFunction</code> \| <code>GeneratorFunction</code> \| <code>AsyncFunction</code> \| <code>function</code> \| <code>String</code> \| <code>Readable</code> | the initial readable argument that is streamable by scramjet.from |
| ...transforms | <code>AsyncFunction</code> \| <code>function</code> \| <code>Transform</code> | Transform functions (as in [DataStream..use](DataStream..use)) or Transform streams (any number of these as consecutive arguments) |

<a name="DataStream.fromArray"></a>

### DataStream:fromArray(array, options) : DataStream
Create a DataStream from an Array

**Kind**: static method of [<code>DataStream</code>](#DataStream)  
**Test**: test/methods/data-stream-fromarray.js  

| Param | Type | Description |
| --- | --- | --- |
| array | <code>Array</code> | list of chunks |
| options | <code>ScramjetOptions</code> | the read stream options |

<a name="DataStream.fromIterator"></a>

### DataStream:fromIterator(iterator, options) : DataStream
Create a DataStream from an Iterator

Doesn't end the stream until it reaches end of the iterator.

**Kind**: static method of [<code>DataStream</code>](#DataStream)  
**Test**: test/methods/data-stream-fromiterator.js  

| Param | Type | Description |
| --- | --- | --- |
| iterator | <code>Iterator</code> | the iterator object |
| options | <code>ScramjetOptions</code> | the read stream options |

<a name="DataStream.MapCallback"></a>

### DataStream:MapCallback : Promise | *
**Kind**: static typedef of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>Promise</code> \| <code>\*</code> - the mapped object  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>\*</code> | the chunk to be mapped |

<a name="DataStream.FilterCallback"></a>

### DataStream:FilterCallback : Promise | Boolean
**Kind**: static typedef of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>Promise</code> \| <code>Boolean</code> - information if the object should remain in
                            the filtered stream.  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>\*</code> | the chunk to be filtered or not |

<a name="DataStream.ReduceCallback"></a>

### DataStream:ReduceCallback : Promise | *
**Kind**: static typedef of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>Promise</code> \| <code>\*</code> - accumulator for the next pass  

| Param | Type | Description |
| --- | --- | --- |
| accumulator | <code>\*</code> | the accumulator - the object initially passed or returned                by the previous reduce operation |
| chunk | <code>Object</code> | the stream chunk. |

<a name="DataStream.DoCallback"></a>

### DataStream:DoCallback : function ⇄
**Kind**: static typedef of [<code>DataStream</code>](#DataStream)  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>Object</code> | source stream chunk |

<a name="DataStream.IntoCallback"></a>

### DataStream:IntoCallback : * ⇄
**Kind**: static typedef of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - resolution for the old stream (for flow control only)  

| Param | Type | Description |
| --- | --- | --- |
| into | <code>\*</code> | stream passed to the into method |
| chunk | <code>Object</code> | source stream chunk |

<a name="DataStream.TeeCallback"></a>

### DataStream:TeeCallback : function
**Kind**: static typedef of [<code>DataStream</code>](#DataStream)  

| Param | Type | Description |
| --- | --- | --- |
| teed | [<code>DataStream</code>](#DataStream) | The teed stream |

<a name="StreamOptions"></a>

## StreamOptions : Object
Standard options for scramjet streams.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| maxParallel | <code>Number</code> | the number of transforms done in parallel |
| referrer | [<code>DataStream</code>](#DataStream) | a referring stream to point to (if possible the transforms will be pushed to it                                 instead of creating a new stream) |

