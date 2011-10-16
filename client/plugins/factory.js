(function() {
  var bindDragAndDrop;
  window.plugins.factory = {
    emit: function(div, item) {
      return div.append('<p>Double-Click to Edit<br>Drop Text or Image to Insert</p>');
    },
    bind: function(div, item) {
      bindDragAndDrop(div, item, ["image", "text"]);
      return div.dblclick(function() {
        div.removeClass('factory').addClass(item.type = 'paragraph');
        return textEditor(div, item);
      });
    }
  };
  bindDragAndDrop = function(div, item, allowedTypes) {
    if (allowedTypes == null) {
      allowedTypes = [];
    }
    ["dragenter", "dragover"].map(function(eventName) {
      return div.bind(eventName, function(evt) {
        return evt.preventDefault();
      });
    });
    return div.bind("drop", function(dropEvent) {
      var file, finishDrop, majorType, minorType, reader, _ref;
      finishDrop = function(type, handler) {
        return function(loadEvent) {
          var action, pageDiv;
          item.type = type;
          handler(loadEvent);
          div.empty();
          div.removeClass("factory").addClass(type);
          pageDiv = div.parents('.page:first');
          action = {
            type: 'edit',
            id: item.id,
            item: item
          };
          wiki.putAction(pageDiv, action);
          return wiki.getPlugin(type).emit(div, item);
        };
      };
      dropEvent.preventDefault();
      console.log([dropEvent, dropEvent.originalEvent]);
      file = dropEvent.originalEvent.dataTransfer.files[0];
      console.log([file.type, file]);
      _ref = file.type.split("/"), majorType = _ref[0], minorType = _ref[1];
      if (allowedTypes.filter(function(t) {
        return t === majorType;
      }).length === 0) {
        return alert("Uploads of type " + majorType + " not supported for this item");
      } else {
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
        }
      }
    });
  };
}).call(this);
