import { Minipass } from '../dist/mjs/index.js'
import t from 'tap'

t.test(`just make sure it's actually a stream`, async t => {
  t.type(Minipass, 'function')
  const m = new Minipass({ encoding: 'utf8' })
  m.write('hello ')
  m.end('world')
  t.equal(await m.concat(), 'hello world')
})
