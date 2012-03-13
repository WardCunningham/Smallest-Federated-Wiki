defaultargs = require '../lib/defaultargs'

describe 'defaultargs', ->
  describe '#defaultargs()', ->
    it 'should not write over give args', ->
      defaultargs({p: 1234}).p.should.equal(1234)
    it 'should write non give args', ->
      defaultargs().p.should.equal(3000)
    it 'should modify dependant args', ->
      defaultargs({r: '/tmp/asdf/'}).db.should.equal('/tmp/asdf/data/pages')

