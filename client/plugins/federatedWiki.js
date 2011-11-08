(function() {
  window.plugins.federatedWiki = {
    emit: function(div, item) {
      var slug;
      slug = item.slug || 'welcome-visitors';
      div.append($("<h3><img src='//" + item.site + "/favicon.png' class='remote' width='16px' height='16px'> " + (item.title || slug) + "</h3>"));
      div.append($("<p>" + (wiki.resolveLinks(item.text)) + "</p>"));
      div.append($("<p class='cite'>http://" + item.site + "/view/" + slug + "</p>"));
      return div.find('img').data('slug', slug).data('site', item.site);
    },
    bind: function(div, item) {
      return div.dblclick(function() {
        return wiki.textEditor(div, item);
      });
    }
  };
}).call(this);
