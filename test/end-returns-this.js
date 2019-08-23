const t = require('tap')
const MP = require('../')
const mp = new MP()
t.equal(mp.end(), mp, 'end returns this')
