wiki = require './wiki.coffee'
util = require './util.coffee'
active = require './active.coffee'

createSearch = ({neighborhood})->
  performSearch = (searchQuery)->
    searchResults = neighborhood.search(searchQuery)
    tally = searchResults.tally


    explanatoryPara = {
      type: 'paragraph'
      id: util.randomBytes(8)
      text: """
        String '#{searchQuery}' found on #{tally.finds||'none'} of #{tally.pages||'no'} pages from #{tally.sites||'no'} sites.
        Text matched on #{tally.title||'no'} titles, #{tally.text||'no'} paragraphs, and #{tally.slug||'no'} slugs.
        Elapsed time #{tally.msec} milliseconds.
      """
    }
    searchResultReferences = for result in searchResults.finds
      {
        "type": "reference"
        "id": util.randomBytes(8)
        "site": result.site
        "slug": result.page.slug
        "title": result.page.title
        "text": result.page.synopsis || ''
      }
    searchResultPageData = {
      title: "Search Results"
      story: [explanatoryPara].concat(searchResultReferences)
    }
    $searchResultPage = wiki.createPage('search-results').addClass('ghost')
    $searchResultPage.appendTo($('.main'))
    wiki.buildPage( searchResultPageData, null, $searchResultPage )
    active.set($('.page').last())


  {
    performSearch
  }
module.exports = createSearch
