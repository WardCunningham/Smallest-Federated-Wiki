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
        var dt, readFile, readHandler;
        readHandler = function(type, handler) {
          return function(loadEvent) {
            var action, pageElement, plugin;
            item.type = type;
            handler(loadEvent);
            div.empty().unbind();
            div.removeClass("factory").addClass(type);
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
            action = {
              type: 'edit',
              id: item.id,
              item: item
            };
            return wiki.putAction(pageElement, action);
          };
        };
        readFile = function(file) {
          var majorType, minorType, reader, _ref;
          if (file != null) {
            _ref = file.type.split("/"), majorType = _ref[0], minorType = _ref[1];
            reader = new FileReader();
            if (majorType === "image") {
              reader.onload = readHandler("image", function(loadEvent) {
                item.url = loadEvent.target.result;
                return item.caption || (item.caption = "Uploaded image");
              });
              return reader.readAsDataURL(file);
            } else if (majorType === "text") {
              reader.onload = readHandler("paragraph", function(loadEvent) {
                return item.text = loadEvent.target.result;
              });
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
            console.log(dt);
            return console.log(dt.getData('URL'));
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
