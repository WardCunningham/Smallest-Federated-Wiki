var DataDash = (function (opt) {
  'use strict';
  // DataDash is a factory that you can call with options to create
  // an interface with your data- attributes.  Typical usage to get started
  // would be: `dataDash = DataDash();`

  opt || (opt = {});

  if (typeof opt === 'string') {
    opt = {prefix: opt};
  }

  opt.prefix || (opt.prefix = '');

  var fnName = camelCase('data-dash-' + opt.prefix);
  var attrName = dasherize('data-' + opt.prefix + '-');

  var stringify = function (stuff) {
    try {
      return JSON.stringify(stuff);
    } catch (e) {
      return stuff;
    }
  };

  var parse = function (stuff) {
    try {
      return JSON.parse(stuff);
    } catch (e) {
      return stuff;
    }
  };

  var dataDash = function (elements, name, data) {
    var _i, _result, _tmp;
    if (typeof name === 'object') {
      for (_i in name) {
        _result = io(elements, _i, name[_i]);
      }
      return _result;
    } else {
      return io(elements, name, data);
    }
  };

  function io (elements, name, data) {
    var _i, _len, _results;
    if (typeof data === 'undefined') {
      name = camelCase(name)
      if (!(elements.length > 0)) {
        return parse(elements.dataset[name]);
      } else {
        _results = [];
        for (_i = 0, _len = elements.length; _i < _len; _i += 1) {
          _results.push(getName(elements[_i], name));
        }
        if (_results.length === 1) {
          return _results[0];
        } else {
          return _results;
        }
      }
    } else {
      name = dasherize(name)
      if (!(elements.length > 0)) {
        if (data === null) {
          elements.removeAttribute(attrName + name);
        }else{
          elements.setAttribute(attrName + name, stringify(data));
        }
      } else {
        for (_i = 0, _len = elements.length; _i < _len; _i += 1) {
          if (data === null) {
            elements[_i].removeAttribute(attrName + name);
          }else{
            elements[_i].setAttribute(attrName + name, stringify(data));
          }
        }
      }
      return elements;
    }
  };

  function getName (element, name) {
    var _i, _result;
    if (name === '') {
      _result = {};
      for (_i in parse(element.dataset)) {
        _result[_i] = parse(element.dataset[_i]);
      }
      return _result;
    } else {
      return parse(element.dataset[name]);
    }
  };

  function dasherize (name) {
    if (!name) {
      return '';
    }
    return name.replace(/[A-Z]/g, function (match) {
      return '-' + match.toLowerCase();
    }).replace(/--/g, '-').toLowerCase();
  };

  function camelCase (name) {
    var names, camelized = [], _i, _len;
    if (!name) {
      return '';
    }
    names = name.split('-');
    camelized.push(names[0]);
    for(_i = 1, _len = names.length; _i < _len; _i += 1) {
      if (names && names[_i] && names[_i][0]) {
        camelized.push(names[_i][0].toUpperCase() + names[_i].slice(1));
      }
    }
    return camelized.join('');
  };

  if (!opt.noMethod && window.jQuery && !window.jQuery.fn[fnName]) {
    window.jQuery.fn[fnName] = function(name, data) {
      return dataDash(this, name, data);
    };
  }

  if (!opt.noMethod && window.d3 && !window.d3.selection.prototype[fnName]) {
    window.d3.selection.prototype[fnName] = function (name, data) {
      return dataDash(this[0], name, data);
    };
  }

  return dataDash;
});

