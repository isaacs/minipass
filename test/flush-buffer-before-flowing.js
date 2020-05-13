// this is a minimal reproduction of a pretty complex interaction between
// minipass-pipeline and a slow-draining proxy stream, which occurred in
// make-fetch-happen. https://github.com/npm/npm-registry-fetch/issues/23
// The pipeline in question was a wrapper that tee'd data into the cache,
// which is a slow-draining sink stream.  When multiple chunks come through,
// the Pipeline's buffer is holding a chunk, but the Pipeline itself is in
// flowing mode.  The solution is to always drain the buffer before emitting
// 'data', if there is other data waiting to be emitted.
const Minipass = require('../')
const t = require('tap')

const src = new Minipass({ encoding: 'utf8' })
const mid = new Minipass({ encoding: 'utf8' })
const proxy = new Minipass({ encoding: 'utf8' })
mid.write = function (chunk, encoding, cb) {
  Minipass.prototype.write.call(this, chunk, encoding, cb)
  return proxy.write(chunk, encoding, cb)
}
proxy.on('drain', chunk => mid.emit('drain'))
proxy.on('readable', () => setTimeout(() => proxy.read()))

const dest = new Minipass({ encoding: 'utf8' })
src.write('a')
src.write('b')

const pipeline = new (class Pipeline extends Minipass {
  constructor (opt) {
    super(opt)
    dest.on('data', c => super.write(c))
    dest.on('end', () => super.end())
  }
  emit (ev, ...args) {
    if (ev === 'resume')
      dest.resume()
    return super.emit(ev, ...args)
  }
})({ encoding: 'utf8'})

mid.pipe(dest)
src.pipe(mid)
t.test('get all data', t => pipeline.concat().then(d => t.equal(d, 'abcd')))
src.write('c')
src.write('d')
src.end()
