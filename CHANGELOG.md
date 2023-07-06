# chernge lerg

## 7.0

This is a big one, please read carefully before upgrading from
prior versions, especially if you extend Minipass in a subclass.

### Breaking Changes

- Rewritten in TypeScript as hybrid esm/cjs build, so a lot of
  types changed in subtle ways, and several behaviors got
  stricter.
- Minipass now inherits from `EventEmitter` rather than `Stream`.
  Nothing from the `Stream` class was ever used by Minipass, but
  it inherited from `Stream` to pass checks in some stream
  libraries that checked `instanceof Stream`. Unfortunately, the
  type difference in the `pipe()` method signature made it
  challenging to continue doing in TypeScript.
- It is no longer possible to change the type of data emitted
  after a Minipass stream is instantiated, as this would thwart
  TypeScript's static checks. As a consequence:
  - The `setEncoding` method and the `encoding` setter are
    deprecated. Encoding may _only_ be set in the constructor
    options object.
  - `objectMode` is no longer inferred by writing something other
    than a string or Buffer. It may _only_ be set in the
    constructor options object.
- If all existing data consumers are removed, via
  `stream.unpipe(dest)`, `stream.removeListener('data', handler)`,
  `stream.removeAllListeners('data')`, and/or
  `stream.removeAllListeners()`, then the data will stop flowing.
  Note that it is still possible to explicitly discard a stream's
  data by calling `stream.resume()` in the absence of any
  consumers.

### Features and Fixes

- Removed a very subtle performance issue that made objectMode
  Minipass streams slower in some cases than node core streams.
  Minipass is now faster than node core streams for all data
  types.
- The array returned by `stream.collect()` for objectMode streams
  will have a `dataLength` property equal to 0, rather than
  undefined.
- `isStream` is moved from a static member on the Minipass class
  to a named export.
- `isWritable()` and `isReadable()` methods added.

## 6.0

- Define event argument types in an extensible manner, defaulting
  to `unknown[]` for event argument signatures if not declared.
- Drop support for old node versions

## 5.0

- No default export, only a named export

## 4.2

- add AbortSignal support
- allow falsey values to be emitted in `objectMode`

## 4.1

- hybrid module

## 4.0

- make `.buffer` and `.pipes` private

## 3.3

- add type definitions
- add `pipe(dest, { proxyErrors: true })`
- add `unpipe(dest)` method

## 3.2

- add `{async: true}` option for async opt-in
- `'readable'` event emitted immediately when listened for
- use regular array instead of yallist

## 3.1

- re-emit 'error' event if missed and new listener added
- handle missing `process` object
- extend Stream instead of EventEmitter

## 3.0

- update yallist, drop safe-buffer

## 2.9

- treat ArrayBuffers and TypedArrays the same as Buffers

## 2.8

- remove undocumented 'ended' getter
- support setting objectMode implicitly or explicitly
- add several getters to mirror API of node core streams better
- add stream.destroy()

## 2.7

- only emit 'readable' when data is buffered
- add MiniPass.isStream() static method

## 2.6

- don't pause when a dest.write() returns a non-boolean falsey
- do not auto-end if explicitly paused
- piping from an ended stream ends the dest
- do not remove all endish listeners on endish events
- add `promise()` method

## 2.5

- guard against emitting other events while emitting end
- add stream.concat() to collect into one chunk

## 2.4

- stream.end() returns this

## 2.3

- harden against missed 'end' events
- not allow 'end' events to happen more than once
- add sync and async iteration
- add stream.collect()

## 2.2

- use Buffer.from to avoid DEP005.
- remove drain listener when done piping to dest
- add support for `pipe(dest, { end: false })`
- throw on illegal encoding change

## 2.1

- don't allow changing encoding in problematic cases
- fast-path strings
- add objectMode

## 2.0

- emit 'resume' on resume()
- add bufferLength property
- remove the baroque streams getters

## 1.2

- add baroque streams getters

## 1.1

- communicate backpressure immediately, including drain on resume
- defend against internal resume() being overwritten
- emit 'drain' when read() clears the buffer
- make stream.flowing read-only
- return full buffer if read() with no args
- add support for setEncoding
- mark as readable and writable
- pipe() returns destination stream
- don't try to end() stderr and stdout when piping
- end(chunk, encoding, cb) support
