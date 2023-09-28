import t from 'tap'
import { Minipass as MP } from '../src/index.js'

const mp = new MP()
const poop = new Error('poop')
mp.on('end', () => mp.emit('error', poop))
mp.end('foo')
t.test('promise catches error emitted on end', t =>
  t.rejects(mp.collect(), poop)
)
