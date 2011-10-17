(function() {
  window.plugins.federatedWiki = {
    emit: function(div, item) {
      var icon;
      icon = $("<a href='//" + item.site + "/view/welcome-visitors' class='remote'><img src='//" + item.site + "/favicon.png' width='24px' height='24px'></a>");
      icon.find('img').data('slug', 'welcome-visitors');
      icon.find('img').data('site', item.site);
      return div.append($("<p> " + (wiki.resolveLinks(item.text)) + "</p>").prepend(icon));
    },
    bind: function(div, item) {
      return div.dblclick(function() {
        return wiki.textEditor(div, item);
      });
    }
  };
}).call(this);
