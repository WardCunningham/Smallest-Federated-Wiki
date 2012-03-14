var DataDash = function (opt) {
  'use strict';
  // DataDash is a factory that you can call with options to create
  // an interface with your data- attributes.  Typical usage to get started
  // would be: `dataDash = DataDash();`
  //
  // Mit Licensed, https://github.com/nrn/dataDash
  // Copyright (c)  Nick Niemeir <nick.niemeir@gmail.com>,
  //                Matt Niemeir <matt.niemeir@gmail.com>
  var stats = {}, stringify, parse, dataDash, fnName, attrName, camName;

  opt || (opt = {});

  if (typeof opt === 'string') {
    opt = {prefix: opt};
  }

  opt.prefix || (opt.prefix = '');

  fnName = camelCase('data-dash-' + opt.prefix);
  attrName = dasherize('data-' + opt.prefix + '-');
  camName = '';
  if (!(opt.prefix === '')) {
    camName = dasherize(opt.prefix + '-');
  }

  stringify = function (stuff, ele, _i) {
    if (typeof stuff === 'function') {
      stuff = stuff.call(ele, _i);
    }
    try {
      return JSON.stringify(stuff);
    } catch (e) {
      return stuff;
    }
  };

  parse = function (stuff) {
    try {
      return JSON.parse(stuff);
    } catch (e) {
      return stuff;
    }
  };

  dataDash = function (elements, name, data) {
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

  // if (opt.stats) updateStats(element, name, data);

  function updateStats (element, name, data) {
    if (!stats[name]) {
      stats[name] = {
        get: 0,
        set: 0,
        on: {}
      };
    }
    if (data) {
      stats[name].set += 1;
    } else {
      stats[name].get += 1;
    }
    stats[name].on[element.tagName] = true;
  };

  function io (elements, name, data) {
    var _i, _len, _results;
    if (typeof data === 'undefined') {
      name = name ? camelCase(camName + name) : '';
      if (!(elements.length > 0)) {
        if (opt.stats) updateStats(elements, name, data);
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
      name = dasherize(name);
      if (!(elements.length > 0)) {
        if (opt.stats) updateStats(elements, name, data);
        if (data === null) {
          elements.removeAttribute(attrName + name);
        } else {
          elements.setAttribute(attrName + name, stringify(data, elements, 0));
        }
      } else {
        for (_i = 0, _len = elements.length; _i < _len; _i += 1) {
          if (opt.stats) updateStats(elements[_i], name, data);
          if (data === null) {
            elements[_i].removeAttribute(attrName + name);
          } else {
            elements[_i].setAttribute(attrName + name, stringify(data, elements[_i], _i));
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
      var prefix = camelCase(opt.prefix);
      for (_i in parse(element.dataset)) {
        if (opt.stats) updateStats(element, _i);
        if (_i.slice(0, prefix.length) === prefix) {
          _result[_i.slice(prefix.length, prefix.length + 1).toLowerCase() + _i.slice(prefix.length + 1)] = parse(element.dataset[_i]);
        }
      }
      return _result;
    } else {
      if (opt.stats) updateStats(element, name);
      return parse(element.dataset[name]);
    }
  };

  dataDash.stats = function () {
    if (opt.stats) {
      return stats;
    } else {
      return;
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
};

