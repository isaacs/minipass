// https://github.com/isaacs/minipass/issues/36
import t from 'tap'
import { Minipass } from '../src/index.js'

const m = new Minipass<string>({ encoding: 'utf8' })
m.write('hello')
t.equal(m.flowing, false)
let readableEmitted = false
m.on('readable', () => {
  readableEmitted = true
  m.on('data', c => t.equal(c, 'hello'))
})
t.equal(m.flowing, true)
t.equal(readableEmitted, true)
