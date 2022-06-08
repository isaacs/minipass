const t = require('tap')
const Minipass = require('../')

const src = new Minipass({ encoding: 'utf8' })
const dest = new Minipass({ encoding: 'utf8' })
const dest2 = new Minipass({ encoding: 'utf8' })
const destOut = []
const dest2Out = []
const srcOut = []

src.pipe(dest)
src.pipe(dest2)

dest.on('data', c => destOut.push(c))
dest2.on('data', c => dest2Out.push(c))
src.on('data', c => srcOut.push(c))

src.write('hello')
t.strictSame(destOut, ['hello'])
t.strictSame(dest2Out, ['hello'])
t.strictSame(srcOut, ['hello'])

t.match(src.pipes, [
  { dest },
  { dest: dest2 },
])

src.unpipe(dest)

t.match(src.pipes, [
  { dest: dest2 },
])

src.unpipe(dest) // no-op
t.match(src.pipes, [
  { dest: dest2 },
])


src.write('world')
t.strictSame(destOut, ['hello'])
t.strictSame(dest2Out, ['hello', 'world'])
t.strictSame(srcOut, ['hello', 'world'])

src.end()
t.equal(dest.emittedEnd, false)
t.equal(src.emittedEnd, true)
t.equal(dest2.emittedEnd, true)
