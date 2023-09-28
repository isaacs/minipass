import t from 'tap'
import { Minipass } from '../src/index.js'

class FancyEnder extends Minipass {
  emit<Event extends keyof Minipass.Events<Buffer>>(
    ev: Event,
    ...args: Minipass.Events<Buffer>[Event]
  ): boolean {
    if (ev === 'end') this.emit('foo')
    return super.emit(ev, ...args)
  }
}

const mp = new FancyEnder()
let fooEmits = 0
mp.on('foo', () => fooEmits++)
mp.end('asdf')
mp.resume()
t.equal(fooEmits, 1, 'should only see one event emitted')
