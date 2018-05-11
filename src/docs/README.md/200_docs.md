
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
* If you want to perform your operations asynchronously pass an *es6* `async` function
