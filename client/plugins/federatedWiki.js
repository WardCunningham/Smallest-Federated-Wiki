(function() {
  window.plugins.federatedWiki = {
    emit: function(div, item) {
      var icon, site, slug;
      icon = $("<a href='//" + item.site + "/view/welcome-visitors' class='remote'><img src='//" + item.site + "/favicon.png' width='16px' height='16px'></a>");
      icon.find('img').data('slug', slug = item.slug || 'welcome-visitors');
      icon.find('img').data('site', site = item.site);
      div.append($("<p> " + (wiki.resolveLinks(item.text)) + "</p>").prepend(icon));
      return div.append($("<p class='cite'>http://" + site + "/view/" + slug + "</p>"));
    },
    bind: function(div, item) {
      return div.dblclick(function() {
        return wiki.textEditor(div, item);
      });
    }
  };
}).call(this);
