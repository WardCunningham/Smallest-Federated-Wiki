(function() {
  var arrayToJson, csvToArray,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  window.plugins.factory = {
    emit: function(div, item) {
      var info, menu, name, _ref, _results;
      div.append('<p>Double-Click to Edit<br>Drop Text or Image to Insert</p>');
      if (window.catalog != null) {
        menu = div.find('p').append("<br>Or Choose a Plugin");
        _ref = window.catalog;
        _results = [];
        for (name in _ref) {
          info = _ref[name];
          _results.push(menu.append("<li><a href='#' title='" + info.menu + "'>" + name + "</a></li>"));
        }
        return _results;
      }
    },
    bind: function(div, item) {
      var syncEditAction;
      syncEditAction = function() {
        var pageElement, plugin;
        wiki.log('item', item);
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
        div.unbind();
        return wiki.textEditor(div, item);
      });
      div.find('a').click(function(evt) {
        div.removeClass('factory').addClass(item.type = evt.target.text.toLowerCase());
        div.unbind();
        return wiki.textEditor(div, item);
      });
      div.bind('dragenter', function(evt) {
        return evt.preventDefault();
      });
      div.bind('dragover', function(evt) {
        return evt.preventDefault();
      });
      return div.bind("drop", function(dropEvent) {
        var dt, found, ignore, punt, readFile, url;
        punt = function(data) {
          wiki.log('punt', dropEvent);
          item.type = 'data';
          item.text = "Unexpected Item";
          item.data = data;
          return syncEditAction();
        };
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
                var array, result;
                result = loadEvent.target.result;
                if (minorType === 'csv') {
                  item.type = 'data';
                  item.columns = (array = csvToArray(result))[0];
                  item.data = arrayToJson(array);
                  item.text = file.fileName;
                } else {
                  item.type = 'paragraph';
                  item.text = result;
                }
                return syncEditAction();
              };
              return reader.readAsText(file);
            } else {
              return punt({
                name: file.fileName,
                type: file.type
              });
            }
          } else {
            return punt({
              types: dropEvent.originalEvent.dataTransfer.types
            });
          }
        };
        dropEvent.preventDefault();
        if ((dt = dropEvent.originalEvent.dataTransfer) != null) {
          if ((dt.types != null) && (__indexOf.call(dt.types, 'text/uri-list') >= 0 || __indexOf.call(dt.types, 'text/x-moz-url') >= 0)) {
            url = dt.getData('URL');
            if (found = url.match(/https?:\/\/([a-z0-9\:\.\-]+)\/.*?view\/([a-z0-9-]+)$/)) {
              ignore = found[0], item.site = found[1], item.slug = found[2];
              return $.getJSON("http://" + item.site + "/" + item.slug + ".json", function(remote) {
                wiki.log('remote', remote);
                item.type = 'federatedWiki';
                item.title = remote.title || item.slug;
                item.text = remote.synopsis || remote.story[0].text || remote.story[1].text || 'A recently found federated wiki site.';
                return syncEditAction();
              });
            } else {
              return punt({
                url: url,
                types: dt.types
              });
            }
          } else if (__indexOf.call(dt.types, 'Files') >= 0) {
            return readFile(dt.files[0]);
          } else {
            return punt({
              types: dt.types
            });
          }
        } else {
          return punt({
            trouble: "no data transfer object"
          });
        }
      });
    }
  };

  csvToArray = function(strData, strDelimiter) {
    var arrData, arrMatches, objPattern, strMatchedDelimiter, strMatchedValue;
    strDelimiter = strDelimiter || ",";
    objPattern = new RegExp("(\\" + strDelimiter + "|\\r?\\n|\\r|^)" + "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" + "([^\"\\" + strDelimiter + "\\r\\n]*))", "gi");
    arrData = [[]];
    arrMatches = null;
    while (arrMatches = objPattern.exec(strData)) {
      strMatchedDelimiter = arrMatches[1];
      if (strMatchedDelimiter.length && (strMatchedDelimiter !== strDelimiter)) {
        arrData.push([]);
      }
      if (arrMatches[2]) {
        strMatchedValue = arrMatches[2].replace(new RegExp("\"\"", "g"), "\"");
      } else {
        strMatchedValue = arrMatches[3];
      }
      arrData[arrData.length - 1].push(strMatchedValue);
    }
    return arrData;
  };

  arrayToJson = function(array) {
    var cols, row, rowToObject, _i, _len, _results;
    cols = array.shift();
    rowToObject = function(row) {
      var k, obj, v, _i, _len, _ref, _ref2;
      obj = {};
      _ref = _.zip(cols, row);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref2 = _ref[_i], k = _ref2[0], v = _ref2[1];
        if ((v != null) && (v.match(/\S/)) && v !== 'NULL') obj[k] = v;
      }
      return obj;
    };
    _results = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      row = array[_i];
      _results.push(rowToObject(row));
    }
    return _results;
  };

}).call(this);
