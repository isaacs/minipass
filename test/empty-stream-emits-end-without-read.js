const MP = require('../')
const t = require('tap')
t.test('empty end emits end without reading', t =>
  new MP().end().promise())
