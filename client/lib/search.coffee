util = require('./util')
active = require('./active')
require('./dom')

createSearch = ({neighborhood})->
  performSearch = (searchQuery)->
    searchResults = neighborhood.search(searchQuery)

    explanatoryPara = {
      type: 'paragraph'
      id: util.randomBytes(8)
      text: "These are the search results for '#{searchQuery}'."
    }
    searchResultReferences = for result in searchResults
      {
        "type": "reference"
        "id": util.randomBytes(8)
        "site": result.site
        "slug": result.page.slug
        "title": result.page.title
        "text": ''
      }
    searchResultPageData = {
      title: "Search Results"
      story: [explanatoryPara].concat(searchResultReferences)
    }
    $searchResultPage = wiki.createPage('search-results').addClass('ghost')
    wiki.buildPage( searchResultPageData, null, $searchResultPage )
    $searchResultPage.appendTo($('.main'))
    active.set($('.page').last())


  {
    performSearch
  }
module.exports = createSearch
