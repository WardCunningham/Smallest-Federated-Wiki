util = require('../lib/util.coffee')
module.exports = describe 'util', ->
  it 'should make random bytes', ->
    a = util.randomByte()
    expect(a).to.be.a 'string'
    expect(a.length).to.be 2
