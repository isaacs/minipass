import t from 'tap'
import { Minipass } from '../src/index.js'

const dest = new Minipass<string>({ encoding: 'utf8' })
const dest2 = new Minipass<string>({ encoding: 'utf8' })
const destOut: string[] = []
const dest2Out: string[] = []
const srcOut: string[] = []

const src = new Minipass<string>({
  encoding: 'utf8',
  //@ts-expect-error
  debugExposePipes: true,
}) as Minipass<string>

src.pipe(dest)
src.pipe(dest2)

dest.on('data', c => destOut.push(c))
dest2.on('data', c => dest2Out.push(c))
src.on('data', c => srcOut.push(c))

src.write('hello')
t.strictSame(destOut, ['hello'])
t.strictSame(dest2Out, ['hello'])
t.strictSame(srcOut, ['hello'])

//@ts-expect-error
t.match(src.pipes, [{ dest }, { dest: dest2 }])

src.unpipe(dest)

//@ts-expect-error
t.match(src.pipes, [{ dest: dest2 }])

src.unpipe(dest) // no-op
//@ts-expect-error
t.match(src.pipes, [{ dest: dest2 }])

src.write('world')
t.strictSame(destOut, ['hello'])
t.strictSame(dest2Out, ['hello', 'world'])
t.strictSame(srcOut, ['hello', 'world'])

src.end()
t.equal(dest.emittedEnd, false)
t.equal(src.emittedEnd, true)
t.equal(dest2.emittedEnd, true)
