## Classes

<dl>
<dt><a href="#DataStream">DataStream</a> ⇐ <code>stream.PassThrough</code></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#Stops merging transform callbacks at the current place in the command chain.">Stops merging transform callbacks at the current place in the command chain.()</a></dt>
<dd></dd>
<dt><a href="#Reads a chunk from the stream and resolves the promise when read.">Reads a chunk from the stream and resolves the promise when read.()</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd></dd>
<dt><a href="#Writes a chunk to the stream and returns a Promise resolved when more chunks can be written.">Writes a chunk to the stream and returns a Promise resolved when more chunks can be written.()</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd></dd>
<dt><a href="#Allows resetting stream options.">Allows resetting stream options.(options)</a> ↩︎</dt>
<dd></dd>
<dt><a href="#toStringStream">toStringStream()</a></dt>
<dd><p>Alias for <a href="#DataStream+stringify">stringify</a></p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#StreamOptions">StreamOptions</a> : <code>Object</code></dt>
<dd><p>Standard options for scramjet streams.</p>
</dd>
<dt><a href="#TeeCallback">TeeCallback</a> : <code>function</code></dt>
<dd></dd>
<dt><a href="#ReduceCallback">ReduceCallback</a> ⇒ <code>Promise</code> | <code>*</code></dt>
<dd></dd>
<dt><a href="#MapCallback">MapCallback</a> ⇒ <code>Promise</code> | <code>*</code></dt>
<dd></dd>
<dt><a href="#FilterCallback">FilterCallback</a> ⇒ <code>Promise</code> | <code>Boolean</code></dt>
<dd></dd>
<dt><a href="#ShiftCallback">ShiftCallback</a> : <code>function</code></dt>
<dd><p>Shift callback</p>
</dd>
</dl>

<a name="DataStream"></a>

## DataStream ⇐ <code>stream.PassThrough</code>
**Kind**: global class  
**Extends:** <code>stream.PassThrough</code>  

* [DataStream](#DataStream) ⇐ <code>stream.PassThrough</code>
    * [new DataStream(opts)](#new_DataStream_new)
    * _instance_
        * [.use(func)](#DataStream+use) ⇒ <code>\*</code>
        * [.tee(func)](#DataStream+tee) ⇒ <code>[DataStream](#DataStream)</code>
        * [.reduce(func, into)](#DataStream+reduce) ⇒ <code>Promise</code>
        * [.each(func)](#DataStream+each) ↩︎
        * [.map(func, Clazz)](#DataStream+map) ⇒ <code>[DataStream](#DataStream)</code>
        * [.filter(func)](#DataStream+filter) ⇒ <code>[DataStream](#DataStream)</code>
        * [.toBufferStream(serializer)](#DataStream+toBufferStream) ⇒ <code>BufferStream</code>
        * [.stringify(serializer)](#DataStream+stringify) ⇒ <code>StringStream</code>
        * [.toArray(initial)](#DataStream+toArray) ⇒ <code>Promise</code>
    * _static_
        * [.fromArray(arr)](#DataStream.fromArray) ⇒ <code>[DataStream](#DataStream)</code>
        * [.fromIterator(iter)](#DataStream.fromIterator) ⇒ <code>[DataStream](#DataStream)</code>

<a name="new_DataStream_new"></a>

### new DataStream(opts)
Create the DataStream.


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>[StreamOptions](#StreamOptions)</code> | Stream options passed to superclass |

**Example**  
```js
[../samples/data-stream-constructor.js](../samples/data-stream-constructor.js)
```
<a name="DataStream+use"></a>

### dataStream.use(func) ⇒ <code>\*</code>
Calls the passed in place with the stream as first argument, returns result.

**Kind**: instance method of <code>[DataStream](#DataStream)</code>  
**Returns**: <code>\*</code> - anything the passed function returns  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>function</code> | if passed, the function will be called on self                         to add an option to inspect the stream in place,                         while not breaking the transform chain |

**Example**  
```js
[../samples/data-stream-use.js](../samples/data-stream-use.js)
```
<a name="DataStream+tee"></a>

### dataStream.tee(func) ⇒ <code>[DataStream](#DataStream)</code>
Duplicate the streamCreates a duplicate stream instance and pases it to the callback.

**Kind**: instance method of <code>[DataStream](#DataStream)</code>  
**Returns**: <code>[DataStream](#DataStream)</code> - self  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>[TeeCallback](#TeeCallback)</code> | The duplicate stream will be passed as first argument. |

**Example**  
```js
[../samples/data-stream-tee.js](../samples/data-stream-tee.js)
```
<a name="DataStream+reduce"></a>

### dataStream.reduce(func, into) ⇒ <code>Promise</code>
Reduces the stream into a given accumulatorWorks similarily to Array.prototype.reduce, so whatever you return in theformer operation will be the first operand to the latter.This method is serial - meaning that any processing on an entry willoccur only after the previous entry is fully processed. This does meanit's much slower than parallel functions.

**Kind**: instance method of <code>[DataStream](#DataStream)</code>  
**Returns**: <code>Promise</code> - Promise resolved by the last object returned by thecall of the transform function  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>TransformFunction</code> | The into object will be passed as the first argument, the data object from the stream as the second. |
| into | <code>Object</code> | Any object passed initally to the transform function |

**Example**  
```js
[../samples/data-stream-reduce.js](../samples/data-stream-reduce.js)
```
<a name="DataStream+each"></a>

### dataStream.each(func) ↩︎
Performs an operation on every chunk, without changing the streamThis is a shorthand for ```stream.on("data", func)```

**Kind**: instance method of <code>[DataStream](#DataStream)</code>  
**Chainable**  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>[MapCallback](#MapCallback)</code> | a callback called for each chunk. |

<a name="DataStream+map"></a>

### dataStream.map(func, Clazz) ⇒ <code>[DataStream](#DataStream)</code>
Transforms stream objects into new ones, just like Array.prototype.mapdoes.

**Kind**: instance method of <code>[DataStream](#DataStream)</code>  
**Returns**: <code>[DataStream](#DataStream)</code> - mapped stream  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>[MapCallback](#MapCallback)</code> | The function that creates the new object |
| Clazz | <code>Class</code> | (optional) The class to be mapped to. |

**Example**  
```js
[../samples/data-stream-map.js](../samples/data-stream-map.js)
```
<a name="DataStream+filter"></a>

### dataStream.filter(func) ⇒ <code>[DataStream](#DataStream)</code>
Filters object based on the function outcome, just likeArray.prototype.filter.

**Kind**: instance method of <code>[DataStream](#DataStream)</code>  
**Returns**: <code>[DataStream](#DataStream)</code> - filtered stream  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>[FilterCallback](#FilterCallback)</code> | The function that filters the object |

**Example**  
```js
[../samples/data-stream-filter.js](../samples/data-stream-filter.js)
```
<a name="DataStream+toBufferStream"></a>

### dataStream.toBufferStream(serializer) ⇒ <code>BufferStream</code>
Creates a BufferStream

**Kind**: instance method of <code>[DataStream](#DataStream)</code>  
**Returns**: <code>BufferStream</code> - the resulting stream  

| Param | Type | Description |
| --- | --- | --- |
| serializer | <code>[MapCallback](#MapCallback)</code> | A method that converts chunks to buffers |

**Example**  
```js
[../samples/data-stream-tobufferstream.js](../samples/data-stream-tobufferstream.js)
```
<a name="DataStream+stringify"></a>

### dataStream.stringify(serializer) ⇒ <code>StringStream</code>
Creates a StringStream

**Kind**: instance method of <code>[DataStream](#DataStream)</code>  
**Returns**: <code>StringStream</code> - the resulting stream  

| Param | Type | Description |
| --- | --- | --- |
| serializer | <code>[MapCallback](#MapCallback)</code> | A method that converts chunks to strings |

**Example**  
```js
[../samples/data-stream-tostringstream.js](../samples/data-stream-tostringstream.js)
```
<a name="DataStream+toArray"></a>

### dataStream.toArray(initial) ⇒ <code>Promise</code>
Aggregates the stream into a single ArrayIn fact it's just a shorthand for reducing the stream into an Array.

**Kind**: instance method of <code>[DataStream](#DataStream)</code>  
**Returns**: <code>Promise</code> - Promise resolved with the resulting array on stream                   end.  

| Param | Type | Description |
| --- | --- | --- |
| initial | <code>Array</code> | Optional array to begin with. |

<a name="DataStream.fromArray"></a>

### DataStream.fromArray(arr) ⇒ <code>[DataStream](#DataStream)</code>
Create a DataStream from an Array

**Kind**: static method of <code>[DataStream](#DataStream)</code>  
**Returns**: <code>[DataStream](#DataStream)</code> - the resulting stream  

| Param | Type | Description |
| --- | --- | --- |
| arr | <code>Array</code> | list of chunks |

**Example**  
```js
[../samples/data-stream-fromarray.js](../samples/data-stream-fromarray.js)
```
<a name="DataStream.fromIterator"></a>

### DataStream.fromIterator(iter) ⇒ <code>[DataStream](#DataStream)</code>
Create a DataStream from an IteratorDoesn't end the stream until it reaches end of the iterator.

**Kind**: static method of <code>[DataStream](#DataStream)</code>  
**Returns**: <code>[DataStream](#DataStream)</code> - the resulting stream  

| Param | Type | Description |
| --- | --- | --- |
| iter | <code>Iterator</code> | the iterator object |

**Example**  
```js
[../samples/data-stream-fromiterator.js](../samples/data-stream-fromiterator.js)
```
<a name="Stops merging transform callbacks at the current place in the command chain."></a>

## Stops merging transform callbacks at the current place in the command chain.()
**Kind**: global function  
**Example**  
```js
[../samples/data-stream-tap.js](../samples/data-stream-tap.js)
```
<a name="Reads a chunk from the stream and resolves the promise when read."></a>

## Reads a chunk from the stream and resolves the promise when read.() ⇒ <code>Promise.&lt;Object&gt;</code>
**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - the read item  
<a name="Writes a chunk to the stream and returns a Promise resolved when more chunks can be written."></a>

## Writes a chunk to the stream and returns a Promise resolved when more chunks can be written.() ⇒ <code>Promise.&lt;Object&gt;</code>
**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - the read item  
<a name="Allows resetting stream options."></a>

## Allows resetting stream options.(options) ↩︎
**Kind**: global function  
**Chainable**  

| Param | Type |
| --- | --- |
| options | <code>[StreamOptions](#StreamOptions)</code> | 

<a name="toStringStream"></a>

## toStringStream()
Alias for [stringify](#DataStream+stringify)

**Kind**: global function  
<a name="StreamOptions"></a>

## StreamOptions : <code>Object</code>
Standard options for scramjet streams.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| maxParallel | <code>Number</code> | the number of transforms done in parallel |
| referrer | <code>[DataStream](#DataStream)</code> | a referring stream to point to (if possible the transforms will be pushed to it                                 instead of creating a new stream) |

<a name="TeeCallback"></a>

## TeeCallback : <code>function</code>
**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| teed | <code>[DataStream](#DataStream)</code> | The teed stream |

<a name="ReduceCallback"></a>

## ReduceCallback ⇒ <code>Promise</code> &#124; <code>\*</code>
**Kind**: global typedef  
**Returns**: <code>Promise</code> &#124; <code>\*</code> - accumulator for the next pass  

| Param | Type | Description |
| --- | --- | --- |
| acc | <code>\*</code> | the accumulator - the object initially passed or retuned                by the previous reduce operation |
| chunk | <code>Object</code> | the stream chunk. |

<a name="MapCallback"></a>

## MapCallback ⇒ <code>Promise</code> &#124; <code>\*</code>
**Kind**: global typedef  
**Returns**: <code>Promise</code> &#124; <code>\*</code> - the mapped object  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>\*</code> | the chunk to be mapped |

<a name="FilterCallback"></a>

## FilterCallback ⇒ <code>Promise</code> &#124; <code>Boolean</code>
**Kind**: global typedef  
**Returns**: <code>Promise</code> &#124; <code>Boolean</code> - information if the object should remain in                            the filtered stream.  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>\*</code> | the chunk to be filtered or not |

<a name="ShiftCallback"></a>

## ShiftCallback : <code>function</code>
Shift callback

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| shifted | <code>Array.&lt;Object&gt;</code> | an array of shifted chunks |

