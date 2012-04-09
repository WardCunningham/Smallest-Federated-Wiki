plugin = require('../lib/plugin.coffee')

describe 'plugin', ->
  it 'should have default paragraph type', ->
    expect(window.plugins).to.have.property('paragraph')


