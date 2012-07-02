util = require('../lib/util.coffee')
revision = require '../lib/revision.coffee'

describe 'revision', ->

  data = {
    "title": "new-page",
    "story": [
      {
        "type": "paragraph",
        "id": "2b3e1bef708cb8d3",
        "text": "A new paragraph is now in first position"
      },
      {
        "type": "paragraph",
        "id": "ee416d431ebf4fb4",
        "text": "Start writing. Read [[How to Wiki]] for more ideas."
      },
      {
        "type": "paragraph",
        "id": "5bfaef3699a88622",
        "text": "Some paragraph text"
      }
    ],
    "journal": [
      {
        "type": "create",
        "id": "8311895173802a8e",
        "item": {
          "title": "new-page"
        },
        "date": 1340999639114
      },
      {
        "item": {
          "type": "factory",
          "id": "5bfaef3699a88622"
        },
        "id": "5bfaef3699a88622",
        "type": "add",
        "date": 1341191691509
      },
      {
        "type": "edit",
        "id": "5bfaef3699a88622",
        "item": {
          "type": "paragraph",
          "id": "5bfaef3699a88622",
          "text": "Some paragraph text"
        },
        "date": 1341191697815
      },
      {
        "item": {
          "type": "paragraph",
          "id": "2b3e1bef708cb8d3",
          "text": ""
        },
        "id": "2b3e1bef708cb8d3",
        "type": "add",
        "after": "5bfaef3699a88622",
        "date": 1341191698321
      },
      {
        "type": "edit",
        "id": "2b3e1bef708cb8d3",
        "item": {
          "type": "paragraph",
          "id": "2b3e1bef708cb8d3",
          "text": "A new paragraph after the first"
        },
        "date": 1341191703725
      },
      {
        "type": "add",
        "item": {
          "type": "paragraph",
          "id": "ee416d431ebf4fb4",
          "text": "Start writing. Read [[How to Wiki]] for more ideas."
        },
        "after": "5bfaef3699a88622",
        "id": "ee416d431ebf4fb4",
        "date": 1341193068611
      },
      {
        "type": "move",
        "order": [
          "2b3e1bef708cb8d3",
          "ee416d431ebf4fb4",
          "5bfaef3699a88622"
        ],
        "id": "2b3e1bef708cb8d3",
        "date": 1341191714682
      },
      {
        "type": "edit",
        "id": "2b3e1bef708cb8d3",
        "item": {
          "type": "paragraph",
          "id": "2b3e1bef708cb8d3",
          "text": "A new paragraph is now"
        },
        "date": 1341191723289
      },
      {
        "item": {
          "type": "paragraph",
          "id": "2dcb9c5558f21329",
          "text": " first"
        },
        "id": "2dcb9c5558f21329",
        "type": "add",
        "after": "2b3e1bef708cb8d3",
        "date": 1341191723794
      },
      {
        "type": "remove",
        "id": "2dcb9c5558f21329",
        "date": 1341191725509
      },
      {
        "type": "edit",
        "id": "2b3e1bef708cb8d3",
        "item": {
          "type": "paragraph",
          "id": "2b3e1bef708cb8d3",
          "text": "A new paragraph is now in first position"
        },
        "date": 1341191748944
      }
    ]
  }

  it 'an empty page should look like itself', ->
    emptyPage = util.emptyPage()
    version = revision.create 0, emptyPage
    expect(version).to.eql(emptyPage)

  it 'should shorten the journal to given revision', ->
    version = revision.create 1, data
    expect(version.journal.length).to.be(2)

  it 'should recreate story on given revision', ->
    version = revision.create 2, data
    expect(version.story.length).to.be(1)
    expect(version.story[0].text).to.be('Some paragraph text')

  it 'should accept revision as string', ->
    version = revision.create '1', data
    expect(version.journal.length).to.be(2)

  describe 'journal entry types', ->

    describe 'create', ->

      it 'should use original title if item has no title', ->
        version = revision.create 0, data
        expect(version.title).to.eql('new-page')

      it 'should define the title of the version', ->
        pageWithNewTitle = jQuery.extend(true, {}, data)
        pageWithNewTitle.journal[0].item.title = "new-title"
        version = revision.create 0, pageWithNewTitle
        expect(version.title).to.eql('new-title')

    describe 'add', ->

      describe 'using a factory', ->
        it 'should recover the factory as last item of the story', ->
          version = revision.create 1, data
          expect(version.story[0].type).to.be("factory")

      describe 'dragging item from another page', ->
        it 'should place story item on dropped position', ->
          version = revision.create 5, data
          expect(version.story[1].text).to.be("Start writing. Read [[How to Wiki]] for more ideas.")

        it 'should place story item at the end if dropped position is not defined', ->
          draggedItemWithoutAfter = jQuery.extend(true, {}, data)
          delete draggedItemWithoutAfter.journal[5].after
          version = revision.create 5, draggedItemWithoutAfter
          expect(version.story[2].text).to.be("Start writing. Read [[How to Wiki]] for more ideas.")

      describe 'splitting paragraph', ->
        it 'should place paragraphs after each other', ->
          version = revision.create 8, data
          expect(version.story[0].text).to.be('A new paragraph is now')
          expect(version.story[1].text).to.be(' first')

        it 'should place new paragraph at the end if split item is not defined', ->
          splitParagraphWithoutAfter = jQuery.extend(true, {}, data)
          delete splitParagraphWithoutAfter.journal[8].after
          version = revision.create 8, splitParagraphWithoutAfter
          expect(version.story[0].text).to.be('A new paragraph is now')
          expect(version.story[3].text).to.be(' first')

    describe 'edit', ->

      it 'should replace edited story item', ->
        version = revision.create 7, data
        expect(version.story[0].text).to.be('A new paragraph is now')

      it 'should place item at the end if edited item is not found', ->
        pageWithOnlyEdit = util.emptyPage()
        editedItem = {
          "type": "paragraph",
          "id": "2b3e1bef708cb8d3",
          "text": "A new paragraph"
        }
        pageWithOnlyEdit.journal.push {
          "type": "edit",
          "id": "2b3e1bef708cb8d3",
          "item": editedItem,
          "date": 1341191748944
        }
        version = revision.create 1, pageWithOnlyEdit
        expect(version.story[0].text).to.be('A new paragraph')

    describe 'move', ->
      it 'should reorder the story items according to move order', ->
        version = revision.create 5, data
        expect(version.story[0].text).to.be('Some paragraph text')
        expect(version.story[1].text).to.be('Start writing. Read [[How to Wiki]] for more ideas.')
        expect(version.story[2].text).to.be('A new paragraph after the first')

        version = revision.create 6, data
        expect(version.story[0].text).to.be('A new paragraph after the first')
        expect(version.story[1].text).to.be('Start writing. Read [[How to Wiki]] for more ideas.')
        expect(version.story[2].text).to.be('Some paragraph text')

    describe 'remove', ->
      it 'should remove the story item', ->
        version = revision.create 8, data
        expect(version.story[0].text).to.be('A new paragraph is now')
        expect(version.story[1].text).to.be(' first')
        expect(version.story[2].text).to.be('Start writing. Read [[How to Wiki]] for more ideas.')
        expect(version.story[3].text).to.be('Some paragraph text')

        version = revision.create 9, data
        expect(version.story[0].text).to.be('A new paragraph is now')
        expect(version.story[1].text).to.be('Start writing. Read [[How to Wiki]] for more ideas.')
        expect(version.story[2].text).to.be('Some paragraph text')
