(function() {
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  window.plugins.factory = {
    emit: function(div, item) {
      return div.append('<p>Double-Click to Edit<br>Drop Text or Image to Insert</p>');
    },
    bind: function(div, item) {
      var syncEditAction;
      syncEditAction = function() {
        var pageElement, plugin;
        console.log(item);
        div.empty().unbind();
        div.removeClass("factory").addClass(item.type);
        pageElement = div.parents('.page:first');
        try {
          div.data('pageElement', pageElement);
          div.data('item', item);
          plugin = wiki.getPlugin(item.type);
          plugin.emit(div, item);
          plugin.bind(div, item);
        } catch (err) {
          div.append("<p class='error'>" + err + "</p>");
        }
        return wiki.putAction(pageElement, {
          type: 'edit',
          id: item.id,
          item: item
        });
      };
      div.dblclick(function() {
        div.removeClass('factory').addClass(item.type = 'paragraph');
        return wiki.textEditor(div, item);
      });
      div.bind('dragenter', function(evt) {
        return evt.preventDefault();
      });
      div.bind('dragover', function(evt) {
        return evt.preventDefault();
      });
      return div.bind("drop", function(dropEvent) {
        var dt, found, ignore, readFile, url;
        readFile = function(file) {
          var majorType, minorType, reader, _ref;
          if (file != null) {
            _ref = file.type.split("/"), majorType = _ref[0], minorType = _ref[1];
            reader = new FileReader();
            if (majorType === "image") {
              reader.onload = function(loadEvent) {
                item.type = 'image';
                item.url = loadEvent.target.result;
                item.caption || (item.caption = "Uploaded image");
                return syncEditAction();
              };
              return reader.readAsDataURL(file);
            } else if (majorType === "text") {
              reader.onload = function(loadEvent) {
                item.type = 'paragraph';
                item.text = loadEvent.target.result;
                return syncEditAction();
              };
              return reader.readAsText(file);
            } else {
              return alert("Expected text or image, got '" + (join("\n", file.type)) + "'");
            }
          } else {
            return alert("Expected file name, got null");
          }
        };
        dropEvent.preventDefault();
        if ((dt = dropEvent.originalEvent.dataTransfer) != null) {
          if (__indexOf.call(dt.types, 'text/uri-list') >= 0) {
            console.log(dt.getData('URL'));
            url = dt.getData('URL');
            if (found = url.match(/https?:\/\/([a-z0-9\:\.\-]+)\/.*?view\/([a-z0-9-]+)$/)) {
              ignore = found[0], item.site = found[1], item.slug = found[2];
              return $.getJSON("http://" + item.site + "/" + item.slug + ".json", function(remote) {
                console.log(remote);
                item.type = 'federatedWiki';
                item.title = remote.title || item.slug;
                item.text = remote.synopsis || remote.story[0].text || remote.story[1].text || 'A recently found federated wiki site.';
                return syncEditAction();
              });
            } else {
              return alert("Can't drop " + url);
            }
          } else if (__indexOf.call(dt.types, 'Files') >= 0) {
            return readFile(dt.files[0]);
          } else {
            console.log(dt.types);
            return alert("Can't read any of " + dt.types);
          }
        } else {
          return alert("Expected dataTransfer, got null");
        }
      });
    }
  };
}).call(this);
