// Reproduces an issue where write is called while the stream is flowing but a
// destination cannot accept all of the buffered chunks.  minipass should add
// the chunk to the end of the buffer instead of emitting it before the buffer
// is cleared.
//
// This caused issues when piping make-fetch-happen stream to tar.extract
// https://github.com/npm/cli/issues/3884
const Minipass = require('../')
const t = require('tap')

class Pauser extends Minipass {
  write (chunk, encoding, callback) {
    super.write(chunk, encoding, callback)
    return false
  }
}

const src = new Minipass({encoding: 'utf8'})
const pauser = new Pauser({encoding: 'utf8'})

// queue up two chunks while the src is buffering
src.write('1')
src.write('2')

// when the src starts flowing write a third chunk
src.once('resume', () => src.write('3'))

// pipe the src to the pauser which will request the src stops after the first
// chunk.
src.pipe(pauser)

src.end()

// we should expect the chunks in the original order.
t.resolveMatch(pauser.collect(), ['1', '2', '3'], '123')
