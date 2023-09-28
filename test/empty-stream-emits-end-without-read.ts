import t from 'tap'
import { Minipass as MP } from '../src/index.js'
t.test('empty end emits end without reading', () =>
  new MP().end().promise()
)
