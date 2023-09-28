import t from 'tap'
import { Minipass as MP, isStream, isReadable, isWritable } from '../src/index.js'
import Stream from 'stream'
import EE from 'events'

t.equal(MP.isStream, isStream, 'old export location is same function')

t.equal(isStream(new MP()), true, 'a MiniPass is a stream')
t.equal(isReadable(new MP()), true, 'a MiniPass is a readable')
t.equal(isWritable(new MP()), true, 'a MiniPass is a writable')

t.equal(isStream(new Stream()), true, 'a Stream is a stream')
t.equal(isReadable(new Stream()), true, 'a Stream is a readable')
t.equal(isWritable(new Stream()), false, 'a Stream is not a writable')

const w = new EE() as EE & { write(): any, end(): any }
w.write = () => {}
w.end = () => {}
t.equal(isStream(w), true, 'EE with write() and end() is a stream')
t.equal(isWritable(w), true, 'EE with write() and end() is a writable')
t.equal(
  isReadable(w),
  false,
  'EE with write() and end() is not a readable'
)

const r = new EE() as EE & { pipe(): any }
r.pipe = () => {}
t.equal(isStream(r), true, 'EE with pipe() is a stream')
t.equal(isWritable(r), false, 'EE with pipe() is not a writable')
t.equal(isReadable(r), true, 'EE with pipe() is a readable')

t.equal(
  isStream(new Stream.Readable()),
  true,
  'Stream.Readable() is a stream'
)
t.equal(
  isReadable(new Stream.Readable()),
  true,
  'Stream.Readable() is a readable'
)
t.equal(
  isWritable(new Stream.Readable()),
  false,
  'Stream.Readable() is not a writable'
)

t.equal(
  isStream(new Stream.Writable()),
  true,
  'Stream.Writable() is a stream'
)
t.equal(
  isWritable(new Stream.Writable()),
  true,
  'Stream.Writable() is a writable'
)
t.equal(
  isReadable(new Stream.Writable()),
  false,
  'Stream.Writable() is not a readable'
)

t.equal(isStream(new Stream.Duplex()), true, 'Stream.Duplex() is a stream')
t.equal(
  isReadable(new Stream.Duplex()),
  true,
  'Stream.Duplex() is a readable'
)
t.equal(
  isWritable(new Stream.Duplex()),
  true,
  'Stream.Duplex() is a writable'
)

t.equal(
  isStream(new Stream.Transform()),
  true,
  'Stream.Transform() is a stream'
)
t.equal(
  isReadable(new Stream.Transform()),
  true,
  'Stream.Transform() is a readable'
)
t.equal(
  isWritable(new Stream.Transform()),
  true,
  'Stream.Transform() is a writable'
)

t.equal(
  isStream(new Stream.PassThrough()),
  true,
  'Stream.PassThrough() is a stream'
)
t.equal(
  isReadable(new Stream.PassThrough()),
  true,
  'Stream.PassThrough() is a readable'
)
t.equal(
  isWritable(new Stream.PassThrough()),
  true,
  'Stream.PassThrough() is a writable'
)

t.equal(
  isStream(new (class extends MP {})()),
  true,
  'extends MP is a stream'
)
t.equal(
  isReadable(new (class extends MP {})()),
  true,
  'extends MP is a readable'
)
t.equal(
  isWritable(new (class extends MP {})()),
  true,
  'extends MP is a writable'
)

t.equal(
  isStream(new EE()),
  false,
  'EE without streaminess is not a stream'
)
t.equal(
  isReadable(new EE()),
  false,
  'EE without streaminess is not a readable'
)
t.equal(
  isWritable(new EE()),
  false,
  'EE without streaminess is not a writable'
)

const ns = {
  write() {},
  end() {},
  pipe() {},
}
t.equal(isStream(ns), false, 'non-EE is not a stream')
t.equal(isReadable(ns), false, 'non-EE is not a readable')
t.equal(isWritable(ns), false, 'non-EE is not a writable')

t.equal(isStream('hello'), false, 'string is not a stream')
t.equal(isReadable('hello'), false, 'string is not a readable')
t.equal(isWritable('hello'), false, 'string is not a writable')

t.equal(isStream(99), false, 'number is not a stream')
t.equal(isReadable(99), false, 'number is not a readable')
t.equal(isReadable(99), false, 'number is not a writable')

t.equal(
  isStream(() => {}),
  false,
  'function is not a stream'
)
t.equal(
  isReadable(() => {}),
  false,
  'function is not a readable'
)
t.equal(
  isWritable(() => {}),
  false,
  'function is not a writable'
)

t.equal(isStream(null), false, 'null is not a stream')
t.equal(isReadable(null), false, 'null is not a readable')
t.equal(isWritable(null), false, 'null is not a writable')
