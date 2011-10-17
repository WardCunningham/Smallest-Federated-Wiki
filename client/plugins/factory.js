(function() {
  window.plugins.factory = {
    emit: function(div, item) {
      return div.append('<p>Double-Click to Edit<br>Drop Text or Image to Insert</p>');
    },
    bind: function(div, item) {
      div.dblclick(function() {
        div.removeClass('factory').addClass(item.type = 'paragraph');
        return textEditor(div, item);
      });
      div.bind('dragenter', function(evt) {
        return evt.preventDefault();
      });
      div.bind('dragover', function(evt) {
        return evt.preventDefault();
      });
      return div.bind("drop", function(dropEvent) {
        var file, finishDrop, majorType, minorType, reader, _ref;
        finishDrop = function(type, handler) {
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
        dropEvent.preventDefault();
        if (dropEvent.originalEvent.dataTransfer != null) {
          console.log(dropEvent.originalEvent.dataTransfer.types);
          file = dropEvent.originalEvent.dataTransfer.files[0];
          if (file != null) {
            _ref = file.type.split("/"), majorType = _ref[0], minorType = _ref[1];
            reader = new FileReader();
            if (majorType === "image") {
              reader.onload = finishDrop("image", function(loadEvent) {
                item.url = loadEvent.target.result;
                return item.caption || (item.caption = "Uploaded image");
              });
              return reader.readAsDataURL(file);
            } else if (majorType === "text") {
              reader.onload = finishDrop("paragraph", function(loadEvent) {
                return item.text = loadEvent.target.result;
              });
              return reader.readAsText(file);
            } else {
              return alert("Expected text or image, got '" + file.type + "'");
            }
          } else {
            return alert("Expected file, got null");
          }
        } else {
          return alert("Expected dataTransfer, got null");
        }
      });
    }
  };
}).call(this);
