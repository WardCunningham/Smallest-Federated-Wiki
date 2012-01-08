(function() {

  window.plugins.federatedWiki = {
    emit: function(div, item) {
      var slug;
      slug = item.slug || 'welcome-visitors';
      wiki.log('emit', slug, 'site', item.site);
      return wiki.resolveFrom(item.site, function() {
        div.append($("<h3 style='margin-bottom:3px;'><img src='//" + item.site + "/favicon.png' class='remote' width='16px' height='16px'> " + (item.title || slug) + "</h3>"));
        div.append($("<div>" + (wiki.resolveLinks(item.text)) + "</div>"));
        return div.find('img').data('slug', slug).data('site', item.site);
      });
    },
    bind: function(div, item) {
      return div.dblclick(function() {
        return wiki.textEditor(div, item);
      });
    }
  };

}).call(this);
