revision = require '../lib/revision.coffee'

describe 'revision', ->

  data = {
    "title": "foo",
    "story": [],
    "journal": [
      {
        "type": "create",
        "id": "ec76ba61a6e35dec",
        "item": {
          "title": "foo"
        },
        "date": 1335650095871
      },
      {
        "item": {
          "type": "factory",
          "id": "6d8aca1c97d06674"
        },
        "id": "6d8aca1c97d06674",
        "type": "add",
        "date": 1335650110092
      },
      {
        "type": "remove",
        "id": "6d8aca1c97d06674",
        "date": 1335650117996
      }
    ]
  }

  it 'it should shorten the journal', ->
    version = revision.create 1, data
    expect(version.journal.length).to.be(2)
 
  it 'it should recover the factory', ->
    version = revision.create 1, data
    expect(version.story[0].type).to.be('factory')

