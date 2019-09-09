const Minipass = require('../')
const t = require('tap')

class FancyEnder extends Minipass {
  emit (ev, ...data) {
    if (ev === 'end')
      this.emit('foo')
    return super.emit(ev, ...data)
  }
}

const mp = new FancyEnder()
let fooEmits = 0
mp.on('foo', () => fooEmits++)
mp.end('asdf')
mp.resume()
t.equal(fooEmits, 1, 'should only see one event emitted')
