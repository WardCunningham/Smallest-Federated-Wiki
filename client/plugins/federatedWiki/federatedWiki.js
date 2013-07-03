(function() {
  window.plugins.federatedWiki = {
    emit: function($item, item) {
      var site, slug;
      slug = item.slug || 'welcome-visitors';
      site = item.site;
      return wiki.resolveFrom(site, function() {
        return $item.append("<p style='margin-bottom:3px;'>\n  <img class='remote'\n    src='//" + site + "/favicon.png'\n    title='" + site + "'\n    data-site=\"" + site + "\"\n    data-slug=\"" + slug + "\"\n  >\n  " + (wiki.resolveLinks("[[" + (item.title || slug) + "]]")) + "\n</p>\n<div>\n  " + (wiki.resolveLinks(item.text)) + "\n</div>");
      });
    },
    bind: function($item, item) {
      return $item.dblclick(function() {
        return wiki.textEditor($item, item);
      });
    }
  };

}).call(this);
