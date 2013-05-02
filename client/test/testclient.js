;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
(function() {
  mocha.setup('bdd');

  window.wiki = require('./lib/wiki.coffee');

  require('./test/util.coffee');

  require('./test/active.coffee');

  require('./test/pageHandler.coffee');

  require('./test/refresh.coffee');

  require('./test/plugin.coffee');

  require('./test/revision.coffee');

  require('./test/neighborhood.coffee');

  require('./test/search.coffee');

  $(function() {
    $('<hr><h2> Testing artifacts:</h2>').appendTo('body');
    return mocha.run();
  });

}).call(this);


},{"./lib/wiki.coffee":2,"./test/util.coffee":3,"./test/active.coffee":4,"./test/pageHandler.coffee":5,"./test/refresh.coffee":6,"./test/plugin.coffee":7,"./test/revision.coffee":8,"./test/neighborhood.coffee":9,"./test/search.coffee":10}],11:[function(require,module,exports){
(function() {
  var txtzyme;

  txtzyme = require('./txtzyme');

  console.log(txtzyme);

  describe('txtzyme plugin', function() {
    describe('parsing', function() {
      it('recognizes definitions', function() {
        return expect(txtzyme.parse("SECOND 1o500m0o")).to.eql({
          SECOND: ['1o500m0o']
        });
      });
      it('handles empty definitions', function() {
        return expect(txtzyme.parse("SECOND")).to.eql({
          SECOND: []
        });
      });
      it('recognizes multiple definitions', function() {
        return expect(txtzyme.parse("SECOND BLINK BLINK\nBLINK 1o500m0o500m")).to.eql({
          SECOND: ['BLINK', 'BLINK'],
          BLINK: ['1o500m0o500m']
        });
      });
      it('ignores blank line separator', function() {
        return expect(txtzyme.parse("SECOND BLINK BLINK\n\nBLINK 1o500m0o500m")).to.eql({
          SECOND: ['BLINK', 'BLINK'],
          BLINK: ['1o500m0o500m']
        });
      });
      return it('treates indented lines as continuations', function() {
        return expect(txtzyme.parse("SECOND BLINK\n BLINK\n\nBLINK\n 1o500m0o500m")).to.eql({
          SECOND: ['BLINK', 'BLINK'],
          BLINK: ['1o500m0o500m']
        });
      });
    });
    return describe('applying', function() {
      var apply;

      apply = function(text, arg) {
        var defn, result;

        result = "";
        defn = txtzyme.parse(text);
        txtzyme.apply(defn, 'TEST', arg, function(message, stack, done) {
          result += message;
          return done();
        });
        return result;
      };
      it('recognizes definitions', function() {
        return expect(apply("TEST 1o")).to.eql("1o\n");
      });
      it('calls definitions', function() {
        return expect(apply("TEST FOO\nFOO 0o")).to.eql("0o\n");
      });
      it('merges results', function() {
        return expect(apply("TEST 1o FOO 0o\nFOO 10m")).to.eql("1o 10m 0o\n");
      });
      it('limits call depth', function() {
        return expect(apply("TEST o TEST")).to.eql("o o o o o o o o o o\n");
      });
      it('handles empty definitions', function() {
        return expect(apply("TEST")).to.eql("");
      });
      it('handles missing definitions', function() {
        return expect(apply("TEST FOO")).to.eql("");
      });
      it('recognizes NL as newline', function() {
        return expect(apply("TEST 100m NL 200m")).to.eql("100m\n200m\n");
      });
      it('recognizes A as argument', function() {
        return expect(apply("TEST A", 123)).to.eql("123\n");
      });
      it('recognizes A0, A1, A2 as accessor', function() {
        return expect(apply("TEST _ A1 A0 _", ['zero', 'one'])).to.eql("_ one zero _\n");
      });
      it('recognizes B0, B1 as accessor', function() {
        return expect(apply("TEST B4 B3 B2 B1 B0", 6)).to.eql("0 0 1 1 0\n");
      });
      it('recognizes C0, C1, C2 as accessor', function() {
        return expect(apply("TEST C0 C1 C2 C3", 'ABC')).to.eql("65 66 67 32\n");
      });
      it('recognizes D0, D1, D2 as accessor', function() {
        return expect(apply("TEST D3 D2 D1 D0", 123)).to.eql("48 49 50 51\n");
      });
      it('recognizes numeric parameter', function() {
        return expect(apply("TEST IT/25\nIT A", 123)).to.eql("25\n");
      });
      return it('recognizes accessor as parameter', function() {
        return expect(apply("TEST IT/A1\nIT A", [123, 456])).to.eql("456\n");
      });
    });
  });

}).call(this);


},{"./txtzyme":12}],13:[function(require,module,exports){
(function() {
  var report;

  report = require('./calendar');

  describe('calendar plugin', function() {
    describe('parsing', function() {
      it('recognizes decades', function() {
        expect(report.parse("1960 DECADE")).to.eql([
          {
            year: 1960,
            span: 'DECADE'
          }
        ]);
        expect(report.parse("DECADE 1960")).to.eql([
          {
            year: 1960,
            span: 'DECADE'
          }
        ]);
        return expect(report.parse("60S")).to.eql([
          {
            year: 1960,
            span: 'DECADE'
          }
        ]);
      });
      it('recognizes half decades', function() {
        expect(report.parse("60S EARLY")).to.eql([
          {
            year: 1960,
            span: 'EARLY'
          }
        ]);
        expect(report.parse("EARLY 60S")).to.eql([
          {
            year: 1960,
            span: 'EARLY'
          }
        ]);
        return expect(report.parse("LATE 60S")).to.eql([
          {
            year: 1960,
            span: 'LATE'
          }
        ]);
      });
      it('recognizes years', function() {
        return expect(report.parse("1960")).to.eql([
          {
            year: 1960,
            span: 'YEAR'
          }
        ]);
      });
      it('recognizes months', function() {
        expect(report.parse("1960 MAR")).to.eql([
          {
            year: 1960,
            month: 3,
            span: 'MONTH'
          }
        ]);
        expect(report.parse("MAR 1960")).to.eql([
          {
            year: 1960,
            month: 3,
            span: 'MONTH'
          }
        ]);
        return expect(report.parse("MARCH 1960")).to.eql([
          {
            year: 1960,
            month: 3,
            span: 'MONTH'
          }
        ]);
      });
      it('recognizes days', function() {
        expect(report.parse("MAR 5 1960")).to.eql([
          {
            year: 1960,
            month: 3,
            day: 5,
            span: 'DAY'
          }
        ]);
        expect(report.parse("1960 MAR 5")).to.eql([
          {
            year: 1960,
            month: 3,
            day: 5,
            span: 'DAY'
          }
        ]);
        return expect(report.parse("5 MAR 1960")).to.eql([
          {
            year: 1960,
            month: 3,
            day: 5,
            span: 'DAY'
          }
        ]);
      });
      return it('recognizes labels', function() {
        expect(report.parse("Ward's CHM Interview")).to.eql([
          {
            label: "Ward's CHM Interview"
          }
        ]);
        expect(report.parse("APRIL 24 2006 Ward's CHM Interview")).to.eql([
          {
            year: 2006,
            month: 4,
            day: 24,
            span: 'DAY',
            label: "Ward's CHM Interview"
          }
        ]);
        return expect(report.parse(" APRIL  24  2006\tWard's  CHM  Interview  ")).to.eql([
          {
            year: 2006,
            month: 4,
            day: 24,
            span: 'DAY',
            label: "Ward's CHM Interview"
          }
        ]);
      });
    });
    return describe('applying', function() {
      var interview, today;

      today = new Date(2013, 2 - 1, 3);
      interview = new Date(2006, 4 - 1, 24);
      it('recalls input', function() {
        var input, output, rows;

        input = {
          interview: {
            date: interview
          }
        };
        output = {};
        rows = report.parse("interview");
        return expect(report.apply(input, output, today, rows)).to.eql([
          {
            date: interview,
            label: 'interview'
          }
        ]);
      });
      return it('extends today', function() {
        var input, output, results, rows;

        input = {};
        output = {};
        rows = report.parse("APRIL 1 April Fools Day");
        results = report.apply(input, output, today, rows);
        expect(results).to.eql([
          {
            date: new Date(2013, 4 - 1),
            month: 4,
            day: 1,
            span: 'DAY',
            label: 'April Fools Day'
          }
        ]);
        return expect(output).to.eql({
          'April Fools Day': {
            date: new Date(2013, 4 - 1),
            span: 'DAY'
          }
        });
      });
    });
  });

}).call(this);


},{"./calendar":14}],15:[function(require,module,exports){
(function() {
  var createFakeLocalStorage, pluginCtor;

  pluginCtor = require('./changes');

  createFakeLocalStorage = function(initialContents) {
    var fake, getStoreSize, keys, store;

    if (initialContents == null) {
      initialContents = {};
    }
    store = initialContents;
    keys = function() {
      var k, _, _results;

      _results = [];
      for (k in store) {
        _ = store[k];
        _results.push(k);
      }
      return _results;
    };
    getStoreSize = function() {
      return keys().length;
    };
    fake = {
      setItem: function(k, v) {
        return store[k] = v;
      },
      getItem: function(k) {
        return store[k];
      },
      key: function(i) {
        return keys()[i];
      },
      removeItem: function(k) {
        return delete store[k];
      }
    };
    Object.defineProperty(fake, 'length', {
      get: getStoreSize
    });
    return fake;
  };

  describe('changes plugin', function() {
    var $div, clickDeleteForPageWithSlug, expectNumberOfPagesToBe, fakeLocalStore, installPlugin, makePlugin;

    fakeLocalStore = void 0;
    $div = void 0;
    beforeEach(function() {
      $div = $('<div/>');
      return fakeLocalStore = createFakeLocalStorage();
    });
    makePlugin = function() {
      return pluginCtor($, {
        localStorage: fakeLocalStore
      });
    };
    installPlugin = function() {
      var plugin;

      plugin = makePlugin();
      plugin.emit($div, {});
      return plugin.bind($div, {});
    };
    expectNumberOfPagesToBe = function(expectedLength) {
      return expect($div.find('li a').length).to.be(expectedLength);
    };
    clickDeleteForPageWithSlug = function(slug) {
      return $div.find("li a[data-page-name='" + slug + "']").siblings('button').trigger('click');
    };
    it("renders 'empty' when there are no local changes", function() {
      installPlugin();
      expect($div.html()).to.contain('empty');
      return expectNumberOfPagesToBe(0);
    });
    return describe('some pages in local store', function() {
      beforeEach(function() {
        return fakeLocalStore = createFakeLocalStorage({
          page1: JSON.stringify({
            title: "A Page"
          }),
          page2: JSON.stringify({
            title: "Another Page"
          }),
          page3: JSON.stringify({
            title: "Page the Third"
          })
        });
      });
      it("doesn't render 'empty'", function() {
        installPlugin();
        return expect($div.html()).not.to.contain('empty');
      });
      it("lists each page found in the local store", function() {
        var allTitles;

        installPlugin();
        expectNumberOfPagesToBe(3);
        allTitles = $div.find('li a').map(function(_, a) {
          return $(a).html();
        }).toArray().join('');
        expect(allTitles).to.contain('A Page');
        expect(allTitles).to.contain('Another Page');
        return expect(allTitles).to.contain('Page the Third');
      });
      it("removes a page from local store", function() {
        installPlugin();
        expect(fakeLocalStore.getItem('page2')).to.be.ok();
        clickDeleteForPageWithSlug('page2');
        return expect(fakeLocalStore.getItem('page2')).not.to.be.ok();
      });
      return it("updates the plugin div when a page is removed", function() {
        installPlugin();
        expectNumberOfPagesToBe(3);
        clickDeleteForPageWithSlug('page2');
        return expectNumberOfPagesToBe(2);
      });
    });
  });

}).call(this);


},{"./changes":16}],17:[function(require,module,exports){
(function() {
  var expectArraysEqual;

  require('./efficiency');

  expectArraysEqual = function(a1, a2, accuracy) {
    var diff, i, isItGood, length, _i, _ref, _results;

    if (accuracy == null) {
      accuracy = 0.1;
    }
    expect(a1.length).to.equal(a2.length);
    length = a1.length;
    _results = [];
    for (i = _i = 0, _ref = length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
      diff = Math.abs(a1[i] - a2[i]);
      isItGood = diff <= accuracy;
      _results.push(expect(isItGood).to.be.ok());
    }
    return _results;
  };

  describe('efficiency plugin', function() {
    var actual, actualArray, expected, expectedLuma, rgbt;

    it("max & min of array", function() {
      expect(6).to.equal(Math.max.apply(Math, [1, 2, 3, 4, 5, 6]));
      return expect(1).to.equal(Math.min.apply(Math, [1, 2, 3, 4, 5, 6]));
    });
    it("Get gray luma from 4-byte RGBT data. Two values", function() {});
    rgbt = [1, 1, 1, 1, 2, 2, 2, 2];
    expectedLuma = [1.0, 2.0];
    actualArray = window.plugins.efficiency.getGrayLumaFromRGBT(rgbt);
    expected = JSON.stringify(expectedLuma);
    actual = JSON.stringify(actualArray);
    expectArraysEqual(expectedLuma, actualArray);
    it("Get gray luma from 4-byte RGBT data. Three values", function() {});
    rgbt = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3];
    expectedLuma = [1.0, 2.0, 3.0];
    actualArray = window.plugins.efficiency.getGrayLumaFromRGBT(rgbt);
    expected = JSON.stringify(expectedLuma);
    actual = JSON.stringify(actualArray);
    expectArraysEqual(expectedLuma, actualArray);
    it("calculateStrategy_GrayBinary 50% binary data", function() {
      var lumas, output;

      lumas = [0, 0, 255, 255];
      output = window.plugins.efficiency.calculateStrategy_GrayBinary(lumas);
      return expect('50.0').to.equal(output.toFixed(1));
    });
    it("calculateStrategy_GrayBinary 50% linear data", function() {
      var lumas, output;

      lumas = [1, 2, 3, 4];
      output = window.plugins.efficiency.calculateStrategy_GrayBinary(lumas);
      return expect('50.0').to.equal(output.toFixed(1));
    });
    it("calculateStrategy_GrayBinary 75% binary data", function() {
      var lumas, output;

      lumas = [0, 255, 255, 255];
      output = window.plugins.efficiency.calculateStrategy_GrayBinary(lumas);
      return expect('75.0').to.equal(output.toFixed(1));
    });
    it("calculateStrategy_GrayIterativeClustering 50% binary data", function() {
      var lumas, output;

      lumas = [0, 0, 255, 255];
      output = window.plugins.efficiency.calculateStrategy_GrayIterativeClustering(lumas);
      return expect('50.0').to.equal(output.toFixed(1));
    });
    it("calculateStrategy_GrayIterativeClustering 50% linear data", function() {
      var lumas, output;

      lumas = [1, 2, 3, 4];
      output = window.plugins.efficiency.calculateStrategy_GrayIterativeClustering(lumas);
      return expect('50.0').to.equal(output.toFixed(1));
    });
    return it("calculateStrategy_GrayIterativeClustering 75% binary data", function() {
      var lumas, output;

      lumas = [0, 255, 255, 255];
      output = window.plugins.efficiency.calculateStrategy_GrayIterativeClustering(lumas);
      return expect('75.0').to.equal(output.toFixed(1));
    });
  });

}).call(this);


},{"./efficiency":18}],19:[function(require,module,exports){
(function() {
  var report;

  report = require('./report');

  describe('report plugin', function() {
    describe('parsing', function() {
      it('returns an array', function() {
        var schedule;

        schedule = report.parse("");
        return expect(schedule).to.eql([]);
      });
      it('parses intervals', function() {
        var issue;

        issue = report.parse("DAILY ward@example.com")[0];
        return expect(issue.interval).to.be('DAILY');
      });
      it('parses offsets', function() {
        var issue;

        issue = report.parse("WEEKLY TUESDAY NOON")[0];
        return expect(issue.offsets).to.eql(['TUESDAY', 'NOON']);
      });
      it('parses recipients', function() {
        var issue;

        issue = report.parse("DAILY ward@c2.com root@c2.com")[0];
        return expect(issue.recipients).to.eql(['ward@c2.com', 'root@c2.com']);
      });
      return it('parses multiple issues', function() {
        var schedule;

        schedule = report.parse("WEEKLY MONTHLY YEARLY");
        return expect(schedule).to.have.length(3);
      });
    });
    return describe('advancing', function() {
      it('handles weeks', function() {
        var count, date, issue;

        issue = report.parse("WEEKLY")[0];
        date = new Date(2012, 12 - 1, 25, 3, 4, 5);
        count = function(i) {
          return report.advance(date, issue, i);
        };
        expect(count(-1)).to.eql(new Date(2012, 12 - 1, 16));
        expect(count(0)).to.eql(new Date(2012, 12 - 1, 23));
        expect(count(1)).to.eql(new Date(2012, 12 - 1, 30));
        return expect(count(2)).to.eql(new Date(2013, 1 - 1, 6));
      });
      it('handles weeks with offsets (noon > now)', function() {
        var count, date, issue;

        issue = report.parse("WEEKLY TUESDAY NOON")[0];
        date = new Date(2012, 12 - 1, 25, 3, 4, 5);
        count = function(i) {
          return report.advance(date, issue, i);
        };
        expect(count(-1)).to.eql(new Date(2012, 12 - 1, 11, 12));
        expect(count(0)).to.eql(new Date(2012, 12 - 1, 18, 12));
        expect(count(1)).to.eql(new Date(2012, 12 - 1, 25, 12));
        return expect(count(2)).to.eql(new Date(2013, 1 - 1, 1, 12));
      });
      it('handles years with offsets (march < now)', function() {
        var count, date, issue;

        issue = report.parse("YEARLY MARCH FRIDAY EVENING")[0];
        date = new Date(2012, 12 - 1, 25, 3, 4, 5);
        count = function(i) {
          return report.advance(date, issue, i);
        };
        expect(count(-1)).to.eql(new Date(2011, 3 - 1, 4, 18));
        expect(count(0)).to.eql(new Date(2012, 3 - 1, 2, 18));
        expect(count(1)).to.eql(new Date(2013, 3 - 1, 1, 18));
        return expect(count(2)).to.eql(new Date(2014, 3 - 1, 7, 18));
      });
      return it('handles election day (election > now)', function() {
        var count, date, issue;

        issue = report.parse("YEARLY NOVEMBER MONDAY TUESDAY MORNING")[0];
        date = new Date(2016, 1, 2, 3, 4, 5);
        count = function(i) {
          return report.advance(date, issue, i);
        };
        expect(count(-1)).to.eql(new Date(2014, 11 - 1, 4, 6));
        expect(count(0)).to.eql(new Date(2015, 11 - 1, 3, 6));
        expect(count(1)).to.eql(new Date(2016, 11 - 1, 8, 6));
        return expect(count(2)).to.eql(new Date(2017, 11 - 1, 7, 6));
      });
    });
  });

}).call(this);


},{"./report":20}],2:[function(require,module,exports){
(function() {
  var createSynopsis, wiki,
    __slice = [].slice;

  createSynopsis = require('./synopsis.coffee');

  wiki = {
    createSynopsis: createSynopsis
  };

  wiki.log = function() {
    var things;

    things = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if ((typeof console !== "undefined" && console !== null ? console.log : void 0) != null) {
      return console.log.apply(console, things);
    }
  };

  wiki.asSlug = function(name) {
    return name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase();
  };

  wiki.useLocalStorage = function() {
    return $(".login").length > 0;
  };

  wiki.resolutionContext = [];

  wiki.resolveFrom = function(addition, callback) {
    wiki.resolutionContext.push(addition);
    try {
      return callback();
    } finally {
      wiki.resolutionContext.pop();
    }
  };

  wiki.getData = function(vis) {
    var idx, who;

    if (vis) {
      idx = $('.item').index(vis);
      who = $(".item:lt(" + idx + ")").filter('.chart,.data,.calculator').last();
      if (who != null) {
        return who.data('item').data;
      } else {
        return {};
      }
    } else {
      who = $('.chart,.data,.calculator').last();
      if (who != null) {
        return who.data('item').data;
      } else {
        return {};
      }
    }
  };

  wiki.getDataNodes = function(vis) {
    var idx, who;

    if (vis) {
      idx = $('.item').index(vis);
      who = $(".item:lt(" + idx + ")").filter('.chart,.data,.calculator').toArray().reverse();
      return $(who);
    } else {
      who = $('.chart,.data,.calculator').toArray().reverse();
      return $(who);
    }
  };

  wiki.createPage = function(name, loc) {
    var $page, site;

    if (loc && loc !== 'view') {
      site = loc;
    }
    $page = $("<div class=\"page\" id=\"" + name + "\">\n  <div class=\"twins\"> <p> </p> </div>\n  <div class=\"header\">\n    <h1> <img class=\"favicon\" src=\"" + (site ? "//" + site : "") + "/favicon.png\" height=\"32px\"> " + name + " </h1>\n  </div>\n</div>");
    if (site) {
      $page.find('.page').attr('data-site', site);
    }
    return $page;
  };

  wiki.getItem = function(element) {
    if ($(element).length > 0) {
      return $(element).data("item") || $(element).data('staticItem');
    }
  };

  wiki.resolveLinks = function(string) {
    var renderInternalLink;

    renderInternalLink = function(match, name) {
      var slug;

      slug = wiki.asSlug(name);
      return "<a class=\"internal\" href=\"/" + slug + ".html\" data-page-name=\"" + slug + "\" title=\"" + (wiki.resolutionContext.join(' => ')) + "\">" + name + "</a>";
    };
    return string.replace(/\[\[([^\]]+)\]\]/gi, renderInternalLink).replace(/\[(http.*?) (.*?)\]/gi, "<a class=\"external\" target=\"_blank\" href=\"$1\" title=\"$1\" rel=\"nofollow\">$2 <img src=\"/images/external-link-ltr-icon.png\"></a>");
  };

  module.exports = wiki;

}).call(this);


},{"./synopsis.coffee":21}],3:[function(require,module,exports){
(function() {
  var timezoneOffset, util;

  util = require('../lib/util.coffee');

  timezoneOffset = function() {
    return (new Date(1333843344000)).getTimezoneOffset() * 60;
  };

  module.exports = describe('util', function() {
    it('should make random bytes', function() {
      var a;

      a = util.randomByte();
      expect(a).to.be.a('string');
      return expect(a.length).to.be(2);
    });
    it('should make random byte strings', function() {
      var s;

      s = util.randomBytes(4);
      expect(s).to.be.a('string');
      return expect(s.length).to.be(8);
    });
    it('should format unix time', function() {
      var s;

      s = util.formatTime(1333843344 + timezoneOffset());
      return expect(s).to.be('12:02 AM<br>8 Apr 2012');
    });
    it('should format javascript time', function() {
      var s;

      s = util.formatTime(1333843344000 + timezoneOffset() * 1000);
      return expect(s).to.be('12:02 AM<br>8 Apr 2012');
    });
    it('should format revision date', function() {
      var s;

      s = util.formatDate(1333843344000 + timezoneOffset() * 1000);
      return expect(s).to.be('Sun Apr 8, 2012<br>12:02:24 AM');
    });
    it('should slug a name', function() {
      var s;

      s = wiki.asSlug('Welcome Visitors');
      return expect(s).to.be('welcome-visitors');
    });
    it('should make emptyPage page with title, story and journal', function() {
      var page;

      page = util.emptyPage();
      expect(page.title).to.be('empty');
      expect(page.story).to.eql([]);
      return expect(page.journal).to.eql([]);
    });
    return it('should make fresh empty page each call', function() {
      var page;

      page = util.emptyPage();
      page.story.push({
        type: 'junk'
      });
      page = util.emptyPage();
      return expect(page.story).to.eql([]);
    });
  });

}).call(this);


},{"../lib/util.coffee":22}],4:[function(require,module,exports){
(function() {
  var active;

  active = require('../lib/active.coffee');

  describe('active', function() {
    before(function() {
      $('<div id="active1" />').appendTo('body');
      $('<div id="active2" />').appendTo('body');
      return active.set($('#active1'));
    });
    it('should detect the scroll container', function() {
      return expect(active.scrollContainer).to.be.a($);
    });
    it('should set the active div', function() {
      active.set($('#active2'));
      return expect($('#active2').hasClass('active')).to.be["true"];
    });
    return it('should remove previous active class', function() {
      return expect($('#active1').hasClass('active')).to.be["false"];
    });
  });

}).call(this);


},{"../lib/active.coffee":23}],5:[function(require,module,exports){
(function() {
  var mockServer, pageHandler;

  pageHandler = require('../lib/pageHandler.coffee');

  mockServer = require('./mockServer.coffee');

  wiki.useLocalStorage = function() {
    return false;
  };

  describe('pageHandler.get', function() {
    var genericPageData, genericPageInformation, pageInformationWithoutSite;

    it('should have an empty context', function() {
      return expect(pageHandler.context).to.eql([]);
    });
    pageInformationWithoutSite = {
      slug: 'slugName',
      rev: 'revName'
    };
    genericPageInformation = _.extend({}, pageInformationWithoutSite, {
      site: 'siteName'
    });
    genericPageData = {
      journal: []
    };
    describe('ajax fails', function() {
      before(function() {
        return mockServer.simulatePageNotFound();
      });
      after(function() {
        return jQuery.ajax.restore();
      });
      it("should tell us when it can't find a page (server specified)", function() {
        var whenGotten, whenNotGotten;

        whenGotten = sinon.spy();
        whenNotGotten = sinon.spy();
        pageHandler.get({
          pageInformation: _.clone(genericPageInformation),
          whenGotten: whenGotten,
          whenNotGotten: whenNotGotten
        });
        expect(whenGotten.called).to.be["false"];
        return expect(whenNotGotten.called).to.be["true"];
      });
      return it("should tell us when it can't find a page (server unspecified)", function() {
        var whenGotten, whenNotGotten;

        whenGotten = sinon.spy();
        whenNotGotten = sinon.spy();
        pageHandler.get({
          pageInformation: _.clone(pageInformationWithoutSite),
          whenGotten: whenGotten,
          whenNotGotten: whenNotGotten
        });
        expect(whenGotten.called).to.be["false"];
        return expect(whenNotGotten.called).to.be["true"];
      });
    });
    describe('ajax, success', function() {
      before(function() {
        sinon.stub(jQuery, "ajax").yieldsTo('success', genericPageData);
        return $('<div id="pageHandler5" data-site="foo" />').appendTo('body');
      });
      it('should get a page from specific site', function() {
        var whenGotten;

        whenGotten = sinon.spy();
        pageHandler.get({
          pageInformation: _.clone(genericPageInformation),
          whenGotten: whenGotten
        });
        expect(whenGotten.calledOnce).to.be["true"];
        expect(jQuery.ajax.calledOnce).to.be["true"];
        expect(jQuery.ajax.args[0][0]).to.have.property('type', 'GET');
        return expect(jQuery.ajax.args[0][0].url).to.match(/^http:\/\/siteName\/slugName\.json\?random=[a-z0-9]{8}$/);
      });
      return after(function() {
        return jQuery.ajax.restore();
      });
    });
    return describe('ajax, search', function() {
      before(function() {
        mockServer.simulatePageNotFound();
        return pageHandler.context = ['view', 'example.com', 'asdf.test', 'foo.bar'];
      });
      it('should search through the context for a page', function() {
        pageHandler.get({
          pageInformation: _.clone(pageInformationWithoutSite),
          whenGotten: sinon.stub(),
          whenNotGotten: sinon.stub()
        });
        expect(jQuery.ajax.args[0][0].url).to.match(/^\/slugName\.json\?random=[a-z0-9]{8}$/);
        expect(jQuery.ajax.args[1][0].url).to.match(/^http:\/\/example.com\/slugName\.json\?random=[a-z0-9]{8}$/);
        expect(jQuery.ajax.args[2][0].url).to.match(/^http:\/\/asdf.test\/slugName\.json\?random=[a-z0-9]{8}$/);
        return expect(jQuery.ajax.args[3][0].url).to.match(/^http:\/\/foo.bar\/slugName\.json\?random=[a-z0-9]{8}$/);
      });
      return after(function() {
        return jQuery.ajax.restore();
      });
    });
  });

  describe('pageHandler.put', function() {
    before(function() {
      $('<div id="pageHandler3" />').appendTo('body');
      return sinon.stub(jQuery, "ajax").yieldsTo('success');
    });
    it('should save an action', function(done) {
      var action;

      action = {
        type: 'edit',
        id: 1,
        item: {
          id: 1
        }
      };
      pageHandler.put($('#pageHandler3'), action);
      expect(jQuery.ajax.args[0][0].data).to.eql({
        action: JSON.stringify(action)
      });
      return done();
    });
    return after(function() {
      return jQuery.ajax.restore();
    });
  });

}).call(this);


},{"../lib/pageHandler.coffee":24,"./mockServer.coffee":25}],6:[function(require,module,exports){
(function() {
  var mockServer, refresh;

  refresh = require('../lib/refresh.coffee');

  mockServer = require('./mockServer.coffee');

  describe('refresh', function() {
    var $page, simulatePageNotBeingFound;

    simulatePageNotBeingFound = function() {
      return sinon.stub(jQuery, "ajax").yieldsTo('success', {
        title: 'asdf'
      });
    };
    $page = void 0;
    before(function() {
      $page = $('<div id="refresh" />');
      return $page.appendTo('body');
    });
    it("creates a ghost page when page couldn't be found", function() {
      mockServer.simulatePageNotFound();
      $page.each(refresh);
      expect($page.hasClass('ghost')).to.be(true);
      return expect($page.data('data').story[0].type).to.be('future');
    });
    return xit('should refresh a page', function(done) {
      simulatePageFound({
        title: 'asdf'
      });
      $page.each(refresh);
      jQuery.ajax.restore();
      expect($('#refresh h1').text()).to.be(' asdf');
      return done();
    });
  });

}).call(this);


},{"../lib/refresh.coffee":26,"./mockServer.coffee":25}],7:[function(require,module,exports){
(function() {
  var plugin;

  plugin = require('../lib/plugin.coffee');

  describe('plugin', function() {
    var fakeDeferred;

    fakeDeferred = void 0;
    before(function() {
      $('<div id="plugin" />').appendTo('body');
      fakeDeferred = {};
      fakeDeferred.done = sinon.mock().returns(fakeDeferred);
      fakeDeferred.fail = sinon.mock().returns(fakeDeferred);
      return sinon.stub(jQuery, 'getScript').returns(fakeDeferred);
    });
    after(function() {
      return jQuery.getScript.restore();
    });
    it('should have default image type', function() {
      return expect(window.plugins).to.have.property('image');
    });
    it('should fetch a plugin script from the right location', function() {
      plugin.get('test');
      expect(jQuery.getScript.calledOnce).to.be(true);
      return expect(jQuery.getScript.args[0][0]).to.be('/plugins/test/test.js');
    });
    return it('should render a plugin', function() {
      var item;

      item = {
        type: 'paragraph',
        text: 'blah [[Link]] asdf'
      };
      plugin["do"]($('#plugin'), item);
      return expect($('#plugin').html()).to.be('<p>blah <a class="internal" href="/link.html" data-page-name="link" title="view">Link</a> asdf</p>');
    });
  });

}).call(this);


},{"../lib/plugin.coffee":27}],8:[function(require,module,exports){
(function() {
  var revision, util;

  util = require('../lib/util.coffee');

  revision = require('../lib/revision.coffee');

  describe('revision', function() {
    var data;

    data = {
      "title": "new-page",
      "story": [
        {
          "type": "paragraph",
          "id": "2b3e1bef708cb8d3",
          "text": "A new paragraph is now in first position"
        }, {
          "type": "paragraph",
          "id": "ee416d431ebf4fb4",
          "text": "Start writing. Read [[How to Wiki]] for more ideas."
        }, {
          "type": "paragraph",
          "id": "5bfaef3699a88622",
          "text": "Some paragraph text"
        }
      ],
      "journal": [
        {
          "type": "create",
          "id": "8311895173802a8e",
          "item": {
            "title": "new-page"
          },
          "date": 1340999639114
        }, {
          "item": {
            "type": "factory",
            "id": "5bfaef3699a88622"
          },
          "id": "5bfaef3699a88622",
          "type": "add",
          "date": 1341191691509
        }, {
          "type": "edit",
          "id": "5bfaef3699a88622",
          "item": {
            "type": "paragraph",
            "id": "5bfaef3699a88622",
            "text": "Some paragraph text"
          },
          "date": 1341191697815
        }, {
          "item": {
            "type": "paragraph",
            "id": "2b3e1bef708cb8d3",
            "text": ""
          },
          "id": "2b3e1bef708cb8d3",
          "type": "add",
          "after": "5bfaef3699a88622",
          "date": 1341191698321
        }, {
          "type": "edit",
          "id": "2b3e1bef708cb8d3",
          "item": {
            "type": "paragraph",
            "id": "2b3e1bef708cb8d3",
            "text": "A new paragraph after the first"
          },
          "date": 1341191703725
        }, {
          "type": "add",
          "item": {
            "type": "paragraph",
            "id": "ee416d431ebf4fb4",
            "text": "Start writing. Read [[How to Wiki]] for more ideas."
          },
          "after": "5bfaef3699a88622",
          "id": "ee416d431ebf4fb4",
          "date": 1341193068611
        }, {
          "type": "move",
          "order": ["2b3e1bef708cb8d3", "ee416d431ebf4fb4", "5bfaef3699a88622"],
          "id": "2b3e1bef708cb8d3",
          "date": 1341191714682
        }, {
          "type": "edit",
          "id": "2b3e1bef708cb8d3",
          "item": {
            "type": "paragraph",
            "id": "2b3e1bef708cb8d3",
            "text": "A new paragraph is now"
          },
          "date": 1341191723289
        }, {
          "item": {
            "type": "paragraph",
            "id": "2dcb9c5558f21329",
            "text": " first"
          },
          "id": "2dcb9c5558f21329",
          "type": "add",
          "after": "2b3e1bef708cb8d3",
          "date": 1341191723794
        }, {
          "type": "remove",
          "id": "2dcb9c5558f21329",
          "date": 1341191725509
        }, {
          "type": "edit",
          "id": "2b3e1bef708cb8d3",
          "item": {
            "type": "paragraph",
            "id": "2b3e1bef708cb8d3",
            "text": "A new paragraph is now in first position"
          },
          "date": 1341191748944
        }
      ]
    };
    it('an empty page should look like itself', function() {
      var emptyPage, version;

      emptyPage = util.emptyPage();
      version = revision.create(0, emptyPage);
      return expect(version).to.eql(emptyPage);
    });
    it('should shorten the journal to given revision', function() {
      var version;

      version = revision.create(1, data);
      return expect(version.journal.length).to.be(2);
    });
    it('should recreate story on given revision', function() {
      var version;

      version = revision.create(2, data);
      expect(version.story.length).to.be(1);
      return expect(version.story[0].text).to.be('Some paragraph text');
    });
    it('should accept revision as string', function() {
      var version;

      version = revision.create('1', data);
      return expect(version.journal.length).to.be(2);
    });
    return describe('journal entry types', function() {
      describe('create', function() {
        it('should use original title if item has no title', function() {
          var version;

          version = revision.create(0, data);
          return expect(version.title).to.eql('new-page');
        });
        return it('should define the title of the version', function() {
          var pageWithNewTitle, version;

          pageWithNewTitle = jQuery.extend(true, {}, data);
          pageWithNewTitle.journal[0].item.title = "new-title";
          version = revision.create(0, pageWithNewTitle);
          return expect(version.title).to.eql('new-title');
        });
      });
      describe('add', function() {
        describe('using a factory', function() {
          return it('should recover the factory as last item of the story', function() {
            var version;

            version = revision.create(1, data);
            return expect(version.story[0].type).to.be("factory");
          });
        });
        describe('dragging item from another page', function() {
          it('should place story item on dropped position', function() {
            var version;

            version = revision.create(5, data);
            return expect(version.story[1].text).to.be("Start writing. Read [[How to Wiki]] for more ideas.");
          });
          return it('should place story item at the end if dropped position is not defined', function() {
            var draggedItemWithoutAfter, version;

            draggedItemWithoutAfter = jQuery.extend(true, {}, data);
            delete draggedItemWithoutAfter.journal[5].after;
            version = revision.create(5, draggedItemWithoutAfter);
            return expect(version.story[2].text).to.be("Start writing. Read [[How to Wiki]] for more ideas.");
          });
        });
        return describe('splitting paragraph', function() {
          it('should place paragraphs after each other', function() {
            var version;

            version = revision.create(8, data);
            expect(version.story[0].text).to.be('A new paragraph is now');
            return expect(version.story[1].text).to.be(' first');
          });
          return it('should place new paragraph at the end if split item is not defined', function() {
            var splitParagraphWithoutAfter, version;

            splitParagraphWithoutAfter = jQuery.extend(true, {}, data);
            delete splitParagraphWithoutAfter.journal[8].after;
            version = revision.create(8, splitParagraphWithoutAfter);
            expect(version.story[0].text).to.be('A new paragraph is now');
            return expect(version.story[3].text).to.be(' first');
          });
        });
      });
      describe('edit', function() {
        it('should replace edited story item', function() {
          var version;

          version = revision.create(7, data);
          return expect(version.story[0].text).to.be('A new paragraph is now');
        });
        return it('should place item at the end if edited item is not found', function() {
          var editedItem, pageWithOnlyEdit, version;

          pageWithOnlyEdit = util.emptyPage();
          editedItem = {
            "type": "paragraph",
            "id": "2b3e1bef708cb8d3",
            "text": "A new paragraph"
          };
          pageWithOnlyEdit.journal.push({
            "type": "edit",
            "id": "2b3e1bef708cb8d3",
            "item": editedItem,
            "date": 1341191748944
          });
          version = revision.create(1, pageWithOnlyEdit);
          return expect(version.story[0].text).to.be('A new paragraph');
        });
      });
      describe('move', function() {
        return it('should reorder the story items according to move order', function() {
          var version;

          version = revision.create(5, data);
          expect(version.story[0].text).to.be('Some paragraph text');
          expect(version.story[1].text).to.be('Start writing. Read [[How to Wiki]] for more ideas.');
          expect(version.story[2].text).to.be('A new paragraph after the first');
          version = revision.create(6, data);
          expect(version.story[0].text).to.be('A new paragraph after the first');
          expect(version.story[1].text).to.be('Start writing. Read [[How to Wiki]] for more ideas.');
          return expect(version.story[2].text).to.be('Some paragraph text');
        });
      });
      return describe('remove', function() {
        return it('should remove the story item', function() {
          var version;

          version = revision.create(8, data);
          expect(version.story[0].text).to.be('A new paragraph is now');
          expect(version.story[1].text).to.be(' first');
          expect(version.story[2].text).to.be('Start writing. Read [[How to Wiki]] for more ideas.');
          expect(version.story[3].text).to.be('Some paragraph text');
          version = revision.create(9, data);
          expect(version.story[0].text).to.be('A new paragraph is now');
          expect(version.story[1].text).to.be('Start writing. Read [[How to Wiki]] for more ideas.');
          return expect(version.story[2].text).to.be('Some paragraph text');
        });
      });
    });
  });

}).call(this);


},{"../lib/util.coffee":22,"../lib/revision.coffee":28}],9:[function(require,module,exports){
(function() {
  var neighborhood;

  neighborhood = require('../lib/neighborhood.coffee');

  describe('neighborhood', function() {
    describe('no neighbors', function() {
      return it('should return an empty array for our search', function() {
        var searchResult;

        searchResult = neighborhood.search("query string");
        return expect(searchResult.finds).to.eql([]);
      });
    });
    describe('a single neighbor with a few pages', function() {
      before(function() {
        var fakeSitemap, neighbor;

        fakeSitemap = [
          {
            title: 'Page One',
            slug: 'page-one',
            date: 'date1'
          }, {
            title: 'Page Two',
            slug: 'page-two',
            date: 'date2'
          }, {
            title: 'Page Three'
          }
        ];
        neighbor = {
          sitemap: fakeSitemap
        };
        wiki.neighborhood = {};
        return wiki.neighborhood['my-site'] = neighbor;
      });
      it('returns all pages that match the query', function() {
        var searchResult;

        searchResult = neighborhood.search("Page");
        return expect(searchResult.finds).to.have.length(3);
      });
      it('returns only pages that match the query', function() {
        var searchResult;

        searchResult = neighborhood.search("Page T");
        return expect(searchResult.finds).to.have.length(2);
      });
      it('should package the results in the correct format', function() {
        var expectedResult, searchResult;

        expectedResult = [
          {
            site: 'my-site',
            page: {
              title: 'Page Two',
              slug: 'page-two',
              date: 'date2'
            },
            rank: 1
          }
        ];
        searchResult = neighborhood.search("Page Two");
        return expect(searchResult.finds).to.eql(expectedResult);
      });
      return it('searches both the slug and the title');
    });
    describe('more than one neighbor', function() {
      before(function() {
        wiki.neighborhood = {};
        wiki.neighborhood['site-one'] = {
          sitemap: [
            {
              title: 'Page One from Site 1'
            }, {
              title: 'Page Two from Site 1'
            }, {
              title: 'Page Three from Site 1'
            }
          ]
        };
        return wiki.neighborhood['site-two'] = {
          sitemap: [
            {
              title: 'Page One from Site 2'
            }, {
              title: 'Page Two from Site 2'
            }, {
              title: 'Page Three from Site 2'
            }
          ]
        };
      });
      return it('returns matching pages from every neighbor', function() {
        var searchResult, sites;

        searchResult = neighborhood.search("Page Two");
        expect(searchResult.finds).to.have.length(2);
        sites = _.pluck(searchResult.finds, 'site');
        return expect(sites.sort()).to.eql(['site-one', 'site-two'].sort());
      });
    });
    return describe('an unpopulated neighbor', function() {
      before(function() {
        wiki.neighborhood = {};
        return wiki.neighborhood['unpopulated-site'] = {};
      });
      it('gracefully ignores unpopulated neighbors', function() {
        var searchResult;

        searchResult = neighborhood.search("some search query");
        return expect(searchResult.finds).to.be.empty();
      });
      return it('should re-populate the neighbor');
    });
  });

}).call(this);


},{"../lib/neighborhood.coffee":29}],10:[function(require,module,exports){
(function() {
  var createSearch;

  createSearch = require('../lib/search.coffee');

  describe('search', function() {
    return xit('performs a search on the neighborhood', function() {
      var search, spyNeighborhood;

      spyNeighborhood = {
        search: sinon.stub().returns([])
      };
      search = createSearch({
        neighborhood: spyNeighborhood
      });
      search.performSearch('some search query');
      expect(spyNeighborhood.search.called).to.be(true);
      return expect(spyNeighborhood.search.args[0][0]).to.be('some search query');
    });
  });

}).call(this);


},{"../lib/search.coffee":30}],12:[function(require,module,exports){
// Generated by CoffeeScript 1.6.2
(function() {
  var apply, bind, emit, parse, report, value;

  parse = function(text) {
    var defn, line, prev, word, words, _i, _j, _len, _len1, _ref, _ref1;

    defn = {};
    _ref = text.split(/\n+/);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      line = _ref[_i];
      words = line.split(/\s+/);
      if (words[0]) {
        defn[words[0]] = prev = words.slice(1, 1000);
      } else {
        _ref1 = words.slice(1, 1000);
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          word = _ref1[_j];
          prev.push(word);
        }
      }
    }
    return defn;
  };

  value = function(type, number, arg) {
    var string;

    switch (type) {
      case 'A':
        if (number.length) {
          return arg[+number];
        } else {
          return arg;
        }
        break;
      case 'B':
        return 1 & (arg >> (number || 0));
      case 'C':
        string = arg.toString();
        if (number < string.length) {
          return string.charCodeAt(number);
        } else {
          return 32;
        }
        break;
      case 'D':
        return 48 + Math.floor(+arg / (Math.pow(10, number)) % 10);
      case '':
        return number;
    }
  };

  apply = function(defn, call, arg, emit) {
    var words, _ref;

    if (!(words = (_ref = defn[call]) != null ? _ref.slice(0) : void 0)) {
      return;
    }
    return (function(stack, result) {
      var next, send;

      send = function() {
        var text;

        if (!result.length) {
          return;
        }
        text = "" + (result.join(' ')) + "\n";
        result = [];
        return emit(text, stack, next);
      };
      next = function() {
        var m, word, _ref1, _ref2, _ref3;

        if (!stack.length) {
          return;
        }
        word = (_ref1 = stack[stack.length - 1]) != null ? _ref1.words.shift() : void 0;
        arg = (_ref2 = stack[stack.length - 1]) != null ? _ref2.arg : void 0;
        if (word === void 0) {
          stack.pop();
        } else if (word === 'NL') {
          return send();
        } else if (m = word.match(/^([ABCD])([0-9]*)$/)) {
          result.push(value(m[1], m[2], arg));
        } else if (m = word.match(/^([A-Z][A-Z0-9]*)(\/([ABCD]?)([0-9]*))?$/)) {
          if (stack.length < 10 && (words = (_ref3 = defn[m[1]]) != null ? _ref3.slice(0) : void 0)) {
            if (m[2]) {
              arg = value(m[3], m[4], arg);
            }
            stack.push({
              call: word,
              arg: arg,
              words: words
            });
          }
        } else {
          result.push(word);
        }
        if (stack.length) {
          return next();
        } else {
          return send();
        }
      };
      if (words.length) {
        return next();
      }
    })([
      {
        call: call,
        arg: arg,
        words: words
      }
    ], []);
  };

  report = function(defn) {
    var key, word, words, _i, _len;

    report = [];
    for (key in defn) {
      words = defn[key];
      report.push("<li class=\"" + key + "\"><span>" + key + "</span>");
      for (_i = 0, _len = words.length; _i < _len; _i++) {
        word = words[_i];
        report.push("<span>" + word + "</span>");
      }
    }
    return report.join(' ');
  };

  if (typeof module !== "undefined" && module !== null) {
    module.exports = {
      parse: parse,
      apply: apply
    };
  }

  emit = function($item, item) {
    return $item.append("<div style=\"width:93%; background:#eee; padding:.8em; margin-bottom:5px;\">\n  <p class=\"report\" style=\"white-space: pre; white-space: pre-wrap;\">" + item.text + "</p>\n  <p class=\"caption\">status here</p>\n</div>");
  };

  bind = function($item, item) {
    var $page, defn, frame, host, oldresponse, progress, rcvd, response, rrept, sent, socket, srept, startTicking, tick, timer, trigger;

    defn = parse(item.text);
    $page = $item.parents('.page:first');
    host = $page.data('site') || location.host;
    if (host === 'origin' || host === 'local') {
      host = location.host;
    }
    socket = new WebSocket("ws://" + host + "/plugin/txtzyme");
    sent = rcvd = 0;
    srept = rrept = "";
    oldresponse = response = [];
    if (item.text.replace(/_.*?_/g, '').match(/p/)) {
      $item.addClass('sequence-source');
      $item.get(0).getSequenceData = function() {
        if (response.length) {
          return response;
        } else {
          return oldresponse;
        }
      };
    }
    frame = 0;
    tick = function() {
      var arg, now;

      frame = frame % 40 + 1;
      now = new Date();
      arg = [frame, now.getSeconds(), now.getMinutes(), now.getHours()];
      trigger('FRAME', arg);
      if (frame !== 1) {
        return;
      }
      arg.shift();
      trigger('SECOND', arg);
      if (arg[0]) {
        return;
      }
      trigger('MINUTE', arg);
      if (arg[1]) {
        return;
      }
      trigger('HOUR', arg);
      if (arg[2]) {
        return;
      }
      return trigger('DAY', arg);
    };
    timer = null;
    startTicking = function() {
      timer = setInterval(tick, 25);
      return tick();
    };
    setTimeout(startTicking, 1000 - (new Date().getMilliseconds()));
    $item.dblclick(function() {
      clearInterval(timer);
      if (socket != null) {
        socket.close();
      }
      return wiki.textEditor($item, item);
    });
    $(".main").on('thumb', function(evt, thumb) {
      return trigger('THUMB', thumb);
    });
    $item.delegate('.rcvd', 'click', function() {
      return wiki.dialog("Txtzyme Responses", "<pre>" + (response.join("\n")));
    });
    trigger = function(word, arg) {
      if (arg == null) {
        arg = 0;
      }
      return apply(defn, word, arg, function(message, stack, done) {
        var call, todo, words;

        todo = ((function() {
          var _i, _len, _ref, _results;

          _results = [];
          for (_i = 0, _len = stack.length; _i < _len; _i++) {
            _ref = stack[_i], call = _ref.call, words = _ref.words;
            _results.push("" + call + " " + (words.join(' ')) + "<br>");
          }
          return _results;
        })()).join('');
        $item.find('p.report').html("" + todo + message);
        if (socket) {
          progress((srept = " " + (++sent) + " sent ") + rrept);
          if (response.length) {
            window.dialog.html("<pre>" + (response.join("\n")));
            $item.trigger('sequence', [response]);
          }
          response = [];
          socket.send(message);
        }
        return setTimeout(done, 200);
      });
    };
    progress = function(m) {
      return $item.find('p.caption').html(m);
    };
    socket.onopen = function() {
      progress("opened");
      return trigger('OPEN');
    };
    socket.onmessage = function(e) {
      var line, _i, _len, _ref, _results;

      _ref = e.data.split(/\r?\n/);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        line = _ref[_i];
        if (line) {
          progress(srept + (rrept = "<span class=rcvd> " + (++rcvd) + " rcvd " + line + " </span>"));
          _results.push(response.push(line));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    return socket.onclose = function() {
      progress("closed");
      return socket = null;
    };
  };

  if (typeof window !== "undefined" && window !== null) {
    window.plugins.txtzyme = {
      emit: emit,
      bind: bind
    };
  }

}).call(this);

},{}],14:[function(require,module,exports){
// Generated by CoffeeScript 1.6.2
(function() {
  var apply, bind, emit, format, months, parse, show, span, spans;

  months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  spans = ['EARLY', 'LATE', 'DECADE', 'DAY', 'MONTH', 'YEAR'];

  span = function(result, span) {
    var m;

    if ((m = spans.indexOf(result.span)) < 0) {
      return result.span = span;
    } else if ((spans.indexOf(span)) < m) {
      return result.span = span;
    }
  };

  parse = function(text) {
    var i, line, m, result, rows, word, words, _i, _j, _len, _len1, _ref;

    rows = [];
    _ref = text.split(/\n/);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      line = _ref[_i];
      result = {};
      words = line.match(/\S+/g);
      for (i = _j = 0, _len1 = words.length; _j < _len1; i = ++_j) {
        word = words[i];
        if (word.match(/^\d\d\d\d$/)) {
          result.year = +word;
          span(result, 'YEAR');
        } else if (m = word.match(/^(\d0)S$/)) {
          result.year = +m[1] + 1900;
          span(result, 'DECADE');
        } else if ((m = spans.indexOf(word)) >= 0) {
          result.span = spans[m];
        } else if ((m = months.indexOf(word.slice(0, 3))) >= 0) {
          result.month = m + 1;
          span(result, 'MONTH');
        } else if (m = word.match(/^([1-3]?[0-9])$/)) {
          result.day = +m[1];
          span(result, 'DAY');
        } else {
          result.label = words.slice(i, 1000).join(' ');
          break;
        }
      }
      rows.push(result);
    }
    return rows;
  };

  apply = function(input, output, date, rows) {
    var result, row, _i, _len, _ref, _ref1;

    result = [];
    for (_i = 0, _len = rows.length; _i < _len; _i++) {
      row = rows[_i];
      if (((_ref = input[row.label]) != null ? _ref.date : void 0) != null) {
        date = input[row.label].date;
      }
      if (((_ref1 = output[row.label]) != null ? _ref1.date : void 0) != null) {
        date = output[row.label].date;
      }
      if (row.year != null) {
        date = new Date(row.year, 1 - 1);
      }
      if (row.month != null) {
        date = new Date(date.getYear() + 1900, row.month - 1);
      }
      if (row.day != null) {
        date = new Date(date.getYear() + 1900, date.getMonth(), row.day);
      }
      if (row.label != null) {
        output[row.label] = {
          date: date
        };
        if (row.span != null) {
          output[row.label].span = row.span;
        }
      }
      row.date = date;
      result.push(row);
    }
    return result;
  };

  show = function(date, span) {
    switch (span) {
      case 'YEAR':
        return date.getFullYear();
      case 'DECADE':
        return "" + (date.getFullYear()) + "'S";
      case 'EARLY':
        return "Early " + (date.getFullYear()) + "'S";
      case 'LATE':
        return "Late " + (date.getFullYear()) + "'S";
      case 'MONTH':
        return "" + months[date.getMonth()] + " " + (date.getFullYear());
      default:
        return "" + (date.getDate()) + " " + months[date.getMonth()] + " " + (date.getFullYear());
    }
  };

  format = function(rows) {
    var row, _i, _len, _results;

    _results = [];
    for (_i = 0, _len = rows.length; _i < _len; _i++) {
      row = rows[_i];
      _results.push("<tr><td>" + (show(row.date, row.span)) + "<td>" + row.label);
    }
    return _results;
  };

  if (typeof module !== "undefined" && module !== null) {
    module.exports = {
      parse: parse,
      apply: apply,
      format: format
    };
  }

  emit = function(div, item) {
    var results, rows;

    rows = parse(item.text);
    wiki.log('calendar rows', rows);
    results = apply({}, {}, new Date(), rows);
    wiki.log('calendar results', results);
    return div.append("<table style=\"width:100%; background:#eee; padding:.8em; margin-bottom:5px;\">" + (format(results).join('')) + "</table>");
  };

  bind = function(div, item) {
    return div.dblclick(function() {
      return wiki.textEditor(div, item);
    });
  };

  if (typeof window !== "undefined" && window !== null) {
    window.plugins.calendar = {
      emit: emit,
      bind: bind
    };
  }

}).call(this);

},{}],16:[function(require,module,exports){
// Generated by CoffeeScript 1.6.2
(function() {
  var constructor, listItemHtml, pageBundle;

  listItemHtml = function(slug, page) {
    return "<li><a class=\"internal\" href=\"#\" title=\"local\" data-page-name=\"" + slug + "\" data-site=\"local\">" + page.title + "</a> <button class=\"delete\">✕</button></li>";
  };

  pageBundle = function() {
    var bundle, i, length, slug, _i;

    bundle = {};
    length = localStorage.length;
    for (i = _i = 0; 0 <= length ? _i < length : _i > length; i = 0 <= length ? ++_i : --_i) {
      slug = localStorage.key(i);
      bundle[slug] = JSON.parse(localStorage.getItem(slug));
    }
    return bundle;
  };

  constructor = function($, dependencies) {
    var bind, emit, localStorage;

    if (dependencies == null) {
      dependencies = {};
    }
    localStorage = dependencies.localStorage || window.localStorage;
    emit = function($div, item) {
      var i, page, slug, ul, _i, _ref;

      if (localStorage.length === 0) {
        $div.append('<ul><p>empty</p></ul>');
        return;
      }
      $div.append(ul = $('<ul />'));
      for (i = _i = 0, _ref = localStorage.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        slug = localStorage.key(i);
        page = JSON.parse(localStorage.getItem(slug));
        ul.append(listItemHtml(slug, page));
      }
      if (item.submit != null) {
        return ul.append("<button class=\"submit\">Submit Changes</button>");
      }
    };
    bind = function($div, item) {
      $div.on('click', '.delete', function() {
        var slug;

        slug = $(this).siblings('a.internal').data('pageName');
        localStorage.removeItem(slug);
        return emit($div.empty(), item);
      });
      $div.on('click', '.submit', function() {
        return $.ajax({
          type: 'PUT',
          url: "/submit",
          data: {
            'bundle': JSON.stringify(pageBundle())
          },
          success: function(citation, textStatus, jqXHR) {
            var before, beforeElement, itemElement, pageElement;

            wiki.log("ajax submit success", citation, textStatus, jqXHR);
            if (!(citation.type && citation.site)) {
              throw new Exception("Incomplete Submission");
            }
            pageElement = $div.parents('.page:first');
            itemElement = $("<div />", {
              "class": "item " + citation.type
            }).data('item', citation).attr('data-id', citation.id);
            itemElement.data('pageElement', pageElement);
            pageElement.find(".story").append(itemElement);
            wiki.doPlugin(itemElement, citation);
            beforeElement = itemElement.prev('.item');
            before = wiki.getItem(beforeElement);
            return wiki.pageHandler.put(pageElement, {
              item: citation,
              id: citation.id,
              type: "add",
              after: before != null ? before.id : void 0
            });
          },
          error: function(xhr, type, msg) {
            return wiki.log("ajax error callback", type, msg);
          }
        });
      });
      return $div.dblclick(function() {
        var bundle, count;

        bundle = pageBundle();
        count = _.size(bundle);
        return wiki.dialog("JSON bundle for " + count + " pages", $('<pre/>').text(JSON.stringify(bundle, null, 2)));
      });
    };
    return {
      emit: emit,
      bind: bind
    };
  };

  wiki.registerPlugin('changes', constructor);

  if (typeof module !== "undefined" && module !== null) {
    module.exports = constructor;
  }

}).call(this);

},{}],18:[function(require,module,exports){
// Generated by CoffeeScript 1.6.2
(function() {
  window.plugins.efficiency = {
    emit: function(div, item) {
      div.addClass('data');
      $('<p />').addClass('readout').appendTo(div).text("0%");
      return $('<p />').html(wiki.resolveLinks(item.text || 'efficiency')).appendTo(div);
    },
    bind: function(div, item) {
      var calculate, calculatePercentage, display, getImageData, lastThumb, locate;

      lastThumb = null;
      div.find('p:first').dblclick(function(e) {
        return wiki.dialog("JSON for " + item.text, $('<pre/>').text("something good"));
      });
      div.find('p:last').dblclick(function() {
        return wiki.textEditor(div, item);
      });
      locate = function() {
        var idx;

        idx = $('.item').index(div);
        return $(".item:lt(" + idx + ")").filter('.image:last');
      };
      calculate = function(div) {
        return calculatePercentage(getImageData(div));
      };
      display = function(value) {
        return div.find('p:first').text("" + (value.toFixed(1)) + "%");
      };
      getImageData = function(div) {
        var c, d, h, imageData, img, w;

        img = new Image;
        img.src = $(div).data('item').url;
        w = img.width;
        h = img.height;
        c = $('<canvas id="myCanvas" width="#{w}" height="#{h}">');
        d = c.get(0).getContext("2d");
        d.drawImage(img, 0, 0);
        imageData = d.getImageData(0, 0, w, h);
        return imageData.data;
      };
      calculatePercentage = function(data) {
        var lumas;

        lumas = window.plugins.efficiency.getGrayLumaFromRGBT(data);
        return window.plugins.efficiency.calculateStrategy_GrayBinary(lumas);
      };
      return display(calculate(locate()));
    },
    getGrayLumaFromRGBT: function(rgbt) {
      var B, G, R, i, lumas, numPix, _i, _ref;

      numPix = rgbt.length / 4;
      lumas = [];
      for (i = _i = 0, _ref = numPix - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        R = rgbt[i * 4 + 0];
        G = rgbt[i * 4 + 1];
        B = rgbt[i * 4 + 2];
        lumas[i] = (0.30 * R) + (0.60 * G) + (0.10 * B);
      }
      return lumas;
    },
    calculateStrategy_GrayBinary: function(lumas) {
      var l, lumaHighCount, lumaLowCount, lumaMax, lumaMid, lumaMin, numLumas, percentage, _i, _len;

      lumaMin = Math.min.apply(Math, lumas);
      lumaMax = Math.max.apply(Math, lumas);
      numLumas = lumas.length;
      lumaMid = (lumaMax - lumaMin) / 2.0 + lumaMin;
      lumaLowCount = 0;
      lumaHighCount = 0;
      for (_i = 0, _len = lumas.length; _i < _len; _i++) {
        l = lumas[_i];
        if (l <= lumaMid) {
          lumaLowCount++;
        } else {
          lumaHighCount++;
        }
      }
      percentage = lumaHighCount / numLumas * 100;
      return percentage;
    },
    calculateStrategy_GrayIterativeClustering: function(lumas) {
      var MAX_TRIES, THRESHOLD_CONVERGENCE_GOAL, high, l, low, lumaAvgHigh, lumaAvgLow, lumaHighCount, lumaHighTotal, lumaLowCount, lumaLowTotal, lumaMax, lumaMin, lumasHigh, lumasLow, numLumas, numPix, numTries, percentage, threshold, thresholdDiff, thresholdInitial, _i, _j, _k, _len, _len1, _len2;

      THRESHOLD_CONVERGENCE_GOAL = 5;
      MAX_TRIES = 10;
      lumaMin = Math.min.apply(Math, lumas);
      lumaMax = Math.max.apply(Math, lumas);
      numLumas = lumas.length;
      numPix = numLumas;
      thresholdInitial = (lumaMax - lumaMin) / 2 + lumaMin;
      threshold = thresholdInitial;
      lumaHighCount = 0;
      numTries = 0;
      while (numTries < MAX_TRIES) {
        numTries++;
        lumasLow = [];
        lumasHigh = [];
        lumaLowCount = 0;
        lumaHighCount = 0;
        for (_i = 0, _len = lumas.length; _i < _len; _i++) {
          l = lumas[_i];
          if (l <= threshold) {
            lumasLow.push(l);
            lumaLowCount++;
          } else {
            if (l !== NaN) {
              lumasHigh.push(l);
              lumaHighCount++;
            }
          }
        }
        lumaLowTotal = 0;
        for (_j = 0, _len1 = lumasLow.length; _j < _len1; _j++) {
          low = lumasLow[_j];
          if (!isNaN(low)) {
            lumaLowTotal += low;
          } else {

          }
        }
        lumaAvgLow = 0;
        if (lumaLowCount > 0) {
          lumaAvgLow = lumaLowTotal / lumaLowCount;
        }
        lumaHighTotal = 0;
        for (_k = 0, _len2 = lumasHigh.length; _k < _len2; _k++) {
          high = lumasHigh[_k];
          if (!isNaN(high)) {
            lumaHighTotal += high;
          } else {

          }
        }
        lumaAvgHigh = 0;
        if (lumaHighCount > 0) {
          lumaAvgHigh = lumaHighTotal / lumaHighCount;
        }
        threshold = (lumaAvgHigh - lumaAvgLow) / 2 + lumaAvgLow;
        thresholdDiff = Math.abs(threshold - thresholdInitial);
        if (thresholdDiff <= THRESHOLD_CONVERGENCE_GOAL || numTries > MAX_TRIES) {
          break;
        } else {
          thresholdInitial = threshold;
        }
      }
      percentage = lumaHighCount / numPix * 100;
      if (percentage > 100.0) {
        percentage = 100;
      }
      return percentage;
    }
  };

}).call(this);

},{}],20:[function(require,module,exports){
// Generated by CoffeeScript 1.6.2
(function() {
  var advance, bind, emit, enumerate, explain, hours, human, intervals, months, parse, primAdvance, soon, summarize, wdays,
    __slice = [].slice;

  enumerate = function() {
    var i, k, keys, obj, _i, _len;

    keys = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    obj = {
      keys: keys
    };
    for (i = _i = 0, _len = keys.length; _i < _len; i = ++_i) {
      k = keys[i];
      obj[k] = i + 1;
    }
    return obj;
  };

  intervals = enumerate('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

  hours = enumerate('MIDNIGHT', 'MORNING', 'NOON', 'EVENING');

  wdays = enumerate('SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');

  months = enumerate('JANUARY', 'FEBUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER');

  parse = function(text) {
    var e, issue, schedule, word, _i, _len, _ref;

    schedule = [];
    issue = null;
    _ref = text.match(/\S+/g) || [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      word = _ref[_i];
      try {
        if (intervals[word]) {
          schedule.push(issue = {
            interval: word,
            recipients: [],
            offsets: []
          });
        } else if (months[word] || wdays[word] || hours[word]) {
          issue.offsets.push(word);
        } else if (word.match(/@/)) {
          issue.recipients.push(word);
        } else {
          schedule.push({
            trouble: word
          });
        }
      } catch (_error) {
        e = _error;
        schedule.push({
          trouble: e.message
        });
      }
    }
    return schedule;
  };

  human = function(msecs) {
    var days, hrs, mins, secs, weeks, years;

    if ((secs = msecs / 1000) < 2) {
      return "" + (Math.floor(msecs)) + " milliseconds";
    }
    if ((mins = secs / 60) < 2) {
      return "" + (Math.floor(secs)) + " seconds";
    }
    if ((hrs = mins / 60) < 2) {
      return "" + (Math.floor(mins)) + " minutes";
    }
    if ((days = hrs / 24) < 2) {
      return "" + (Math.floor(hrs)) + " hours";
    }
    if ((weeks = days / 7) < 2) {
      return "" + (Math.floor(days)) + " days";
    }
    if ((months = days / 30.5) < 2) {
      return "" + (Math.floor(weeks)) + " weeks";
    }
    if ((years = days / 365) < 2) {
      return "" + (Math.floor(months)) + " months";
    }
    return "" + (Math.floor(years)) + " years";
  };

  primAdvance = function(date, issue, count) {
    var d, h, m, offset, result, y, _i, _len, _ref, _ref1, _ref2;

    _ref = [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()], y = _ref[0], m = _ref[1], d = _ref[2], h = _ref[3];
    result = (function() {
      switch (issue.interval) {
        case 'HOURLY':
          return new Date(y, m, d, h + count);
        case 'DAILY':
          return new Date(y, m, d + count);
        case 'WEEKLY':
          return new Date(y, m, d - date.getDay() + 7 * count);
        case 'MONTHLY':
          return new Date(y, m + count);
        case 'YEARLY':
          return new Date(y + count, 0);
      }
    })();
    _ref1 = issue.offsets;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      offset = _ref1[_i];
      _ref2 = [result.getFullYear(), result.getMonth(), result.getDate(), result.getHours()], y = _ref2[0], m = _ref2[1], d = _ref2[2], h = _ref2[3];
      result = months[offset] ? new Date(y, months[offset] - 1, d, h) : wdays[offset] ? new Date(y, m, d + (7 - result.getDay() + wdays[offset] - 1) % 7, h) : hours[offset] ? new Date(y, m, d, h + 6 * (hours[offset] - 1)) : void 0;
    }
    return result;
  };

  advance = function(date, issue, count) {
    var prim;

    prim = primAdvance(date, issue, 0);
    if (prim > date) {
      return primAdvance(date, issue, count - 1);
    } else {
      return primAdvance(date, issue, count);
    }
  };

  soon = function(issue) {
    var next, now;

    now = new Date();
    next = advance(now, issue, 1);
    return human(next.getTime() - now.getTime());
  };

  explain = function(issue) {
    if (issue.interval != null) {
      return "reporting " + issue.interval + " for " + issue.recipients.length + " recipients in " + (soon(issue));
    } else if (issue.trouble != null) {
      return "don't expect: <span class=error>" + issue.trouble + "</span>";
    } else {
      return "trouble";
    }
  };

  if (typeof module !== "undefined" && module !== null) {
    module.exports = {
      intervals: intervals,
      parse: parse,
      explain: explain,
      advance: advance
    };
  }

  summarize = function(schedule) {
    var issue;

    return ((function() {
      var _i, _len, _results;

      _results = [];
      for (_i = 0, _len = schedule.length; _i < _len; _i++) {
        issue = schedule[_i];
        _results.push(explain(issue));
      }
      return _results;
    })()).join("<br>");
  };

  emit = function($item, item) {
    return $item.append($("<p>" + (summarize(parse(item.text))) + "</p>"));
  };

  bind = function($item, item) {
    return $item.dblclick(function() {
      return wiki.textEditor($item, item);
    });
  };

  if (typeof window !== "undefined" && window !== null) {
    window.plugins.report = {
      emit: emit,
      bind: bind
    };
  }

}).call(this);

},{}],21:[function(require,module,exports){
(function() {
  module.exports = function(page) {
    var p1, p2, synopsis;

    synopsis = page.synopsis;
    if ((page != null) && (page.story != null)) {
      p1 = page.story[0];
      p2 = page.story[1];
      if (p1 && p1.type === 'paragraph') {
        synopsis || (synopsis = p1.text);
      }
      if (p2 && p2.type === 'paragraph') {
        synopsis || (synopsis = p2.text);
      }
      if (p1 && (p1.text != null)) {
        synopsis || (synopsis = p1.text);
      }
      if (p2 && (p2.text != null)) {
        synopsis || (synopsis = p2.text);
      }
      synopsis || (synopsis = (page.story != null) && ("A page with " + page.story.length + " items."));
    } else {
      synopsis = 'A page with no story.';
    }
    return synopsis;
  };

}).call(this);


},{}],22:[function(require,module,exports){
(function() {
  var util;

  module.exports = wiki.util = util = {};

  util.symbols = {
    create: '☼',
    add: '+',
    edit: '✎',
    fork: '⚑',
    move: '↕',
    remove: '✕'
  };

  util.randomByte = function() {
    return (((1 + Math.random()) * 0x100) | 0).toString(16).substring(1);
  };

  util.randomBytes = function(n) {
    return ((function() {
      var _i, _results;

      _results = [];
      for (_i = 1; 1 <= n ? _i <= n : _i >= n; 1 <= n ? _i++ : _i--) {
        _results.push(util.randomByte());
      }
      return _results;
    })()).join('');
  };

  util.formatTime = function(time) {
    var am, d, h, mi, mo;

    d = new Date((time > 10000000000 ? time : time * 1000));
    mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    h = d.getHours();
    am = h < 12 ? 'AM' : 'PM';
    h = h === 0 ? 12 : h > 12 ? h - 12 : h;
    mi = (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
    return "" + h + ":" + mi + " " + am + "<br>" + (d.getDate()) + " " + mo + " " + (d.getFullYear());
  };

  util.formatDate = function(msSinceEpoch) {
    var am, d, day, h, mi, mo, sec, wk, yr;

    d = new Date(msSinceEpoch);
    wk = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    day = d.getDate();
    yr = d.getFullYear();
    h = d.getHours();
    am = h < 12 ? 'AM' : 'PM';
    h = h === 0 ? 12 : h > 12 ? h - 12 : h;
    mi = (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
    sec = (d.getSeconds() < 10 ? "0" : "") + d.getSeconds();
    return "" + wk + " " + mo + " " + day + ", " + yr + "<br>" + h + ":" + mi + ":" + sec + " " + am;
  };

  util.formatElapsedTime = function(msSinceEpoch) {
    var days, hrs, mins, months, msecs, secs, weeks, years;

    msecs = new Date().getTime() - msSinceEpoch;
    if ((secs = msecs / 1000) < 2) {
      return "" + (Math.floor(msecs)) + " milliseconds ago";
    }
    if ((mins = secs / 60) < 2) {
      return "" + (Math.floor(secs)) + " seconds ago";
    }
    if ((hrs = mins / 60) < 2) {
      return "" + (Math.floor(mins)) + " minutes ago";
    }
    if ((days = hrs / 24) < 2) {
      return "" + (Math.floor(hrs)) + " hours ago";
    }
    if ((weeks = days / 7) < 2) {
      return "" + (Math.floor(days)) + " days ago";
    }
    if ((months = days / 31) < 2) {
      return "" + (Math.floor(weeks)) + " weeks ago";
    }
    if ((years = days / 365) < 2) {
      return "" + (Math.floor(months)) + " months ago";
    }
    return "" + (Math.floor(years)) + " years ago";
  };

  util.emptyPage = function() {
    return {
      title: 'empty',
      story: [],
      journal: []
    };
  };

  util.getSelectionPos = function(jQueryElement) {
    var el, iePos, sel;

    el = jQueryElement.get(0);
    if (document.selection) {
      el.focus();
      sel = document.selection.createRange();
      sel.moveStart('character', -el.value.length);
      iePos = sel.text.length;
      return {
        start: iePos,
        end: iePos
      };
    } else {
      return {
        start: el.selectionStart,
        end: el.selectionEnd
      };
    }
  };

  util.setCaretPosition = function(jQueryElement, caretPos) {
    var el, range;

    el = jQueryElement.get(0);
    if (el != null) {
      if (el.createTextRange) {
        range = el.createTextRange();
        range.move("character", caretPos);
        range.select();
      } else {
        el.setSelectionRange(caretPos, caretPos);
      }
      return el.focus();
    }
  };

}).call(this);


},{}],23:[function(require,module,exports){
(function() {
  var active, findScrollContainer, scrollTo;

  module.exports = active = {};

  active.scrollContainer = void 0;

  findScrollContainer = function() {
    var scrolled;

    scrolled = $("body, html").filter(function() {
      return $(this).scrollLeft() > 0;
    });
    if (scrolled.length > 0) {
      return scrolled;
    } else {
      return $("body, html").scrollLeft(12).filter(function() {
        return $(this).scrollLeft() > 0;
      }).scrollTop(0);
    }
  };

  scrollTo = function(el) {
    var bodyWidth, contentWidth, maxX, minX, target, width, _ref;

    if ((_ref = active.scrollContainer) == null) {
      active.scrollContainer = findScrollContainer();
    }
    bodyWidth = $("body").width();
    minX = active.scrollContainer.scrollLeft();
    maxX = minX + bodyWidth;
    target = el.position().left;
    width = el.outerWidth(true);
    contentWidth = $(".page").outerWidth(true) * $(".page").size();
    if (target < minX) {
      return active.scrollContainer.animate({
        scrollLeft: target
      });
    } else if (target + width > maxX) {
      return active.scrollContainer.animate({
        scrollLeft: target - (bodyWidth - width)
      });
    } else if (maxX > $(".pages").outerWidth()) {
      return active.scrollContainer.animate({
        scrollLeft: Math.min(target, contentWidth - bodyWidth)
      });
    }
  };

  active.set = function(el) {
    el = $(el);
    $(".active").removeClass("active");
    return scrollTo(el.addClass("active"));
  };

}).call(this);


},{}],25:[function(require,module,exports){
(function() {
  var simulatePageFound, simulatePageNotFound;

  simulatePageNotFound = function() {
    var xhrFor404;

    xhrFor404 = {
      status: 404
    };
    return sinon.stub(jQuery, "ajax").yieldsTo('error', xhrFor404);
  };

  simulatePageFound = function(pageToReturn) {
    if (pageToReturn == null) {
      pageToReturn = {};
    }
    return sinon.stub(jQuery, "ajax").yieldsTo('success', pageToReturn);
  };

  module.exports = {
    simulatePageNotFound: simulatePageNotFound,
    simulatePageFound: simulatePageFound
  };

}).call(this);


},{}],28:[function(require,module,exports){
(function() {
  var create;

  create = function(revIndex, data) {
    var afterIndex, editIndex, itemId, items, journal, journalEntry, removeIndex, revJournal, revStory, revStoryIds, revTitle, storyItem, _i, _j, _k, _len, _len1, _len2, _ref;

    journal = data.journal;
    revTitle = data.title;
    revStory = [];
    revJournal = journal.slice(0, +(+revIndex) + 1 || 9e9);
    for (_i = 0, _len = revJournal.length; _i < _len; _i++) {
      journalEntry = revJournal[_i];
      revStoryIds = revStory.map(function(storyItem) {
        return storyItem.id;
      });
      switch (journalEntry.type) {
        case 'create':
          if (journalEntry.item.title != null) {
            revTitle = journalEntry.item.title;
            revStory = journalEntry.item.story || [];
          }
          break;
        case 'add':
          if ((afterIndex = revStoryIds.indexOf(journalEntry.after)) !== -1) {
            revStory.splice(afterIndex + 1, 0, journalEntry.item);
          } else {
            revStory.push(journalEntry.item);
          }
          break;
        case 'edit':
          if ((editIndex = revStoryIds.indexOf(journalEntry.id)) !== -1) {
            revStory.splice(editIndex, 1, journalEntry.item);
          } else {
            revStory.push(journalEntry.item);
          }
          break;
        case 'move':
          items = {};
          for (_j = 0, _len1 = revStory.length; _j < _len1; _j++) {
            storyItem = revStory[_j];
            items[storyItem.id] = storyItem;
          }
          revStory = [];
          _ref = journalEntry.order;
          for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
            itemId = _ref[_k];
            if (items[itemId] != null) {
              revStory.push(items[itemId]);
            }
          }
          break;
        case 'remove':
          if ((removeIndex = revStoryIds.indexOf(journalEntry.id)) !== -1) {
            revStory.splice(removeIndex, 1);
          }
      }
    }
    return {
      story: revStory,
      journal: revJournal,
      title: revTitle
    };
  };

  exports.create = create;

}).call(this);


},{}],24:[function(require,module,exports){
(function() {
  var addToJournal, pageFromLocalStorage, pageHandler, pushToLocal, pushToServer, recursiveGet, revision, state, util;

  util = require('./util.coffee');

  state = require('./state.coffee');

  revision = require('./revision.coffee');

  addToJournal = require('./addToJournal.coffee');

  module.exports = pageHandler = {};

  pageFromLocalStorage = function(slug) {
    var json;

    if (json = localStorage[slug]) {
      return JSON.parse(json);
    } else {
      return void 0;
    }
  };

  recursiveGet = function(_arg) {
    var localContext, localPage, pageInformation, rev, site, slug, url, whenGotten, whenNotGotten;

    pageInformation = _arg.pageInformation, whenGotten = _arg.whenGotten, whenNotGotten = _arg.whenNotGotten, localContext = _arg.localContext;
    slug = pageInformation.slug, rev = pageInformation.rev, site = pageInformation.site;
    if (site) {
      localContext = [];
    } else {
      site = localContext.shift();
    }
    if (site === 'view') {
      site = null;
    }
    if (site != null) {
      if (site === 'local') {
        if (localPage = pageFromLocalStorage(pageInformation.slug)) {
          return whenGotten(localPage, 'local');
        } else {
          return whenNotGotten();
        }
      } else {
        if (site === 'origin') {
          url = "/" + slug + ".json";
        } else {
          url = "http://" + site + "/" + slug + ".json";
        }
      }
    } else {
      url = "/" + slug + ".json";
    }
    return $.ajax({
      type: 'GET',
      dataType: 'json',
      url: url + ("?random=" + (util.randomBytes(4))),
      success: function(page) {
        if (rev) {
          page = revision.create(rev, page);
        }
        return whenGotten(page, site);
      },
      error: function(xhr, type, msg) {
        var report;

        if ((xhr.status !== 404) && (xhr.status !== 0)) {
          wiki.log('pageHandler.get error', xhr, xhr.status, type, msg);
          report = {
            'title': "" + xhr.status + " " + msg,
            'story': [
              {
                'type': 'paragraph',
                'id': '928739187243',
                'text': "<pre>" + xhr.responseText
              }
            ]
          };
          return whenGotten(report, 'local');
        }
        if (localContext.length > 0) {
          return recursiveGet({
            pageInformation: pageInformation,
            whenGotten: whenGotten,
            whenNotGotten: whenNotGotten,
            localContext: localContext
          });
        } else {
          return whenNotGotten();
        }
      }
    });
  };

  pageHandler.get = function(_arg) {
    var localPage, pageInformation, whenGotten, whenNotGotten;

    whenGotten = _arg.whenGotten, whenNotGotten = _arg.whenNotGotten, pageInformation = _arg.pageInformation;
    if (!pageInformation.site) {
      if (localPage = pageFromLocalStorage(pageInformation.slug)) {
        if (pageInformation.rev) {
          localPage = revision.create(pageInformation.rev, localPage);
        }
        return whenGotten(localPage, 'local');
      }
    }
    if (!pageHandler.context.length) {
      pageHandler.context = ['view'];
    }
    return recursiveGet({
      pageInformation: pageInformation,
      whenGotten: whenGotten,
      whenNotGotten: whenNotGotten,
      localContext: _.clone(pageHandler.context)
    });
  };

  pageHandler.context = [];

  pushToLocal = function(pageElement, pagePutInfo, action) {
    var page, site;

    page = pageFromLocalStorage(pagePutInfo.slug);
    if (action.type === 'create') {
      page = {
        title: action.item.title
      };
    }
    page || (page = pageElement.data("data"));
    if (page.journal == null) {
      page.journal = [];
    }
    if ((site = action['fork']) != null) {
      page.journal = page.journal.concat({
        'type': 'fork',
        'site': site
      });
      delete action['fork'];
    }
    page.journal = page.journal.concat(action);
    page.story = $(pageElement).find(".item").map(function() {
      return $(this).data("item");
    }).get();
    localStorage[pagePutInfo.slug] = JSON.stringify(page);
    return addToJournal(pageElement.find('.journal'), action);
  };

  pushToServer = function(pageElement, pagePutInfo, action) {
    return $.ajax({
      type: 'PUT',
      url: "/page/" + pagePutInfo.slug + "/action",
      data: {
        'action': JSON.stringify(action)
      },
      success: function() {
        addToJournal(pageElement.find('.journal'), action);
        if (action.type === 'fork') {
          localStorage.removeItem(pageElement.attr('id'));
          return state.setUrl;
        }
      },
      error: function(xhr, type, msg) {
        return wiki.log("pageHandler.put ajax error callback", type, msg);
      }
    });
  };

  pageHandler.put = function(pageElement, action) {
    var checkedSite, forkFrom, pagePutInfo;

    checkedSite = function() {
      var site;

      switch (site = pageElement.data('site')) {
        case 'origin':
        case 'local':
        case 'view':
          return null;
        case location.host:
          return null;
        default:
          return site;
      }
    };
    pagePutInfo = {
      slug: pageElement.attr('id').split('_rev')[0],
      rev: pageElement.attr('id').split('_rev')[1],
      site: checkedSite(),
      local: pageElement.hasClass('local')
    };
    forkFrom = pagePutInfo.site;
    wiki.log('pageHandler.put', action, pagePutInfo);
    if (wiki.useLocalStorage()) {
      if (pagePutInfo.site != null) {
        wiki.log('remote => local');
      } else if (!pagePutInfo.local) {
        wiki.log('origin => local');
        action.site = forkFrom = location.host;
      }
    }
    action.date = (new Date()).getTime();
    if (action.site === 'origin') {
      delete action.site;
    }
    if (forkFrom) {
      pageElement.find('h1 img').attr('src', '/favicon.png');
      pageElement.find('h1 a').attr('href', '/');
      pageElement.data('site', null);
      pageElement.removeClass('remote');
      state.setUrl();
      if (action.type !== 'fork') {
        action.fork = forkFrom;
        addToJournal(pageElement.find('.journal'), {
          type: 'fork',
          site: forkFrom,
          date: action.date
        });
      }
    }
    if (wiki.useLocalStorage() || pagePutInfo.site === 'local') {
      pushToLocal(pageElement, pagePutInfo, action);
      return pageElement.addClass("local");
    } else {
      return pushToServer(pageElement, pagePutInfo, action);
    }
  };

}).call(this);


},{"./util.coffee":22,"./state.coffee":31,"./revision.coffee":28,"./addToJournal.coffee":32}],26:[function(require,module,exports){
(function() {
  var addToJournal, buildPageHeader, createFactory, emitHeader, emitTwins, handleDragging, initAddButton, initDragging, neighborhood, pageHandler, plugin, refresh, renderPageIntoPageElement, state, util, wiki,
    __slice = [].slice;

  util = require('./util.coffee');

  pageHandler = require('./pageHandler.coffee');

  plugin = require('./plugin.coffee');

  state = require('./state.coffee');

  neighborhood = require('./neighborhood.coffee');

  addToJournal = require('./addToJournal.coffee');

  wiki = require('./wiki.coffee');

  handleDragging = function(evt, ui) {
    var action, before, beforeElement, destinationPageElement, equals, item, itemElement, moveFromPage, moveToPage, moveWithinPage, order, sourcePageElement, sourceSite, thisPageElement;

    itemElement = ui.item;
    item = wiki.getItem(itemElement);
    thisPageElement = $(this).parents('.page:first');
    sourcePageElement = itemElement.data('pageElement');
    sourceSite = sourcePageElement.data('site');
    destinationPageElement = itemElement.parents('.page:first');
    equals = function(a, b) {
      return a && b && a.get(0) === b.get(0);
    };
    moveWithinPage = !sourcePageElement || equals(sourcePageElement, destinationPageElement);
    moveFromPage = !moveWithinPage && equals(thisPageElement, sourcePageElement);
    moveToPage = !moveWithinPage && equals(thisPageElement, destinationPageElement);
    if (moveFromPage) {
      if (sourcePageElement.hasClass('ghost') || sourcePageElement.attr('id') === destinationPageElement.attr('id')) {
        return;
      }
    }
    action = moveWithinPage ? (order = $(this).children().map(function(_, value) {
      return $(value).attr('data-id');
    }).get(), {
      type: 'move',
      order: order
    }) : moveFromPage ? (wiki.log('drag from', sourcePageElement.find('h1').text()), {
      type: 'remove'
    }) : moveToPage ? (itemElement.data('pageElement', thisPageElement), beforeElement = itemElement.prev('.item'), before = wiki.getItem(beforeElement), {
      type: 'add',
      item: item,
      after: before != null ? before.id : void 0
    }) : void 0;
    action.id = item.id;
    return pageHandler.put(thisPageElement, action);
  };

  initDragging = function($page) {
    var $story;

    $story = $page.find('.story');
    return $story.sortable({
      connectWith: '.page .story'
    }).on("sortupdate", handleDragging);
  };

  initAddButton = function($page) {
    return $page.find(".add-factory").live("click", function(evt) {
      if ($page.hasClass('ghost')) {
        return;
      }
      evt.preventDefault();
      return createFactory($page);
    });
  };

  createFactory = function($page) {
    var before, beforeElement, item, itemElement;

    item = {
      type: "factory",
      id: util.randomBytes(8)
    };
    itemElement = $("<div />", {
      "class": "item factory"
    }).data('item', item).attr('data-id', item.id);
    itemElement.data('pageElement', $page);
    $page.find(".story").append(itemElement);
    plugin["do"](itemElement, item);
    beforeElement = itemElement.prev('.item');
    before = wiki.getItem(beforeElement);
    return pageHandler.put($page, {
      item: item,
      id: item.id,
      type: "add",
      after: before != null ? before.id : void 0
    });
  };

  buildPageHeader = function(_arg) {
    var favicon_src, header_href, page, tooltip;

    page = _arg.page, tooltip = _arg.tooltip, header_href = _arg.header_href, favicon_src = _arg.favicon_src;
    if (page.plugin) {
      tooltip += "\n" + page.plugin + " plugin";
    }
    return "<h1 title=\"" + tooltip + "\"><a href=\"" + header_href + "\"><img src=\"" + favicon_src + "\" height=\"32px\" class=\"favicon\"></a> " + page.title + "</h1>";
  };

  emitHeader = function($header, $page, page) {
    var date, header, isRemotePage, pageHeader, rev, site, viewHere;

    site = $page.data('site');
    isRemotePage = (site != null) && site !== 'local' && site !== 'origin' && site !== 'view';
    header = '';
    viewHere = wiki.asSlug(page.title) === 'welcome-visitors' ? "" : "/view/" + (wiki.asSlug(page.title));
    pageHeader = isRemotePage ? buildPageHeader({
      tooltip: site,
      header_href: "//" + site + "/view/welcome-visitors" + viewHere,
      favicon_src: "http://" + site + "/favicon.png",
      page: page
    }) : buildPageHeader({
      tooltip: location.host,
      header_href: "/view/welcome-visitors" + viewHere,
      favicon_src: "/favicon.png",
      page: page
    });
    $header.append(pageHeader);
    if (!isRemotePage) {
      $('img.favicon', $page).error(function(e) {
        return plugin.get('favicon', function(favicon) {
          return favicon.create();
        });
      });
    }
    if ($page.attr('id').match(/_rev/)) {
      rev = page.journal.length - 1;
      date = page.journal[rev].date;
      $page.addClass('ghost').data('rev', rev);
      return $header.append($("<h2 class=\"revision\">\n  <span>\n    " + (date != null ? util.formatDate(date) : "Revision " + rev) + "\n  </span>\n</h2>"));
    }
  };

  emitTwins = wiki.emitTwins = function($page) {
    var actions, bin, bins, flags, i, info, item, legend, page, remoteSite, site, slug, twins, viewing, _i, _len, _ref, _ref1, _ref2, _ref3;

    page = $page.data('data');
    site = $page.data('site') || window.location.host;
    if (site === 'view' || site === 'origin') {
      site = window.location.host;
    }
    slug = wiki.asSlug(page.title);
    if (((actions = (_ref = page.journal) != null ? _ref.length : void 0) != null) && ((viewing = (_ref1 = page.journal[actions - 1]) != null ? _ref1.date : void 0) != null)) {
      viewing = Math.floor(viewing / 1000) * 1000;
      bins = {
        newer: [],
        same: [],
        older: []
      };
      _ref2 = wiki.neighborhood;
      for (remoteSite in _ref2) {
        info = _ref2[remoteSite];
        if (remoteSite !== site && (info.sitemap != null)) {
          _ref3 = info.sitemap;
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            item = _ref3[_i];
            if (item.slug === slug) {
              bin = item.date > viewing ? bins.newer : item.date < viewing ? bins.older : bins.same;
              bin.push({
                remoteSite: remoteSite,
                item: item
              });
            }
          }
        }
      }
      twins = [];
      for (legend in bins) {
        bin = bins[legend];
        if (!bin.length) {
          continue;
        }
        bin.sort(function(a, b) {
          return a.item.date < b.item.date;
        });
        flags = (function() {
          var _j, _len1, _ref4, _results;

          _results = [];
          for (i = _j = 0, _len1 = bin.length; _j < _len1; i = ++_j) {
            _ref4 = bin[i], remoteSite = _ref4.remoteSite, item = _ref4.item;
            if (i >= 8) {
              break;
            }
            _results.push("<img class=\"remote\"\nsrc=\"http://" + remoteSite + "/favicon.png\"\ndata-slug=\"" + slug + "\"\ndata-site=\"" + remoteSite + "\"\ntitle=\"" + remoteSite + "\">");
          }
          return _results;
        })();
        twins.push("" + (flags.join('&nbsp;')) + " " + legend);
      }
      if (twins) {
        return $page.find('.twins').html("<p>" + (twins.join(", ")) + "</p>");
      }
    }
  };

  renderPageIntoPageElement = function(pageData, $page, siteFound) {
    var $footer, $header, $journal, $story, $twins, action, addContext, context, emitItem, page, site, slug, _i, _j, _len, _len1, _ref, _ref1, _ref2;

    page = $.extend(util.emptyPage(), pageData);
    $page.data("data", page);
    slug = $page.attr('id');
    site = $page.data('site');
    context = ['view'];
    if (site != null) {
      context.push(site);
    }
    addContext = function(site) {
      if ((site != null) && !_.include(context, site)) {
        return context.push(site);
      }
    };
    _ref = page.journal.slice(0).reverse();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      action = _ref[_i];
      addContext(action.site);
    }
    wiki.resolutionContext = context;
    $page.empty();
    _ref1 = ['twins', 'header', 'story', 'journal', 'footer'].map(function(className) {
      return $("<div />").addClass(className).appendTo($page);
    }), $twins = _ref1[0], $header = _ref1[1], $story = _ref1[2], $journal = _ref1[3], $footer = _ref1[4];
    emitHeader($header, $page, page);
    emitItem = function(i) {
      var $item, item;

      if (i >= page.story.length) {
        return;
      }
      item = page.story[i];
      if ((item != null ? item.type : void 0) && (item != null ? item.id : void 0)) {
        $item = $("<div class=\"item " + item.type + "\" data-id=\"" + item.id + "\">");
        $story.append($item);
        return plugin["do"]($item, item, function() {
          return emitItem(i + 1);
        });
      } else {
        $story.append($("<div><p class=\"error\">Can't make sense of story[" + i + "]</p></div>"));
        return emitItem(i + 1);
      }
    };
    emitItem(0);
    _ref2 = page.journal;
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      action = _ref2[_j];
      addToJournal($journal, action);
    }
    emitTwins($page);
    $journal.append("<div class=\"control-buttons\">\n  <a href=\"#\" class=\"button fork-page\" title=\"fork this page\">" + util.symbols['fork'] + "</a>\n  <a href=\"#\" class=\"button add-factory\" title=\"add paragraph\">" + util.symbols['add'] + "</a>\n</div>");
    return $footer.append("<a id=\"license\" href=\"http://creativecommons.org/licenses/by-sa/3.0/\">CC BY-SA 3.0</a> .\n<a class=\"show-page-source\" href=\"/" + slug + ".json?random=" + (util.randomBytes(4)) + "\" title=\"source\">JSON</a> .\n<a href= \"//" + (siteFound || location.host) + "/" + slug + ".html\">" + (siteFound || location.host) + "</a>");
  };

  wiki.buildPage = function(data, siteFound, $page) {
    if (siteFound === 'local') {
      $page.addClass('local');
    } else if (siteFound) {
      if (siteFound === window.location.host) {
        siteFound = 'origin';
      }
      if (siteFound !== 'view' && siteFound !== 'origin') {
        $page.addClass('remote');
      }
      $page.data('site', siteFound);
    }
    if (data.plugin != null) {
      $page.addClass('plugin');
    }
    renderPageIntoPageElement(data, $page, siteFound);
    state.setUrl();
    initDragging($page);
    initAddButton($page);
    return $page;
  };

  module.exports = refresh = wiki.refresh = function() {
    var $page, createGhostPage, pageInformation, registerNeighbors, rev, slug, whenGotten, _ref;

    $page = $(this);
    _ref = $page.attr('id').split('_rev'), slug = _ref[0], rev = _ref[1];
    pageInformation = {
      slug: slug,
      rev: rev,
      site: $page.data('site')
    };
    createGhostPage = function() {
      var heading, hits, info, page, result, site, title, _ref1, _ref2;

      title = $("a[href=\"/" + slug + ".html\"]:last").text() || slug;
      page = {
        'title': title,
        'story': [
          {
            'id': util.randomBytes(8),
            'type': 'future',
            'text': 'We could not find this page.',
            'title': title
          }
        ]
      };
      heading = {
        'type': 'paragraph',
        'id': util.randomBytes(8),
        'text': "We did find the page in your current neighborhood."
      };
      hits = [];
      _ref1 = wiki.neighborhood;
      for (site in _ref1) {
        info = _ref1[site];
        if (info.sitemap != null) {
          result = _.find(info.sitemap, function(each) {
            return each.slug === slug;
          });
          if (result != null) {
            hits.push({
              "type": "reference",
              "id": util.randomBytes(8),
              "site": site,
              "slug": slug,
              "title": result.title || slug,
              "text": result.synopsis || ''
            });
          }
        }
      }
      if (hits.length > 0) {
        (_ref2 = page.story).push.apply(_ref2, [heading].concat(__slice.call(hits)));
        page.story[0].text = 'We could not find this page in the expected context.';
      }
      return wiki.buildPage(page, void 0, $page).addClass('ghost');
    };
    registerNeighbors = function(data, site) {
      var action, item, _i, _j, _len, _len1, _ref1, _ref2, _results;

      if (_.include(['local', 'origin', 'view', null, void 0], site)) {
        neighborhood.registerNeighbor(location.host);
      } else {
        neighborhood.registerNeighbor(site);
      }
      _ref1 = data.story || [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        item = _ref1[_i];
        if (item.site != null) {
          neighborhood.registerNeighbor(item.site);
        }
      }
      _ref2 = data.journal || [];
      _results = [];
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        action = _ref2[_j];
        if (action.site != null) {
          _results.push(neighborhood.registerNeighbor(action.site));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    whenGotten = function(data, siteFound) {
      wiki.buildPage(data, siteFound, $page);
      return registerNeighbors(data, siteFound);
    };
    return pageHandler.get({
      whenGotten: whenGotten,
      whenNotGotten: createGhostPage,
      pageInformation: pageInformation
    });
  };

}).call(this);


},{"./util.coffee":22,"./pageHandler.coffee":24,"./plugin.coffee":27,"./state.coffee":31,"./neighborhood.coffee":29,"./addToJournal.coffee":32,"./wiki.coffee":2}],27:[function(require,module,exports){
(function() {
  var getScript, plugin, scripts, util;

  util = require('./util.coffee');

  module.exports = plugin = {};

  scripts = {};

  getScript = wiki.getScript = function(url, callback) {
    if (callback == null) {
      callback = function() {};
    }
    if (scripts[url] != null) {
      return callback();
    } else {
      return $.getScript(url).done(function() {
        scripts[url] = true;
        return callback();
      }).fail(function() {
        return callback();
      });
    }
  };

  plugin.get = wiki.getPlugin = function(name, callback) {
    if (window.plugins[name]) {
      return callback(window.plugins[name]);
    }
    return getScript("/plugins/" + name + "/" + name + ".js", function() {
      if (window.plugins[name]) {
        return callback(window.plugins[name]);
      }
      return getScript("/plugins/" + name + ".js", function() {
        return callback(window.plugins[name]);
      });
    });
  };

  plugin["do"] = wiki.doPlugin = function(div, item, done) {
    var error;

    if (done == null) {
      done = function() {};
    }
    error = function(ex) {
      var errorElement;

      errorElement = $("<div />").addClass('error');
      errorElement.text(ex.toString());
      return div.append(errorElement);
    };
    div.data('pageElement', div.parents(".page"));
    div.data('item', item);
    return plugin.get(item.type, function(script) {
      var err;

      try {
        if (script == null) {
          throw TypeError("Can't find plugin for '" + item.type + "'");
        }
        if (script.emit.length > 2) {
          return script.emit(div, item, function() {
            script.bind(div, item);
            return done();
          });
        } else {
          script.emit(div, item);
          script.bind(div, item);
          return done();
        }
      } catch (_error) {
        err = _error;
        wiki.log('plugin error', err);
        error(err);
        return done();
      }
    });
  };

  wiki.registerPlugin = function(pluginName, pluginFn) {
    return window.plugins[pluginName] = pluginFn($);
  };

  window.plugins = {
    paragraph: {
      emit: function(div, item) {
        var text, _i, _len, _ref, _results;

        _ref = item.text.split(/\n\n+/);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          text = _ref[_i];
          if (text.match(/\S/)) {
            _results.push(div.append("<p>" + (wiki.resolveLinks(text)) + "</p>"));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      },
      bind: function(div, item) {
        return div.dblclick(function() {
          return wiki.textEditor(div, item, null, true);
        });
      }
    },
    image: {
      emit: function(div, item) {
        item.text || (item.text = item.caption);
        return div.append("<img class=thumbnail src=\"" + item.url + "\"> <p>" + (wiki.resolveLinks(item.text)) + "</p>");
      },
      bind: function(div, item) {
        div.dblclick(function() {
          return wiki.textEditor(div, item);
        });
        return div.find('img').dblclick(function() {
          return wiki.dialog(item.text, this);
        });
      }
    },
    future: {
      emit: function(div, item) {
        var info, _i, _len, _ref, _results;

        div.append("" + item.text + "<br><br><button class=\"create\">create</button> new blank page");
        if (((info = wiki.neighborhood[location.host]) != null) && (info.sitemap != null)) {
          _ref = info.sitemap;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            item = _ref[_i];
            if (item.slug.match(/-template$/)) {
              _results.push(div.append("<br><button class=\"create\" data-slug=" + item.slug + ">create</button> from " + (wiki.resolveLinks("[[" + item.title + "]]"))));
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        }
      },
      bind: function(div, item) {}
    }
  };

}).call(this);


},{"./util.coffee":22}],29:[function(require,module,exports){
(function() {
  var active, createSearch, neighborhood, nextAvailableFetch, nextFetchInterval, populateSiteInfoFor, util, _ref,
    __hasProp = {}.hasOwnProperty;

  active = require('./active.coffee');

  util = require('./util.coffee');

  createSearch = require('./search.coffee');

  module.exports = neighborhood = {};

  if ((_ref = wiki.neighborhood) == null) {
    wiki.neighborhood = {};
  }

  nextAvailableFetch = 0;

  nextFetchInterval = 2000;

  populateSiteInfoFor = function(site, neighborInfo) {
    var fetchMap, now, transition;

    if (neighborInfo.sitemapRequestInflight) {
      return;
    }
    neighborInfo.sitemapRequestInflight = true;
    transition = function(site, from, to) {
      return $(".neighbor[data-site=\"" + site + "\"]").find('div').removeClass(from).addClass(to);
    };
    fetchMap = function() {
      var request, sitemapUrl;

      sitemapUrl = "http://" + site + "/system/sitemap.json";
      transition(site, 'wait', 'fetch');
      request = $.ajax({
        type: 'GET',
        dataType: 'json',
        url: sitemapUrl
      });
      return request.always(function() {
        return neighborInfo.sitemapRequestInflight = false;
      }).done(function(data) {
        neighborInfo.sitemap = data;
        transition(site, 'fetch', 'done');
        return $('body').trigger('new-neighbor-done', site);
      }).fail(function(data) {
        return transition(site, 'fetch', 'fail');
      });
    };
    now = Date.now();
    if (now > nextAvailableFetch) {
      nextAvailableFetch = now + nextFetchInterval;
      return setTimeout(fetchMap, 100);
    } else {
      setTimeout(fetchMap, nextAvailableFetch - now);
      return nextAvailableFetch += nextFetchInterval;
    }
  };

  wiki.registerNeighbor = neighborhood.registerNeighbor = function(site) {
    var neighborInfo;

    if (wiki.neighborhood[site] != null) {
      return;
    }
    neighborInfo = {};
    wiki.neighborhood[site] = neighborInfo;
    populateSiteInfoFor(site, neighborInfo);
    return $('body').trigger('new-neighbor', site);
  };

  neighborhood.listNeighbors = function() {
    return _.keys(wiki.neighborhood);
  };

  neighborhood.search = function(searchQuery) {
    var finds, match, matchingPages, neighborInfo, neighborSite, sitemap, start, tally, tick, _ref1;

    finds = [];
    tally = {};
    tick = function(key) {
      if (tally[key] != null) {
        return tally[key]++;
      } else {
        return tally[key] = 1;
      }
    };
    match = function(key, text) {
      var hit;

      hit = (text != null) && text.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0;
      if (hit) {
        tick(key);
      }
      return hit;
    };
    start = Date.now();
    _ref1 = wiki.neighborhood;
    for (neighborSite in _ref1) {
      if (!__hasProp.call(_ref1, neighborSite)) continue;
      neighborInfo = _ref1[neighborSite];
      sitemap = neighborInfo.sitemap;
      if (sitemap != null) {
        tick('sites');
      }
      matchingPages = _.each(sitemap, function(page) {
        tick('pages');
        if (!(match('title', page.title) || match('text', page.synopsis) || match('slug', page.slug))) {
          return;
        }
        tick('finds');
        return finds.push({
          page: page,
          site: neighborSite,
          rank: 1
        });
      });
    }
    tally['msec'] = Date.now() - start;
    return {
      finds: finds,
      tally: tally
    };
  };

  $(function() {
    var $neighborhood, flag, search;

    $neighborhood = $('.neighborhood');
    flag = function(site) {
      return "<span class=\"neighbor\" data-site=\"" + site + "\">\n  <div class=\"wait\">\n    <img src=\"http://" + site + "/favicon.png\" title=\"" + site + "\">\n  </div>\n</span>";
    };
    $('body').on('new-neighbor', function(e, site) {
      return $neighborhood.append(flag(site));
    }).delegate('.neighbor img', 'click', function(e) {
      return wiki.doInternalLink('welcome-visitors', null, this.title);
    });
    search = createSearch({
      neighborhood: neighborhood
    });
    return $('input.search').on('keypress', function(e) {
      var searchQuery;

      if (e.keyCode !== 13) {
        return;
      }
      searchQuery = $(this).val();
      search.performSearch(searchQuery);
      return $(this).val("");
    });
  });

}).call(this);


},{"./active.coffee":23,"./util.coffee":22,"./search.coffee":30}],30:[function(require,module,exports){
(function() {
  var active, createSearch, util;

  util = require('./util.coffee');

  active = require('./active.coffee');

  createSearch = function(_arg) {
    var neighborhood, performSearch;

    neighborhood = _arg.neighborhood;
    performSearch = function(searchQuery) {
      var $searchResultPage, explanatoryPara, result, searchResultPageData, searchResultReferences, searchResults, tally;

      searchResults = neighborhood.search(searchQuery);
      tally = searchResults.tally;
      explanatoryPara = {
        type: 'paragraph',
        id: util.randomBytes(8),
        text: "String '" + searchQuery + "' found on " + (tally.finds || 'none') + " of " + (tally.pages || 'no') + " pages from " + (tally.sites || 'no') + " sites.\nText matched on " + (tally.title || 'no') + " titles, " + (tally.text || 'no') + " paragraphs, and " + (tally.slug || 'no') + " slugs.\nElapsed time " + tally.msec + " milliseconds."
      };
      searchResultReferences = (function() {
        var _i, _len, _ref, _results;

        _ref = searchResults.finds;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          result = _ref[_i];
          _results.push({
            "type": "reference",
            "id": util.randomBytes(8),
            "site": result.site,
            "slug": result.page.slug,
            "title": result.page.title,
            "text": result.page.synopsis || ''
          });
        }
        return _results;
      })();
      searchResultPageData = {
        title: "Search Results",
        story: [explanatoryPara].concat(searchResultReferences)
      };
      $searchResultPage = wiki.createPage('search-results').addClass('ghost');
      $searchResultPage.appendTo($('.main'));
      wiki.buildPage(searchResultPageData, null, $searchResultPage);
      return active.set($('.page').last());
    };
    return {
      performSearch: performSearch
    };
  };

  module.exports = createSearch;

}).call(this);


},{"./util.coffee":22,"./active.coffee":23}],31:[function(require,module,exports){
(function() {
  var active, state,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  active = require('./active.coffee');

  module.exports = state = {};

  state.pagesInDom = function() {
    return $.makeArray($(".page").map(function(_, el) {
      return el.id;
    }));
  };

  state.urlPages = function() {
    var i;

    return ((function() {
      var _i, _len, _ref, _results;

      _ref = $(location).attr('pathname').split('/');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i += 2) {
        i = _ref[_i];
        _results.push(i);
      }
      return _results;
    })()).slice(1);
  };

  state.locsInDom = function() {
    return $.makeArray($(".page").map(function(_, el) {
      return $(el).data('site') || 'view';
    }));
  };

  state.urlLocs = function() {
    var j, _i, _len, _ref, _results;

    _ref = $(location).attr('pathname').split('/').slice(1);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i += 2) {
      j = _ref[_i];
      _results.push(j);
    }
    return _results;
  };

  state.setUrl = function() {
    var idx, locs, page, pages, url, _ref;

    document.title = (_ref = $('.page:last').data('data')) != null ? _ref.title : void 0;
    if (history && history.pushState) {
      locs = state.locsInDom();
      pages = state.pagesInDom();
      url = ((function() {
        var _i, _len, _results;

        _results = [];
        for (idx = _i = 0, _len = pages.length; _i < _len; idx = ++_i) {
          page = pages[idx];
          _results.push("/" + ((locs != null ? locs[idx] : void 0) || 'view') + "/" + page);
        }
        return _results;
      })()).join('');
      if (url !== $(location).attr('pathname')) {
        return history.pushState(null, null, url);
      }
    }
  };

  state.show = function(e) {
    var idx, name, newLocs, newPages, old, oldLocs, oldPages, previous, _i, _len, _ref;

    oldPages = state.pagesInDom();
    newPages = state.urlPages();
    oldLocs = state.locsInDom();
    newLocs = state.urlLocs();
    if (!location.pathname || location.pathname === '/') {
      return;
    }
    previous = $('.page').eq(0);
    for (idx = _i = 0, _len = newPages.length; _i < _len; idx = ++_i) {
      name = newPages[idx];
      if (name !== oldPages[idx]) {
        old = $('.page').eq(idx);
        if (old) {
          old.remove();
        }
        wiki.createPage(name, newLocs[idx]).insertAfter(previous).each(wiki.refresh);
      }
      previous = $('.page').eq(idx);
    }
    previous.nextAll().remove();
    active.set($('.page').last());
    return document.title = (_ref = $('.page:last').data('data')) != null ? _ref.title : void 0;
  };

  state.first = function() {
    var firstUrlLocs, firstUrlPages, idx, oldPages, urlPage, _i, _len, _results;

    state.setUrl();
    firstUrlPages = state.urlPages();
    firstUrlLocs = state.urlLocs();
    oldPages = state.pagesInDom();
    _results = [];
    for (idx = _i = 0, _len = firstUrlPages.length; _i < _len; idx = ++_i) {
      urlPage = firstUrlPages[idx];
      if (__indexOf.call(oldPages, urlPage) < 0) {
        if (urlPage !== '') {
          _results.push(wiki.createPage(urlPage, firstUrlLocs[idx]).appendTo('.main'));
        } else {
          _results.push(void 0);
        }
      }
    }
    return _results;
  };

}).call(this);


},{"./active.coffee":23}],32:[function(require,module,exports){
(function() {
  var util;

  util = require('./util.coffee');

  module.exports = function(journalElement, action) {
    var actionElement, actionTitle, controls, pageElement, prev;

    pageElement = journalElement.parents('.page:first');
    if (action.type === 'edit') {
      prev = journalElement.find(".edit[data-id=" + (action.id || 0) + "]");
    }
    actionTitle = action.type;
    if (action.date != null) {
      actionTitle += " " + (util.formatElapsedTime(action.date));
    }
    actionElement = $("<a href=\"#\" /> ").addClass("action").addClass(action.type).text(util.symbols[action.type]).attr('title', actionTitle).attr('data-id', action.id || "0").data('action', action);
    controls = journalElement.children('.control-buttons');
    if (controls.length > 0) {
      actionElement.insertBefore(controls);
    } else {
      actionElement.appendTo(journalElement);
    }
    if (action.type === 'fork' && (action.site != null)) {
      return actionElement.css("background-image", "url(//" + action.site + "/favicon.png)").attr("href", "//" + action.site + "/" + (pageElement.attr('id')) + ".html").data("site", action.site).data("slug", pageElement.attr('id'));
    }
  };

}).call(this);


},{"./util.coffee":22}]},{},[1,13,15,17,19,11])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9ucm4vZ2l0aHViL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC90ZXN0Y2xpZW50LmNvZmZlZSIsIi9ob21lL25ybi9naXRodWIvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L3BsdWdpbnMvdHh0enltZS90ZXN0LmNvZmZlZSIsIi9ob21lL25ybi9naXRodWIvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L3BsdWdpbnMvY2FsZW5kYXIvdGVzdC5jb2ZmZWUiLCIvaG9tZS9ucm4vZ2l0aHViL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9wbHVnaW5zL2NoYW5nZXMvdGVzdC5jb2ZmZWUiLCIvaG9tZS9ucm4vZ2l0aHViL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9wbHVnaW5zL2VmZmljaWVuY3kvdGVzdC5jb2ZmZWUiLCIvaG9tZS9ucm4vZ2l0aHViL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9wbHVnaW5zL3JlcG9ydC90ZXN0LmNvZmZlZSIsIi9ob21lL25ybi9naXRodWIvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi93aWtpLmNvZmZlZSIsIi9ob21lL25ybi9naXRodWIvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L3Rlc3QvdXRpbC5jb2ZmZWUiLCIvaG9tZS9ucm4vZ2l0aHViL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC90ZXN0L2FjdGl2ZS5jb2ZmZWUiLCIvaG9tZS9ucm4vZ2l0aHViL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC90ZXN0L3BhZ2VIYW5kbGVyLmNvZmZlZSIsIi9ob21lL25ybi9naXRodWIvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L3Rlc3QvcmVmcmVzaC5jb2ZmZWUiLCIvaG9tZS9ucm4vZ2l0aHViL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC90ZXN0L3BsdWdpbi5jb2ZmZWUiLCIvaG9tZS9ucm4vZ2l0aHViL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC90ZXN0L3JldmlzaW9uLmNvZmZlZSIsIi9ob21lL25ybi9naXRodWIvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L3Rlc3QvbmVpZ2hib3Job29kLmNvZmZlZSIsIi9ob21lL25ybi9naXRodWIvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L3Rlc3Qvc2VhcmNoLmNvZmZlZSIsIi9ob21lL25ybi9naXRodWIvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L3BsdWdpbnMvdHh0enltZS90eHR6eW1lLmpzIiwiL2hvbWUvbnJuL2dpdGh1Yi9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvcGx1Z2lucy9jYWxlbmRhci9jYWxlbmRhci5qcyIsIi9ob21lL25ybi9naXRodWIvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L3BsdWdpbnMvY2hhbmdlcy9jaGFuZ2VzLmpzIiwiL2hvbWUvbnJuL2dpdGh1Yi9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvcGx1Z2lucy9lZmZpY2llbmN5L2VmZmljaWVuY3kuanMiLCIvaG9tZS9ucm4vZ2l0aHViL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9wbHVnaW5zL3JlcG9ydC9yZXBvcnQuanMiLCIvaG9tZS9ucm4vZ2l0aHViL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvc3lub3BzaXMuY29mZmVlIiwiL2hvbWUvbnJuL2dpdGh1Yi9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL3V0aWwuY29mZmVlIiwiL2hvbWUvbnJuL2dpdGh1Yi9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL2FjdGl2ZS5jb2ZmZWUiLCIvaG9tZS9ucm4vZ2l0aHViL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC90ZXN0L21vY2tTZXJ2ZXIuY29mZmVlIiwiL2hvbWUvbnJuL2dpdGh1Yi9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL3JldmlzaW9uLmNvZmZlZSIsIi9ob21lL25ybi9naXRodWIvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9wYWdlSGFuZGxlci5jb2ZmZWUiLCIvaG9tZS9ucm4vZ2l0aHViL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvcmVmcmVzaC5jb2ZmZWUiLCIvaG9tZS9ucm4vZ2l0aHViL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvcGx1Z2luLmNvZmZlZSIsIi9ob21lL25ybi9naXRodWIvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9uZWlnaGJvcmhvb2QuY29mZmVlIiwiL2hvbWUvbnJuL2dpdGh1Yi9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL3NlYXJjaC5jb2ZmZWUiLCIvaG9tZS9ucm4vZ2l0aHViL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvc3RhdGUuY29mZmVlIiwiL2hvbWUvbnJuL2dpdGh1Yi9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL2FkZFRvSm91cm5hbC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTtDQUFBLENBQUEsR0FBSzs7Q0FBTCxDQUVBLENBQWMsQ0FBZCxFQUFNLENBQVEsWUFBQTs7Q0FGZCxDQUlBLEtBQUEsYUFBQTs7Q0FKQSxDQUtBLEtBQUEsZUFBQTs7Q0FMQSxDQU1BLEtBQUEsb0JBQUE7O0NBTkEsQ0FPQSxLQUFBLGdCQUFBOztDQVBBLENBUUEsS0FBQSxlQUFBOztDQVJBLENBU0EsS0FBQSxpQkFBQTs7Q0FUQSxDQVVBLEtBQUEscUJBQUE7O0NBVkEsQ0FXQSxLQUFBLGVBQUE7O0NBWEEsQ0FhQSxDQUFFLE1BQUE7Q0FDQSxHQUFBLEVBQUEsRUFBQSwwQkFBQTtDQUNNLEVBQU4sRUFBSyxNQUFMO0NBRkYsRUFBRTtD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QUlBLE9BQUEsTUFBQTtDQUpBLENBTTBDLEVBQTFDLEVBQUEsU0FBdUI7Q0FDZixDQUFzQyxFQUFWLEVBQXBDLE9BQUEsRUFBdUIsSUFBdkI7Q0FSRixJQUE2QztDQUgvQyxFQUFtQjtDQUZuQjs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QU8sUUFBQTs7Q0FBUCxDQUVBLENBQWlCLEdBQVgsQ0FBTixFQUFrQixLQUFEO0NBQ2YsT0FBQSwrQ0FBQTs7Q0FBQSxFQUFjLENBQWQsR0FBYyxJQUFkLEVBQWMsQ0FBYztDQUM1QixHQUFBLENBQWlGLENBQVQ7Q0FBeEUsQ0FBMkMsQ0FBcEMsQ0FBUCxFQUFBLFFBQXFCLEVBQU87TUFENUI7Q0FBQSxFQUVjLENBQWQsRUFBb0IsS0FBcEI7Q0FDQSxHQUFBLGVBQUE7Q0FBQSxFQUFnQixDQUFBLEVBQWhCLEtBQUEsTUFBa0I7TUFIbEI7Q0FBQSxDQU1nQixDQUZBLENBQWhCLEVBQTJFLENBQ3RELENBREwsQ0FBQSxFQUFBLEVBQWhCLE1BQWdCO0NBSmhCLEVBU1csQ0FBWCxJQUFBLE1BQXlCLElBQWQ7Q0FDWCxFQUFxQixDQUFyQixFQUFHLEVBQVE7Q0FDVCxLQUFBLEVBQUEsSUFBQSxDQUFhO01BRGY7Q0FHRSxLQUFBLEVBQUEsS0FBYSxDQUFiO01BYkY7Q0FjQSxHQUFBLENBQWtCLENBQVQsZUFBVDtDQUVLLENBQXlCLENBRDVCLENBQzRCLEVBQWEsQ0FEekMsQ0FDNEIsR0FDa0IsRUFGOUMsRUFBQSxHQUFBO01BaEJhO0NBRmpCLEVBRWlCO0NBRmpCIiwic291cmNlc0NvbnRlbnQiOlsibW9jaGEuc2V0dXAoJ2JkZCcpXG5cbndpbmRvdy53aWtpID0gcmVxdWlyZSgnLi9saWIvd2lraS5jb2ZmZWUnKVxuXG5yZXF1aXJlKCcuL3Rlc3QvdXRpbC5jb2ZmZWUnKVxucmVxdWlyZSgnLi90ZXN0L2FjdGl2ZS5jb2ZmZWUnKVxucmVxdWlyZSgnLi90ZXN0L3BhZ2VIYW5kbGVyLmNvZmZlZScpXG5yZXF1aXJlKCcuL3Rlc3QvcmVmcmVzaC5jb2ZmZWUnKVxucmVxdWlyZSgnLi90ZXN0L3BsdWdpbi5jb2ZmZWUnKVxucmVxdWlyZSgnLi90ZXN0L3JldmlzaW9uLmNvZmZlZScpXG5yZXF1aXJlKCcuL3Rlc3QvbmVpZ2hib3Job29kLmNvZmZlZScpXG5yZXF1aXJlKCcuL3Rlc3Qvc2VhcmNoLmNvZmZlZScpXG5cbiQgLT5cbiAgJCgnPGhyPjxoMj4gVGVzdGluZyBhcnRpZmFjdHM6PC9oMj4nKS5hcHBlbmRUbygnYm9keScpXG4gIG1vY2hhLnJ1bigpXG5cbiIsInR4dHp5bWUgPSByZXF1aXJlICcuL3R4dHp5bWUnXG5jb25zb2xlLmxvZyB0eHR6eW1lXG5cbmRlc2NyaWJlICd0eHR6eW1lIHBsdWdpbicsIC0+XG5cblx0ZGVzY3JpYmUgJ3BhcnNpbmcnLCAtPlxuXG5cdFx0aXQgJ3JlY29nbml6ZXMgZGVmaW5pdGlvbnMnLCAtPlxuXHRcdFx0ZXhwZWN0KHR4dHp5bWUucGFyc2UgXCJTRUNPTkQgMW81MDBtMG9cIikudG8uZXFsIHtTRUNPTkQ6IFsnMW81MDBtMG8nXX1cblxuXHRcdGl0ICdoYW5kbGVzIGVtcHR5IGRlZmluaXRpb25zJywgLT5cblx0XHRcdGV4cGVjdCh0eHR6eW1lLnBhcnNlIFwiU0VDT05EXCIpLnRvLmVxbCB7U0VDT05EOiBbXX1cblxuXHRcdGl0ICdyZWNvZ25pemVzIG11bHRpcGxlIGRlZmluaXRpb25zJywgLT5cblx0XHRcdGV4cGVjdCh0eHR6eW1lLnBhcnNlIFwiU0VDT05EIEJMSU5LIEJMSU5LXFxuQkxJTksgMW81MDBtMG81MDBtXCIpLnRvLmVxbCB7U0VDT05EOiBbJ0JMSU5LJywgJ0JMSU5LJ10sIEJMSU5LOiBbJzFvNTAwbTBvNTAwbSddfVxuXG5cdFx0aXQgJ2lnbm9yZXMgYmxhbmsgbGluZSBzZXBhcmF0b3InLCAtPlxuXHRcdFx0ZXhwZWN0KHR4dHp5bWUucGFyc2UgXCJTRUNPTkQgQkxJTksgQkxJTktcXG5cXG5CTElOSyAxbzUwMG0wbzUwMG1cIikudG8uZXFsIHtTRUNPTkQ6IFsnQkxJTksnLCAnQkxJTksnXSwgQkxJTks6IFsnMW81MDBtMG81MDBtJ119XG5cblx0XHRpdCAndHJlYXRlcyBpbmRlbnRlZCBsaW5lcyBhcyBjb250aW51YXRpb25zJywgLT5cblx0XHRcdGV4cGVjdCh0eHR6eW1lLnBhcnNlIFwiU0VDT05EIEJMSU5LXFxuIEJMSU5LXFxuXFxuQkxJTktcXG4gMW81MDBtMG81MDBtXCIpLnRvLmVxbCB7U0VDT05EOiBbJ0JMSU5LJywgJ0JMSU5LJ10sIEJMSU5LOiBbJzFvNTAwbTBvNTAwbSddfVxuXG5cdGRlc2NyaWJlICdhcHBseWluZycsIC0+XG5cblx0XHRhcHBseSA9ICh0ZXh0LCBhcmcpIC0+XG5cdFx0XHRyZXN1bHQgPSBcIlwiXG5cdFx0XHRkZWZuID0gdHh0enltZS5wYXJzZSB0ZXh0XG5cdFx0XHR0eHR6eW1lLmFwcGx5IGRlZm4sICdURVNUJywgYXJnLCAobWVzc2FnZSwgc3RhY2ssIGRvbmUpIC0+XG5cdFx0XHRcdHJlc3VsdCArPSBtZXNzYWdlXG5cdFx0XHRcdGRvbmUoKVxuXHRcdFx0cmVzdWx0XG5cblx0XHRpdCAncmVjb2duaXplcyBkZWZpbml0aW9ucycsIC0+XG5cdFx0XHRleHBlY3QoYXBwbHkgXCJURVNUIDFvXCIpLnRvLmVxbCBcIjFvXFxuXCJcblxuXHRcdGl0ICdjYWxscyBkZWZpbml0aW9ucycsIC0+XG5cdFx0XHRleHBlY3QoYXBwbHkgXCJURVNUIEZPT1xcbkZPTyAwb1wiKS50by5lcWwgXCIwb1xcblwiXG5cblx0XHRpdCAnbWVyZ2VzIHJlc3VsdHMnLCAtPlxuXHRcdFx0ZXhwZWN0KGFwcGx5IFwiVEVTVCAxbyBGT08gMG9cXG5GT08gMTBtXCIpLnRvLmVxbCBcIjFvIDEwbSAwb1xcblwiXG5cblx0XHRpdCAnbGltaXRzIGNhbGwgZGVwdGgnLCAtPlxuXHRcdFx0ZXhwZWN0KGFwcGx5IFwiVEVTVCBvIFRFU1RcIikudG8uZXFsIFwibyBvIG8gbyBvIG8gbyBvIG8gb1xcblwiXG5cblx0XHRpdCAnaGFuZGxlcyBlbXB0eSBkZWZpbml0aW9ucycsIC0+XG5cdFx0XHRleHBlY3QoYXBwbHkgXCJURVNUXCIpLnRvLmVxbCBcIlwiXG5cblx0XHRpdCAnaGFuZGxlcyBtaXNzaW5nIGRlZmluaXRpb25zJywgLT5cblx0XHRcdGV4cGVjdChhcHBseSBcIlRFU1QgRk9PXCIpLnRvLmVxbCBcIlwiXG5cblx0XHRpdCAncmVjb2duaXplcyBOTCBhcyBuZXdsaW5lJywgLT5cblx0XHRcdGV4cGVjdChhcHBseSBcIlRFU1QgMTAwbSBOTCAyMDBtXCIpLnRvLmVxbCBcIjEwMG1cXG4yMDBtXFxuXCJcblxuXHRcdGl0ICdyZWNvZ25pemVzIEEgYXMgYXJndW1lbnQnLCAtPlxuXHRcdFx0ZXhwZWN0KGFwcGx5IFwiVEVTVCBBXCIsIDEyMykudG8uZXFsIFwiMTIzXFxuXCJcblxuXHRcdGl0ICdyZWNvZ25pemVzIEEwLCBBMSwgQTIgYXMgYWNjZXNzb3InLCAtPlxuXHRcdFx0ZXhwZWN0KGFwcGx5IFwiVEVTVCBfIEExIEEwIF9cIiwgWyd6ZXJvJywgJ29uZSddKS50by5lcWwgXCJfIG9uZSB6ZXJvIF9cXG5cIlxuXG5cdFx0aXQgJ3JlY29nbml6ZXMgQjAsIEIxIGFzIGFjY2Vzc29yJywgLT5cblx0XHRcdGV4cGVjdChhcHBseSBcIlRFU1QgQjQgQjMgQjIgQjEgQjBcIiwgNikudG8uZXFsIFwiMCAwIDEgMSAwXFxuXCJcblxuXHRcdGl0ICdyZWNvZ25pemVzIEMwLCBDMSwgQzIgYXMgYWNjZXNzb3InLCAtPlxuXHRcdFx0ZXhwZWN0KGFwcGx5IFwiVEVTVCBDMCBDMSBDMiBDM1wiLCAnQUJDJykudG8uZXFsIFwiNjUgNjYgNjcgMzJcXG5cIlxuXG5cdFx0aXQgJ3JlY29nbml6ZXMgRDAsIEQxLCBEMiBhcyBhY2Nlc3NvcicsIC0+XG5cdFx0XHRleHBlY3QoYXBwbHkgXCJURVNUIEQzIEQyIEQxIEQwXCIsIDEyMykudG8uZXFsIFwiNDggNDkgNTAgNTFcXG5cIlxuXG5cdFx0aXQgJ3JlY29nbml6ZXMgbnVtZXJpYyBwYXJhbWV0ZXInLCAtPlxuXHRcdFx0ZXhwZWN0KGFwcGx5IFwiVEVTVCBJVC8yNVxcbklUIEFcIiwgMTIzKS50by5lcWwgXCIyNVxcblwiXG5cblx0XHRpdCAncmVjb2duaXplcyBhY2Nlc3NvciBhcyBwYXJhbWV0ZXInLCAtPlxuXHRcdFx0ZXhwZWN0KGFwcGx5IFwiVEVTVCBJVC9BMVxcbklUIEFcIiwgWzEyMyw0NTZdKS50by5lcWwgXCI0NTZcXG5cIlxuXG5cbiIsInJlcG9ydCA9IHJlcXVpcmUgJy4vY2FsZW5kYXInXG5cbmRlc2NyaWJlICdjYWxlbmRhciBwbHVnaW4nLCAtPlxuXG5cdGRlc2NyaWJlICdwYXJzaW5nJywgLT5cblxuXHRcdGl0ICdyZWNvZ25pemVzIGRlY2FkZXMnLCAtPlxuXHRcdFx0ZXhwZWN0KHJlcG9ydC5wYXJzZSBcIjE5NjAgREVDQURFXCIpLnRvLmVxbCBbe3llYXI6IDE5NjAsIHNwYW46J0RFQ0FERSd9XVxuXHRcdFx0ZXhwZWN0KHJlcG9ydC5wYXJzZSBcIkRFQ0FERSAxOTYwXCIpLnRvLmVxbCBbe3llYXI6IDE5NjAsIHNwYW46J0RFQ0FERSd9XVxuXHRcdFx0ZXhwZWN0KHJlcG9ydC5wYXJzZSBcIjYwU1wiKS50by5lcWwgW3t5ZWFyOiAxOTYwLCBzcGFuOidERUNBREUnfV1cblxuXHRcdGl0ICdyZWNvZ25pemVzIGhhbGYgZGVjYWRlcycsIC0+XG5cdFx0XHRleHBlY3QocmVwb3J0LnBhcnNlIFwiNjBTIEVBUkxZXCIpLnRvLmVxbCBbe3llYXI6IDE5NjAsIHNwYW46J0VBUkxZJ31dXG5cdFx0XHRleHBlY3QocmVwb3J0LnBhcnNlIFwiRUFSTFkgNjBTXCIpLnRvLmVxbCBbe3llYXI6IDE5NjAsIHNwYW46J0VBUkxZJ31dXG5cdFx0XHRleHBlY3QocmVwb3J0LnBhcnNlIFwiTEFURSA2MFNcIikudG8uZXFsIFt7eWVhcjogMTk2MCwgc3BhbjonTEFURSd9XVxuXG5cdFx0aXQgJ3JlY29nbml6ZXMgeWVhcnMnLCAtPlxuXHRcdFx0ZXhwZWN0KHJlcG9ydC5wYXJzZSBcIjE5NjBcIikudG8uZXFsIFt7eWVhcjogMTk2MCwgc3BhbjonWUVBUid9XVxuXG5cdFx0aXQgJ3JlY29nbml6ZXMgbW9udGhzJywgLT5cblx0XHRcdGV4cGVjdChyZXBvcnQucGFyc2UgXCIxOTYwIE1BUlwiKS50by5lcWwgW3t5ZWFyOiAxOTYwLCBtb250aDozLCBzcGFuOidNT05USCd9XVxuXHRcdFx0ZXhwZWN0KHJlcG9ydC5wYXJzZSBcIk1BUiAxOTYwXCIpLnRvLmVxbCBbe3llYXI6IDE5NjAsIG1vbnRoOjMsIHNwYW46J01PTlRIJ31dXG5cdFx0XHRleHBlY3QocmVwb3J0LnBhcnNlIFwiTUFSQ0ggMTk2MFwiKS50by5lcWwgW3t5ZWFyOiAxOTYwLCBtb250aDozLCBzcGFuOidNT05USCd9XVxuXG5cdFx0aXQgJ3JlY29nbml6ZXMgZGF5cycsIC0+XG5cdFx0XHRleHBlY3QocmVwb3J0LnBhcnNlIFwiTUFSIDUgMTk2MFwiKS50by5lcWwgW3t5ZWFyOiAxOTYwLCBtb250aDozLCBkYXk6IDUsIHNwYW46J0RBWSd9XVxuXHRcdFx0ZXhwZWN0KHJlcG9ydC5wYXJzZSBcIjE5NjAgTUFSIDVcIikudG8uZXFsIFt7eWVhcjogMTk2MCwgbW9udGg6MywgZGF5OiA1LCBzcGFuOidEQVknfV1cblx0XHRcdGV4cGVjdChyZXBvcnQucGFyc2UgXCI1IE1BUiAxOTYwXCIpLnRvLmVxbCBbe3llYXI6IDE5NjAsIG1vbnRoOjMsIGRheTogNSwgc3BhbjonREFZJ31dXG5cblx0XHRpdCAncmVjb2duaXplcyBsYWJlbHMnLCAtPlxuXHRcdFx0ZXhwZWN0KHJlcG9ydC5wYXJzZSBcIldhcmQncyBDSE0gSW50ZXJ2aWV3XCIpLnRvLmVxbCBbe2xhYmVsOiBcIldhcmQncyBDSE0gSW50ZXJ2aWV3XCJ9XVxuXHRcdFx0ZXhwZWN0KHJlcG9ydC5wYXJzZSBcIkFQUklMIDI0IDIwMDYgV2FyZCdzIENITSBJbnRlcnZpZXdcIikudG8uZXFsIFt7eWVhcjogMjAwNiwgbW9udGg6NCwgZGF5OiAyNCwgc3BhbjonREFZJywgbGFiZWw6IFwiV2FyZCdzIENITSBJbnRlcnZpZXdcIn1dXG5cdFx0XHRleHBlY3QocmVwb3J0LnBhcnNlIFwiIEFQUklMICAyNCAgMjAwNlxcdFdhcmQncyAgQ0hNICBJbnRlcnZpZXcgIFwiKS50by5lcWwgW3t5ZWFyOiAyMDA2LCBtb250aDo0LCBkYXk6IDI0LCBzcGFuOidEQVknLCBsYWJlbDogXCJXYXJkJ3MgQ0hNIEludGVydmlld1wifV1cblxuXHRkZXNjcmliZSAnYXBwbHlpbmcnLCAtPlxuXG5cdFx0dG9kYXkgPSBuZXcgRGF0ZSAyMDEzLCAyLTEsIDNcblx0XHRpbnRlcnZpZXcgPSBuZXcgRGF0ZSAyMDA2LCA0LTEsIDI0XG5cblx0XHRpdCAncmVjYWxscyBpbnB1dCcsIC0+XG5cdFx0XHRpbnB1dCA9IHtpbnRlcnZpZXc6IHtkYXRlOiBpbnRlcnZpZXd9fVxuXHRcdFx0b3V0cHV0ID0ge31cblx0XHRcdHJvd3MgPSByZXBvcnQucGFyc2UgXCJpbnRlcnZpZXdcIlxuXHRcdFx0ZXhwZWN0KHJlcG9ydC5hcHBseSBpbnB1dCwgb3V0cHV0LCB0b2RheSwgcm93cykudG8uZXFsIFt7ZGF0ZTogaW50ZXJ2aWV3LCBsYWJlbDonaW50ZXJ2aWV3J31dXG5cblx0XHRpdCAnZXh0ZW5kcyB0b2RheScsIC0+XG5cdFx0XHRpbnB1dCA9IHt9XG5cdFx0XHRvdXRwdXQgPSB7fVxuXHRcdFx0cm93cyA9IHJlcG9ydC5wYXJzZSBcIkFQUklMIDEgQXByaWwgRm9vbHMgRGF5XCJcblx0XHRcdHJlc3VsdHMgPSByZXBvcnQuYXBwbHkgaW5wdXQsIG91dHB1dCwgdG9kYXksIHJvd3Ncblx0XHRcdGV4cGVjdChyZXN1bHRzKS50by5lcWwgW3tkYXRlOiBuZXcgRGF0ZSgyMDEzLCA0LTEpLCBtb250aDogNCwgZGF5OiAxLCBzcGFuOidEQVknLCBsYWJlbDogJ0FwcmlsIEZvb2xzIERheSd9XVxuXHRcdFx0ZXhwZWN0KG91dHB1dCkudG8uZXFsIHsnQXByaWwgRm9vbHMgRGF5Jzoge2RhdGU6IG5ldyBEYXRlKDIwMTMsIDQtMSksIHNwYW46J0RBWSd9fVxuXG5cdFxuXG5cdCMgZGVzY3JpYmUgJ2Zvcm1hdHRpbmcnLCAtPlxuXHQjIFx0aXQgJ3JldHVybnMgYW4gYXJyYXkgb2Ygc3RyaW5ncycsIC0+XG5cdCMgXHRcdHJvd3MgPSByZXBvcnQuZm9ybWF0IHJlcG9ydC5wYXJzZSBcIlwiXG5cdCMgXHRcdGV4cGVjdChyb3dzKS50by5lcWwgW10iLCJwbHVnaW5DdG9yID0gcmVxdWlyZSgnLi9jaGFuZ2VzJylcblxuY3JlYXRlRmFrZUxvY2FsU3RvcmFnZSA9IChpbml0aWFsQ29udGVudHM9e30pLT5cbiAgc3RvcmUgPSBpbml0aWFsQ29udGVudHNcblxuICBrZXlzID0gLT4gKGsgZm9yIGssXyBvZiBzdG9yZSlcbiAgZ2V0U3RvcmVTaXplID0gLT4ga2V5cygpLmxlbmd0aFxuXG4gIGZha2UgPSBcbiAgICBzZXRJdGVtOiAoayx2KS0+IHN0b3JlW2tdID0gdlxuICAgIGdldEl0ZW06IChrKS0+IHN0b3JlW2tdXG4gICAga2V5OiAoaSkgLT4ga2V5cygpW2ldXG4gICAgcmVtb3ZlSXRlbTogKGspIC0+IGRlbGV0ZSBzdG9yZVtrXVxuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggZmFrZSwgJ2xlbmd0aCcsIHsgZ2V0OiBnZXRTdG9yZVNpemUgfSApXG4gIGZha2VcblxuXG5kZXNjcmliZSAnY2hhbmdlcyBwbHVnaW4nLCAtPlxuICBmYWtlTG9jYWxTdG9yZSA9IHVuZGVmaW5lZFxuICAkZGl2ID0gdW5kZWZpbmVkXG4gIFxuICBiZWZvcmVFYWNoIC0+XG4gICAgJGRpdiA9ICQoJzxkaXYvPicpXG4gICAgZmFrZUxvY2FsU3RvcmUgPSBjcmVhdGVGYWtlTG9jYWxTdG9yYWdlKClcblxuICBtYWtlUGx1Z2luID0gLT4gcGx1Z2luQ3RvcigkLHtsb2NhbFN0b3JhZ2U6IGZha2VMb2NhbFN0b3JlfSlcbiAgaW5zdGFsbFBsdWdpbiA9IC0+IFxuICAgIHBsdWdpbiA9IG1ha2VQbHVnaW4oKVxuICAgIHBsdWdpbi5lbWl0KCAkZGl2LCB7fSApXG4gICAgcGx1Z2luLmJpbmQoICRkaXYsIHt9IClcblxuICBleHBlY3ROdW1iZXJPZlBhZ2VzVG9CZSA9IChleHBlY3RlZExlbmd0aCktPlxuICAgIGV4cGVjdCggJGRpdi5maW5kKCdsaSBhJykubGVuZ3RoICkudG8uYmUoZXhwZWN0ZWRMZW5ndGgpXG5cbiAgY2xpY2tEZWxldGVGb3JQYWdlV2l0aFNsdWcgPSAoc2x1ZyktPlxuICAgICRkaXYuZmluZChcImxpIGFbZGF0YS1wYWdlLW5hbWU9JyN7c2x1Z30nXVwiKS5zaWJsaW5ncygnYnV0dG9uJykudHJpZ2dlcignY2xpY2snKVxuXG4gIGl0IFwicmVuZGVycyAnZW1wdHknIHdoZW4gdGhlcmUgYXJlIG5vIGxvY2FsIGNoYW5nZXNcIiwgLT5cbiAgICBpbnN0YWxsUGx1Z2luKClcbiAgICBleHBlY3QoICRkaXYuaHRtbCgpICkudG8uY29udGFpbignZW1wdHknKVxuICAgIGV4cGVjdE51bWJlck9mUGFnZXNUb0JlKDApXG5cbiAgZGVzY3JpYmUgJ3NvbWUgcGFnZXMgaW4gbG9jYWwgc3RvcmUnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIGZha2VMb2NhbFN0b3JlID0gY3JlYXRlRmFrZUxvY2FsU3RvcmFnZShcbiAgICAgICAgcGFnZTE6IEpTT04uc3RyaW5naWZ5KHsgdGl0bGU6IFwiQSBQYWdlXCIgfSksXG4gICAgICAgIHBhZ2UyOiBKU09OLnN0cmluZ2lmeSh7IHRpdGxlOiBcIkFub3RoZXIgUGFnZVwiIH0pLFxuICAgICAgICBwYWdlMzogSlNPTi5zdHJpbmdpZnkoeyB0aXRsZTogXCJQYWdlIHRoZSBUaGlyZFwiIH0pXG4gICAgICApXG5cbiAgICBpdCBcImRvZXNuJ3QgcmVuZGVyICdlbXB0eSdcIiwgLT5cbiAgICAgIGluc3RhbGxQbHVnaW4oKVxuICAgICAgZXhwZWN0KCAkZGl2Lmh0bWwoKSApLm5vdC50by5jb250YWluKCdlbXB0eScpXG5cbiAgICBpdCBcImxpc3RzIGVhY2ggcGFnZSBmb3VuZCBpbiB0aGUgbG9jYWwgc3RvcmVcIiwgLT5cbiAgICAgIGluc3RhbGxQbHVnaW4oKVxuICAgICAgZXhwZWN0TnVtYmVyT2ZQYWdlc1RvQmUoMylcbiAgICAgIGFsbFRpdGxlcyA9ICRkaXYuZmluZCgnbGkgYScpLm1hcCggKF8sYSktPiAkKGEpLmh0bWwoKSApLnRvQXJyYXkoKS5qb2luKCcnKVxuICAgICAgZXhwZWN0KCBhbGxUaXRsZXMgKS50by5jb250YWluKCdBIFBhZ2UnKVxuICAgICAgZXhwZWN0KCBhbGxUaXRsZXMgKS50by5jb250YWluKCdBbm90aGVyIFBhZ2UnKVxuICAgICAgZXhwZWN0KCBhbGxUaXRsZXMgKS50by5jb250YWluKCdQYWdlIHRoZSBUaGlyZCcpXG5cbiAgICBpdCBcInJlbW92ZXMgYSBwYWdlIGZyb20gbG9jYWwgc3RvcmVcIiwgLT5cbiAgICAgIGluc3RhbGxQbHVnaW4oKVxuICAgICAgZXhwZWN0KCBmYWtlTG9jYWxTdG9yZS5nZXRJdGVtKCdwYWdlMicpICkudG8uYmUub2soKVxuICAgICAgY2xpY2tEZWxldGVGb3JQYWdlV2l0aFNsdWcoJ3BhZ2UyJylcbiAgICAgIGV4cGVjdCggZmFrZUxvY2FsU3RvcmUuZ2V0SXRlbSgncGFnZTInKSApLm5vdC50by5iZS5vaygpXG5cblxuICAgIGl0IFwidXBkYXRlcyB0aGUgcGx1Z2luIGRpdiB3aGVuIGEgcGFnZSBpcyByZW1vdmVkXCIsIC0+XG4gICAgICBpbnN0YWxsUGx1Z2luKClcbiAgICAgIGV4cGVjdE51bWJlck9mUGFnZXNUb0JlKDMpXG4gICAgICBjbGlja0RlbGV0ZUZvclBhZ2VXaXRoU2x1ZygncGFnZTInKVxuICAgICAgZXhwZWN0TnVtYmVyT2ZQYWdlc1RvQmUoMilcbiIsInJlcXVpcmUoJy4vZWZmaWNpZW5jeScpXG5cbiMgVE9ETyBmaW5kIGEgYmV0dGVyIHdheSB0byBjb21wYXJlIGFycmF5cyBvZiBmbG9hdHNcbmV4cGVjdEFycmF5c0VxdWFsID0gKGExLCBhMiwgYWNjdXJhY3kgPSAwLjEpIC0+XG5cdCMgd2lraS5sb2cgJ2V4cGVjdEFycmF5c0VxdWFsIGExJywgYTFcblx0IyB3aWtpLmxvZyAnZXhwZWN0QXJyYXlzRXF1YWwgYTInLCBhMlxuXHRleHBlY3QoYTEubGVuZ3RoKS50by5lcXVhbCAoYTIubGVuZ3RoKVxuXHRsZW5ndGggPSBhMS5sZW5ndGhcblx0Zm9yIGkgaW4gWzAuLihsZW5ndGgtMSldXG5cdFx0ZGlmZiA9IE1hdGguYWJzKGExW2ldIC0gYTJbaV0pXG5cdFx0aXNJdEdvb2QgPSAgZGlmZiA8PSBhY2N1cmFjeVxuXHRcdCMgd2lraS5sb2cgJ2V4cGVjdEFycmF5c0VxdWFsIGRpZmY6ICcsIGRpZmZcblx0XHRleHBlY3QoaXNJdEdvb2QpLnRvLmJlLm9rKCk7XG5cdFx0XG5cbmRlc2NyaWJlICdlZmZpY2llbmN5IHBsdWdpbicsIC0+XG5cbiAgaXQgXCJtYXggJiBtaW4gb2YgYXJyYXlcIiwgLT5cbiAgICAgIyB3aWtpLmxvZyAnbWF4ICYgbWluIG9mIGFycmF5J1xuICAgICBleHBlY3QoNikudG8uZXF1YWwgKE1hdGgubWF4IFsxLCAyLCAzLCA0LCA1LCA2XS4uLilcbiAgICAgZXhwZWN0KDEpLnRvLmVxdWFsIChNYXRoLm1pbiBbMSwgMiwgMywgNCwgNSwgNl0uLi4pXG5cbiAgaXQgXCJHZXQgZ3JheSBsdW1hIGZyb20gNC1ieXRlIFJHQlQgZGF0YS4gVHdvIHZhbHVlc1wiLCAtPlxuXHQgIyB3aWtpLmxvZyAnZ2V0IGx1bWEsIHR3byB2YWx1ZXMnXG5cdCByZ2J0ID0gWzEsIDEsIDEsIDEsICAgMiwgMiwgMiwgMl1cblx0IGV4cGVjdGVkTHVtYSA9IFsxLjAsIDIuMF1cblx0IFxuXHQgYWN0dWFsQXJyYXkgPSB3aW5kb3cucGx1Z2lucy5lZmZpY2llbmN5LmdldEdyYXlMdW1hRnJvbVJHQlQocmdidClcblx0IGV4cGVjdGVkID0gSlNPTi5zdHJpbmdpZnkoZXhwZWN0ZWRMdW1hKVxuXHQgYWN0dWFsID0gSlNPTi5zdHJpbmdpZnkoYWN0dWFsQXJyYXkpXG5cdCBleHBlY3RBcnJheXNFcXVhbChleHBlY3RlZEx1bWEsIGFjdHVhbEFycmF5KVxuXHRcbiAgaXQgXCJHZXQgZ3JheSBsdW1hIGZyb20gNC1ieXRlIFJHQlQgZGF0YS4gVGhyZWUgdmFsdWVzXCIsIC0+XG5cdCAjIHdpa2kubG9nICdnZXQgbHVtYSwgdGhyZWUgdmFsdWVzJ1xuXHQgcmdidCA9IFsxLCAxLCAxLCAxLCAgIDIsIDIsIDIsIDIsICAgMywgMywgMywgM11cblx0IGV4cGVjdGVkTHVtYSA9IFsxLjAsIDIuMCwgMy4wXVxuXG5cdCBhY3R1YWxBcnJheSA9IHdpbmRvdy5wbHVnaW5zLmVmZmljaWVuY3kuZ2V0R3JheUx1bWFGcm9tUkdCVChyZ2J0KVxuXHQgZXhwZWN0ZWQgPSBKU09OLnN0cmluZ2lmeShleHBlY3RlZEx1bWEpXG5cdCBhY3R1YWwgPSBKU09OLnN0cmluZ2lmeShhY3R1YWxBcnJheSlcblx0IGV4cGVjdEFycmF5c0VxdWFsKGV4cGVjdGVkTHVtYSwgYWN0dWFsQXJyYXkpXG5cbiAgaXQgXCJjYWxjdWxhdGVTdHJhdGVneV9HcmF5QmluYXJ5IDUwJSBiaW5hcnkgZGF0YVwiLCAtPlxuICAgICAjIHdpa2kubG9nICdjYWxjdWxhdGVTdHJhdGVneV9HcmF5QmluYXJ5IDUwJSBiaW5hcnknXG4gICAgIGx1bWFzID0gWzAsIDAsIDI1NSwgMjU1XVxuICAgICBvdXRwdXQgPSB3aW5kb3cucGx1Z2lucy5lZmZpY2llbmN5LmNhbGN1bGF0ZVN0cmF0ZWd5X0dyYXlCaW5hcnkobHVtYXMpXG4gICAgIGV4cGVjdCgnNTAuMCcpLnRvLmVxdWFsKG91dHB1dC50b0ZpeGVkKDEpKVxuXG4gIGl0IFwiY2FsY3VsYXRlU3RyYXRlZ3lfR3JheUJpbmFyeSA1MCUgbGluZWFyIGRhdGFcIiwgLT5cbiAgICAgIyB3aWtpLmxvZyAnY2FsY3VsYXRlU3RyYXRlZ3lfR3JheUJpbmFyeSA1MCUgIGxpbmVhcidcbiAgICAgbHVtYXMgPSBbMSwgMiwgMywgNF1cbiAgICAgb3V0cHV0ID0gd2luZG93LnBsdWdpbnMuZWZmaWNpZW5jeS5jYWxjdWxhdGVTdHJhdGVneV9HcmF5QmluYXJ5KGx1bWFzKVxuICAgICBleHBlY3QoJzUwLjAnKS50by5lcXVhbChvdXRwdXQudG9GaXhlZCgxKSlcblxuICBpdCBcImNhbGN1bGF0ZVN0cmF0ZWd5X0dyYXlCaW5hcnkgNzUlIGJpbmFyeSBkYXRhXCIsIC0+XG4gICAgICMgd2lraS5sb2cgJ2NhbGN1bGF0ZVN0cmF0ZWd5X0dyYXlCaW5hcnkgNzUlIGJpbmFyeSdcbiAgICAgbHVtYXMgPSBbMCwgMjU1LCAyNTUsIDI1NV1cbiAgICAgb3V0cHV0ID0gd2luZG93LnBsdWdpbnMuZWZmaWNpZW5jeS5jYWxjdWxhdGVTdHJhdGVneV9HcmF5QmluYXJ5KGx1bWFzKVxuICAgICBleHBlY3QoJzc1LjAnKS50by5lcXVhbChvdXRwdXQudG9GaXhlZCgxKSlcblxuICBpdCBcImNhbGN1bGF0ZVN0cmF0ZWd5X0dyYXlJdGVyYXRpdmVDbHVzdGVyaW5nIDUwJSBiaW5hcnkgZGF0YVwiLCAtPlxuICAgICAjIHdpa2kubG9nICdjYWxjdWxhdGVTdHJhdGVneV9HcmF5SXRlcmF0aXZlQ2x1c3RlcmluZyA1MCUgYmluYXJ5J1xuICAgICBsdW1hcyA9IFswLCAwLCAyNTUsIDI1NV1cbiAgICAgb3V0cHV0ID0gd2luZG93LnBsdWdpbnMuZWZmaWNpZW5jeS5jYWxjdWxhdGVTdHJhdGVneV9HcmF5SXRlcmF0aXZlQ2x1c3RlcmluZyhsdW1hcylcbiAgICAgZXhwZWN0KCc1MC4wJykudG8uZXF1YWwob3V0cHV0LnRvRml4ZWQoMSkpXG5cbiAgaXQgXCJjYWxjdWxhdGVTdHJhdGVneV9HcmF5SXRlcmF0aXZlQ2x1c3RlcmluZyA1MCUgbGluZWFyIGRhdGFcIiwgLT5cbiAgICAgIyB3aWtpLmxvZyAnY2FsY3VsYXRlU3RyYXRlZ3lfR3JheUl0ZXJhdGl2ZUNsdXN0ZXJpbmcgNTAlIGxpbmVhcidcbiAgICAgbHVtYXMgPSBbMSwgMiwgMywgNF1cbiAgICAgb3V0cHV0ID0gd2luZG93LnBsdWdpbnMuZWZmaWNpZW5jeS5jYWxjdWxhdGVTdHJhdGVneV9HcmF5SXRlcmF0aXZlQ2x1c3RlcmluZyhsdW1hcylcbiAgICAgZXhwZWN0KCc1MC4wJykudG8uZXF1YWwob3V0cHV0LnRvRml4ZWQoMSkpXG5cbiAgaXQgXCJjYWxjdWxhdGVTdHJhdGVneV9HcmF5SXRlcmF0aXZlQ2x1c3RlcmluZyA3NSUgYmluYXJ5IGRhdGFcIiwgLT5cbiAgICAgIyB3aWtpLmxvZyAnY2FsY3VsYXRlU3RyYXRlZ3lfR3JheUl0ZXJhdGl2ZUNsdXN0ZXJpbmcgNzUlIGJpbmFyeSdcbiAgICAgbHVtYXMgPSBbMCwgMjU1LCAyNTUsIDI1NV1cbiAgICAgb3V0cHV0ID0gd2luZG93LnBsdWdpbnMuZWZmaWNpZW5jeS5jYWxjdWxhdGVTdHJhdGVneV9HcmF5SXRlcmF0aXZlQ2x1c3RlcmluZyhsdW1hcylcbiAgICAgZXhwZWN0KCc3NS4wJykudG8uZXF1YWwob3V0cHV0LnRvRml4ZWQoMSkpXG5cblxuXG5cbiAgXG4iLCJyZXBvcnQgPSByZXF1aXJlICcuL3JlcG9ydCdcblxuZGVzY3JpYmUgJ3JlcG9ydCBwbHVnaW4nLCAtPlxuXG5cdGRlc2NyaWJlICdwYXJzaW5nJywgLT5cblxuXHRcdGl0ICdyZXR1cm5zIGFuIGFycmF5JywgLT5cblx0XHRcdHNjaGVkdWxlID0gcmVwb3J0LnBhcnNlIFwiXCJcblx0XHRcdGV4cGVjdChzY2hlZHVsZSkudG8uZXFsIFtdXG5cblx0XHRpdCAncGFyc2VzIGludGVydmFscycsIC0+XG5cdFx0XHRbaXNzdWVdID0gcmVwb3J0LnBhcnNlIFwiREFJTFkgd2FyZEBleGFtcGxlLmNvbVwiXG5cdFx0XHRleHBlY3QoaXNzdWUuaW50ZXJ2YWwpLnRvLmJlICdEQUlMWSdcblxuXHRcdGl0ICdwYXJzZXMgb2Zmc2V0cycsIC0+XG5cdFx0XHRbaXNzdWVdID0gcmVwb3J0LnBhcnNlIFwiV0VFS0xZIFRVRVNEQVkgTk9PTlwiXG5cdFx0XHRleHBlY3QoaXNzdWUub2Zmc2V0cykudG8uZXFsIFsnVFVFU0RBWScsICdOT09OJ11cblxuXHRcdGl0ICdwYXJzZXMgcmVjaXBpZW50cycsIC0+XG5cdFx0XHRbaXNzdWVdID0gcmVwb3J0LnBhcnNlIFwiREFJTFkgd2FyZEBjMi5jb20gcm9vdEBjMi5jb21cIlxuXHRcdFx0ZXhwZWN0KGlzc3VlLnJlY2lwaWVudHMpLnRvLmVxbCBbJ3dhcmRAYzIuY29tJywgJ3Jvb3RAYzIuY29tJ11cblxuXHRcdGl0ICdwYXJzZXMgbXVsdGlwbGUgaXNzdWVzJywgLT5cblx0XHRcdHNjaGVkdWxlID0gcmVwb3J0LnBhcnNlIFwiV0VFS0xZIE1PTlRITFkgWUVBUkxZXCJcblx0XHRcdGV4cGVjdChzY2hlZHVsZSkudG8uaGF2ZS5sZW5ndGggM1xuXG5cdGRlc2NyaWJlICdhZHZhbmNpbmcnLCAtPlxuXG5cdFx0aXQgJ2hhbmRsZXMgd2Vla3MnLCAtPlxuXHRcdFx0W2lzc3VlXSA9IHJlcG9ydC5wYXJzZSBcIldFRUtMWVwiXG5cdFx0XHRkYXRlID0gbmV3IERhdGUgMjAxMiwgMTItMSwgMjUsIDMsIDQsIDVcblx0XHRcdGNvdW50ID0gKGkpIC0+IHJlcG9ydC5hZHZhbmNlKGRhdGUsIGlzc3VlLCBpKVxuXHRcdFx0ZXhwZWN0KGNvdW50IC0xKS50by5lcWwgbmV3IERhdGUgMjAxMiwgMTItMSwgMTZcblx0XHRcdGV4cGVjdChjb3VudCAwKS50by5lcWwgbmV3IERhdGUgMjAxMiwgMTItMSwgMjNcblx0XHRcdGV4cGVjdChjb3VudCAxKS50by5lcWwgbmV3IERhdGUgMjAxMiwgMTItMSwgMzBcblx0XHRcdGV4cGVjdChjb3VudCAyKS50by5lcWwgbmV3IERhdGUgMjAxMywgMS0xLCA2XG5cblx0XHRpdCAnaGFuZGxlcyB3ZWVrcyB3aXRoIG9mZnNldHMgKG5vb24gPiBub3cpJywgLT5cblx0XHRcdFtpc3N1ZV0gPSByZXBvcnQucGFyc2UgXCJXRUVLTFkgVFVFU0RBWSBOT09OXCJcblx0XHRcdGRhdGUgPSBuZXcgRGF0ZSAyMDEyLCAxMi0xLCAyNSwgMywgNCwgNVxuXHRcdFx0Y291bnQgPSAoaSkgLT4gcmVwb3J0LmFkdmFuY2UoZGF0ZSwgaXNzdWUsIGkpXG5cdFx0XHRleHBlY3QoY291bnQgLTEpLnRvLmVxbCBuZXcgRGF0ZSAyMDEyLCAxMi0xLCAxMSwgMTJcblx0XHRcdGV4cGVjdChjb3VudCAwKS50by5lcWwgbmV3IERhdGUgMjAxMiwgMTItMSwgMTgsIDEyXG5cdFx0XHRleHBlY3QoY291bnQgMSkudG8uZXFsIG5ldyBEYXRlIDIwMTIsIDEyLTEsIDI1LCAxMlxuXHRcdFx0ZXhwZWN0KGNvdW50IDIpLnRvLmVxbCBuZXcgRGF0ZSAyMDEzLCAxLTEsIDEsIDEyXG5cblx0XHRpdCAnaGFuZGxlcyB5ZWFycyB3aXRoIG9mZnNldHMgKG1hcmNoIDwgbm93KScsIC0+XG5cdFx0XHRbaXNzdWVdID0gcmVwb3J0LnBhcnNlIFwiWUVBUkxZIE1BUkNIIEZSSURBWSBFVkVOSU5HXCJcblx0XHRcdGRhdGUgPSBuZXcgRGF0ZSAyMDEyLCAxMi0xLCAyNSwgMywgNCwgNVxuXHRcdFx0Y291bnQgPSAoaSkgLT4gcmVwb3J0LmFkdmFuY2UoZGF0ZSwgaXNzdWUsIGkpXG5cdFx0XHRleHBlY3QoY291bnQgLTEpLnRvLmVxbCBuZXcgRGF0ZSAyMDExLCAzLTEsIDQsIDE4XG5cdFx0XHRleHBlY3QoY291bnQgMCkudG8uZXFsIG5ldyBEYXRlIDIwMTIsIDMtMSwgMiwgMThcblx0XHRcdGV4cGVjdChjb3VudCAxKS50by5lcWwgbmV3IERhdGUgMjAxMywgMy0xLCAxLCAxOFxuXHRcdFx0ZXhwZWN0KGNvdW50IDIpLnRvLmVxbCBuZXcgRGF0ZSAyMDE0LCAzLTEsIDcsIDE4XG5cblx0XHRpdCAnaGFuZGxlcyBlbGVjdGlvbiBkYXkgKGVsZWN0aW9uID4gbm93KScsIC0+XG5cdFx0XHRbaXNzdWVdID0gcmVwb3J0LnBhcnNlIFwiWUVBUkxZIE5PVkVNQkVSIE1PTkRBWSBUVUVTREFZIE1PUk5JTkdcIlxuXHRcdFx0ZGF0ZSA9IG5ldyBEYXRlIDIwMTYsIDEsIDIsIDMsIDQsIDVcblx0XHRcdGNvdW50ID0gKGkpIC0+IHJlcG9ydC5hZHZhbmNlKGRhdGUsIGlzc3VlLCBpKVxuXHRcdFx0ZXhwZWN0KGNvdW50IC0xKS50by5lcWwgbmV3IERhdGUgMjAxNCwgMTEtMSwgNCwgNlxuXHRcdFx0ZXhwZWN0KGNvdW50IDApLnRvLmVxbCBuZXcgRGF0ZSAyMDE1LCAxMS0xLCAzLCA2XG5cdFx0XHRleHBlY3QoY291bnQgMSkudG8uZXFsIG5ldyBEYXRlIDIwMTYsIDExLTEsIDgsIDZcblx0XHRcdGV4cGVjdChjb3VudCAyKS50by5lcWwgbmV3IERhdGUgMjAxNywgMTEtMSwgNywgNlxuIiwiY3JlYXRlU3lub3BzaXMgPSByZXF1aXJlICcuL3N5bm9wc2lzLmNvZmZlZSdcblxud2lraSA9IHsgY3JlYXRlU3lub3BzaXMgfVxuXG53aWtpLmxvZyA9ICh0aGluZ3MuLi4pIC0+XG4gIGNvbnNvbGUubG9nIHRoaW5ncy4uLiBpZiBjb25zb2xlPy5sb2c/XG5cbndpa2kuYXNTbHVnID0gKG5hbWUpIC0+XG4gIG5hbWUucmVwbGFjZSgvXFxzL2csICctJykucmVwbGFjZSgvW15BLVphLXowLTktXS9nLCAnJykudG9Mb3dlckNhc2UoKVxuXG5cbndpa2kudXNlTG9jYWxTdG9yYWdlID0gLT5cbiAgJChcIi5sb2dpblwiKS5sZW5ndGggPiAwXG5cbndpa2kucmVzb2x1dGlvbkNvbnRleHQgPSBbXVxuXG53aWtpLnJlc29sdmVGcm9tID0gKGFkZGl0aW9uLCBjYWxsYmFjaykgLT5cbiAgd2lraS5yZXNvbHV0aW9uQ29udGV4dC5wdXNoIGFkZGl0aW9uXG4gIHRyeVxuICAgIGNhbGxiYWNrKClcbiAgZmluYWxseVxuICAgIHdpa2kucmVzb2x1dGlvbkNvbnRleHQucG9wKClcblxud2lraS5nZXREYXRhID0gKHZpcykgLT5cbiAgaWYgdmlzXG4gICAgaWR4ID0gJCgnLml0ZW0nKS5pbmRleCh2aXMpXG4gICAgd2hvID0gJChcIi5pdGVtOmx0KCN7aWR4fSlcIikuZmlsdGVyKCcuY2hhcnQsLmRhdGEsLmNhbGN1bGF0b3InKS5sYXN0KClcbiAgICBpZiB3aG8/IHRoZW4gd2hvLmRhdGEoJ2l0ZW0nKS5kYXRhIGVsc2Uge31cbiAgZWxzZVxuICAgIHdobyA9ICQoJy5jaGFydCwuZGF0YSwuY2FsY3VsYXRvcicpLmxhc3QoKVxuICAgIGlmIHdobz8gdGhlbiB3aG8uZGF0YSgnaXRlbScpLmRhdGEgZWxzZSB7fVxuXG53aWtpLmdldERhdGFOb2RlcyA9ICh2aXMpIC0+XG4gIGlmIHZpc1xuICAgIGlkeCA9ICQoJy5pdGVtJykuaW5kZXgodmlzKVxuICAgIHdobyA9ICQoXCIuaXRlbTpsdCgje2lkeH0pXCIpLmZpbHRlcignLmNoYXJ0LC5kYXRhLC5jYWxjdWxhdG9yJykudG9BcnJheSgpLnJldmVyc2UoKVxuICAgICQod2hvKVxuICBlbHNlXG4gICAgd2hvID0gJCgnLmNoYXJ0LC5kYXRhLC5jYWxjdWxhdG9yJykudG9BcnJheSgpLnJldmVyc2UoKVxuICAgICQod2hvKVxuXG53aWtpLmNyZWF0ZVBhZ2UgPSAobmFtZSwgbG9jKSAtPlxuICBzaXRlID0gbG9jIGlmIGxvYyBhbmQgbG9jIGlzbnQgJ3ZpZXcnXG4gICRwYWdlID0gJCBcIlwiXCJcbiAgICA8ZGl2IGNsYXNzPVwicGFnZVwiIGlkPVwiI3tuYW1lfVwiPlxuICAgICAgPGRpdiBjbGFzcz1cInR3aW5zXCI+IDxwPiA8L3A+IDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxuICAgICAgICA8aDE+IDxpbWcgY2xhc3M9XCJmYXZpY29uXCIgc3JjPVwiI3sgaWYgc2l0ZSB0aGVuIFwiLy8je3NpdGV9XCIgZWxzZSBcIlwiIH0vZmF2aWNvbi5wbmdcIiBoZWlnaHQ9XCIzMnB4XCI+ICN7bmFtZX0gPC9oMT5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICBcIlwiXCJcbiAgJHBhZ2UuZmluZCgnLnBhZ2UnKS5hdHRyKCdkYXRhLXNpdGUnLCBzaXRlKSBpZiBzaXRlXG4gICRwYWdlXG5cbndpa2kuZ2V0SXRlbSA9IChlbGVtZW50KSAtPlxuICAkKGVsZW1lbnQpLmRhdGEoXCJpdGVtXCIpIG9yICQoZWxlbWVudCkuZGF0YSgnc3RhdGljSXRlbScpIGlmICQoZWxlbWVudCkubGVuZ3RoID4gMFxuXG53aWtpLnJlc29sdmVMaW5rcyA9IChzdHJpbmcpIC0+XG4gIHJlbmRlckludGVybmFsTGluayA9IChtYXRjaCwgbmFtZSkgLT5cbiAgICAjIHNwYWNlcyBiZWNvbWUgJ3NsdWdzJywgbm9uLWFscGhhLW51bSBnZXQgcmVtb3ZlZFxuICAgIHNsdWcgPSB3aWtpLmFzU2x1ZyBuYW1lXG4gICAgXCI8YSBjbGFzcz1cXFwiaW50ZXJuYWxcXFwiIGhyZWY9XFxcIi8je3NsdWd9Lmh0bWxcXFwiIGRhdGEtcGFnZS1uYW1lPVxcXCIje3NsdWd9XFxcIiB0aXRsZT1cXFwiI3t3aWtpLnJlc29sdXRpb25Db250ZXh0LmpvaW4oJyA9PiAnKX1cXFwiPiN7bmFtZX08L2E+XCJcbiAgc3RyaW5nXG4gICAgLnJlcGxhY2UoL1xcW1xcWyhbXlxcXV0rKVxcXVxcXS9naSwgcmVuZGVySW50ZXJuYWxMaW5rKVxuICAgIC5yZXBsYWNlKC9cXFsoaHR0cC4qPykgKC4qPylcXF0vZ2ksIFwiXCJcIjxhIGNsYXNzPVwiZXh0ZXJuYWxcIiB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPVwiJDFcIiB0aXRsZT1cIiQxXCIgcmVsPVwibm9mb2xsb3dcIj4kMiA8aW1nIHNyYz1cIi9pbWFnZXMvZXh0ZXJuYWwtbGluay1sdHItaWNvbi5wbmdcIj48L2E+XCJcIlwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHdpa2lcblxuIiwidXRpbCA9IHJlcXVpcmUoJy4uL2xpYi91dGlsLmNvZmZlZScpXG5cbnRpbWV6b25lT2Zmc2V0ID0gLT5cbiAgKChuZXcgRGF0ZSgxMzMzODQzMzQ0MDAwKSkuZ2V0VGltZXpvbmVPZmZzZXQoKSAqIDYwKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRlc2NyaWJlICd1dGlsJywgLT5cbiAgaXQgJ3Nob3VsZCBtYWtlIHJhbmRvbSBieXRlcycsIC0+XG4gICAgYSA9IHV0aWwucmFuZG9tQnl0ZSgpXG4gICAgZXhwZWN0KGEpLnRvLmJlLmEgJ3N0cmluZydcbiAgICBleHBlY3QoYS5sZW5ndGgpLnRvLmJlIDJcbiAgaXQgJ3Nob3VsZCBtYWtlIHJhbmRvbSBieXRlIHN0cmluZ3MnLCAtPlxuICAgIHMgPSB1dGlsLnJhbmRvbUJ5dGVzKDQpXG4gICAgZXhwZWN0KHMpLnRvLmJlLmEgJ3N0cmluZydcbiAgICBleHBlY3Qocy5sZW5ndGgpLnRvLmJlIDhcblxuICBpdCAnc2hvdWxkIGZvcm1hdCB1bml4IHRpbWUnLCAtPlxuICAgIHMgPSB1dGlsLmZvcm1hdFRpbWUoMTMzMzg0MzM0NCArIHRpbWV6b25lT2Zmc2V0KCkpXG4gICAgZXhwZWN0KHMpLnRvLmJlICcxMjowMiBBTTxicj44IEFwciAyMDEyJ1xuICBpdCAnc2hvdWxkIGZvcm1hdCBqYXZhc2NyaXB0IHRpbWUnLCAtPlxuICAgIHMgPSB1dGlsLmZvcm1hdFRpbWUoMTMzMzg0MzM0NDAwMCArIHRpbWV6b25lT2Zmc2V0KCkgKiAxMDAwKVxuICAgIGV4cGVjdChzKS50by5iZSAnMTI6MDIgQU08YnI+OCBBcHIgMjAxMidcbiAgaXQgJ3Nob3VsZCBmb3JtYXQgcmV2aXNpb24gZGF0ZScsIC0+XG4gICAgcyA9IHV0aWwuZm9ybWF0RGF0ZSgxMzMzODQzMzQ0MDAwICsgdGltZXpvbmVPZmZzZXQoKSAqIDEwMDApXG4gICAgZXhwZWN0KHMpLnRvLmJlICdTdW4gQXByIDgsIDIwMTI8YnI+MTI6MDI6MjQgQU0nXG4gIGl0ICdzaG91bGQgc2x1ZyBhIG5hbWUnLCAtPlxuICAgIHMgPSB3aWtpLmFzU2x1ZyAnV2VsY29tZSBWaXNpdG9ycydcbiAgICBleHBlY3QocykudG8uYmUgJ3dlbGNvbWUtdmlzaXRvcnMnXG4gIGl0ICdzaG91bGQgbWFrZSBlbXB0eVBhZ2UgcGFnZSB3aXRoIHRpdGxlLCBzdG9yeSBhbmQgam91cm5hbCcsIC0+XG4gICAgcGFnZSA9IHV0aWwuZW1wdHlQYWdlKClcbiAgICBleHBlY3QocGFnZS50aXRsZSkudG8uYmUgJ2VtcHR5J1xuICAgIGV4cGVjdChwYWdlLnN0b3J5KS50by5lcWwgW11cbiAgICBleHBlY3QocGFnZS5qb3VybmFsKS50by5lcWwgW11cbiAgaXQgJ3Nob3VsZCBtYWtlIGZyZXNoIGVtcHR5IHBhZ2UgZWFjaCBjYWxsJywgLT5cbiAgICBwYWdlID0gdXRpbC5lbXB0eVBhZ2UoKVxuICAgIHBhZ2Uuc3RvcnkucHVzaCB7dHlwZTogJ2p1bmsnfVxuICAgIHBhZ2UgPSB1dGlsLmVtcHR5UGFnZSgpXG4gICAgZXhwZWN0KHBhZ2Uuc3RvcnkpLnRvLmVxbCBbXVxuXG4iLCJhY3RpdmUgPSByZXF1aXJlICcuLi9saWIvYWN0aXZlLmNvZmZlZSdcblxuZGVzY3JpYmUgJ2FjdGl2ZScsIC0+XG5cbiAgYmVmb3JlIC0+XG4gICAgJCgnPGRpdiBpZD1cImFjdGl2ZTFcIiAvPicpLmFwcGVuZFRvKCdib2R5JylcbiAgICAkKCc8ZGl2IGlkPVwiYWN0aXZlMlwiIC8+JykuYXBwZW5kVG8oJ2JvZHknKVxuICAgIGFjdGl2ZS5zZXQoJCgnI2FjdGl2ZTEnKSlcblxuICBpdCAnc2hvdWxkIGRldGVjdCB0aGUgc2Nyb2xsIGNvbnRhaW5lcicsIC0+XG4gICAgZXhwZWN0KGFjdGl2ZS5zY3JvbGxDb250YWluZXIpLnRvLmJlLmEoJClcblxuICBpdCAnc2hvdWxkIHNldCB0aGUgYWN0aXZlIGRpdicsIC0+XG4gICAgYWN0aXZlLnNldCgkKCcjYWN0aXZlMicpKVxuICAgIGV4cGVjdCgkKCcjYWN0aXZlMicpLmhhc0NsYXNzKCdhY3RpdmUnKSkudG8uYmUudHJ1ZVxuXG4gIGl0ICdzaG91bGQgcmVtb3ZlIHByZXZpb3VzIGFjdGl2ZSBjbGFzcycsIC0+XG4gICAgZXhwZWN0KCQoJyNhY3RpdmUxJykuaGFzQ2xhc3MoJ2FjdGl2ZScpKS50by5iZS5mYWxzZVxuXG4iLCJwYWdlSGFuZGxlciA9IHJlcXVpcmUgJy4uL2xpYi9wYWdlSGFuZGxlci5jb2ZmZWUnXG5tb2NrU2VydmVyID0gcmVxdWlyZSAnLi9tb2NrU2VydmVyLmNvZmZlZSdcblxuIyBGYWtlcyBmb3IgdGhpbmdzIHN0aWxsIHN0dWNrIGluIGxlZ2FjeS5jb2ZmZWVcbiMgVE9ETzogUmVtb3ZlIHRoZXNlIEFTQVBcbndpa2kudXNlTG9jYWxTdG9yYWdlID0gLT4gZmFsc2VcblxuZGVzY3JpYmUgJ3BhZ2VIYW5kbGVyLmdldCcsIC0+XG5cbiAgaXQgJ3Nob3VsZCBoYXZlIGFuIGVtcHR5IGNvbnRleHQnLCAtPlxuICAgIGV4cGVjdChwYWdlSGFuZGxlci5jb250ZXh0KS50by5lcWwoW10pXG5cbiAgcGFnZUluZm9ybWF0aW9uV2l0aG91dFNpdGUgPSB7XG4gICAgc2x1ZzogJ3NsdWdOYW1lJ1xuICAgIHJldjogJ3Jldk5hbWUnXG4gIH1cblxuICBnZW5lcmljUGFnZUluZm9ybWF0aW9uID0gXy5leHRlbmQoIHt9LCBwYWdlSW5mb3JtYXRpb25XaXRob3V0U2l0ZSwge3NpdGU6ICdzaXRlTmFtZSd9IClcblxuICBnZW5lcmljUGFnZURhdGEgPSB7XG4gICAgam91cm5hbDogW11cbiAgfVxuXG4gIGRlc2NyaWJlICdhamF4IGZhaWxzJywgLT5cblxuICAgIGJlZm9yZSAtPlxuICAgICAgbW9ja1NlcnZlci5zaW11bGF0ZVBhZ2VOb3RGb3VuZCgpXG5cbiAgICBhZnRlciAtPlxuICAgICAgalF1ZXJ5LmFqYXgucmVzdG9yZSgpXG5cbiAgICBpdCBcInNob3VsZCB0ZWxsIHVzIHdoZW4gaXQgY2FuJ3QgZmluZCBhIHBhZ2UgKHNlcnZlciBzcGVjaWZpZWQpXCIsIC0+XG4gICAgICB3aGVuR290dGVuID0gc2lub24uc3B5KClcbiAgICAgIHdoZW5Ob3RHb3R0ZW4gPSBzaW5vbi5zcHkoKVxuXG4gICAgICBwYWdlSGFuZGxlci5nZXQgXG4gICAgICAgIHBhZ2VJbmZvcm1hdGlvbjogXy5jbG9uZSggZ2VuZXJpY1BhZ2VJbmZvcm1hdGlvbiApXG4gICAgICAgIHdoZW5Hb3R0ZW46IHdoZW5Hb3R0ZW5cbiAgICAgICAgd2hlbk5vdEdvdHRlbjogd2hlbk5vdEdvdHRlblxuXG4gICAgICBleHBlY3QoIHdoZW5Hb3R0ZW4uY2FsbGVkICkudG8uYmUuZmFsc2VcbiAgICAgIGV4cGVjdCggd2hlbk5vdEdvdHRlbi5jYWxsZWQgKS50by5iZS50cnVlXG5cbiAgICBpdCBcInNob3VsZCB0ZWxsIHVzIHdoZW4gaXQgY2FuJ3QgZmluZCBhIHBhZ2UgKHNlcnZlciB1bnNwZWNpZmllZClcIiwgLT5cbiAgICAgIHdoZW5Hb3R0ZW4gPSBzaW5vbi5zcHkoKVxuICAgICAgd2hlbk5vdEdvdHRlbiA9IHNpbm9uLnNweSgpXG5cbiAgICAgIHBhZ2VIYW5kbGVyLmdldCBcbiAgICAgICAgcGFnZUluZm9ybWF0aW9uOiBfLmNsb25lKCBwYWdlSW5mb3JtYXRpb25XaXRob3V0U2l0ZSApXG4gICAgICAgIHdoZW5Hb3R0ZW46IHdoZW5Hb3R0ZW5cbiAgICAgICAgd2hlbk5vdEdvdHRlbjogd2hlbk5vdEdvdHRlblxuXG4gICAgICBleHBlY3QoIHdoZW5Hb3R0ZW4uY2FsbGVkICkudG8uYmUuZmFsc2VcbiAgICAgIGV4cGVjdCggd2hlbk5vdEdvdHRlbi5jYWxsZWQgKS50by5iZS50cnVlXG5cbiAgZGVzY3JpYmUgJ2FqYXgsIHN1Y2Nlc3MnLCAtPlxuICAgIGJlZm9yZSAtPlxuICAgICAgc2lub24uc3R1YihqUXVlcnksIFwiYWpheFwiKS55aWVsZHNUbygnc3VjY2VzcycsIGdlbmVyaWNQYWdlRGF0YSlcbiAgICAgICQoJzxkaXYgaWQ9XCJwYWdlSGFuZGxlcjVcIiBkYXRhLXNpdGU9XCJmb29cIiAvPicpLmFwcGVuZFRvKCdib2R5JylcblxuICAgIGl0ICdzaG91bGQgZ2V0IGEgcGFnZSBmcm9tIHNwZWNpZmljIHNpdGUnLCAtPlxuICAgICAgd2hlbkdvdHRlbiA9IHNpbm9uLnNweSgpXG4gICAgICBwYWdlSGFuZGxlci5nZXQgXG4gICAgICAgIHBhZ2VJbmZvcm1hdGlvbjogXy5jbG9uZSggZ2VuZXJpY1BhZ2VJbmZvcm1hdGlvbiApXG4gICAgICAgIHdoZW5Hb3R0ZW46IHdoZW5Hb3R0ZW5cblxuICAgICAgZXhwZWN0KHdoZW5Hb3R0ZW4uY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuICAgICAgZXhwZWN0KGpRdWVyeS5hamF4LmNhbGxlZE9uY2UpLnRvLmJlLnRydWVcbiAgICAgIGV4cGVjdChqUXVlcnkuYWpheC5hcmdzWzBdWzBdKS50by5oYXZlLnByb3BlcnR5KCd0eXBlJywgJ0dFVCcpXG4gICAgICBleHBlY3QoalF1ZXJ5LmFqYXguYXJnc1swXVswXS51cmwpLnRvLm1hdGNoKC8vL15odHRwOi8vc2l0ZU5hbWUvc2x1Z05hbWVcXC5qc29uXFw/cmFuZG9tPVthLXowLTldezh9JC8vLylcblxuICAgIGFmdGVyIC0+XG4gICAgICBqUXVlcnkuYWpheC5yZXN0b3JlKClcblxuICBkZXNjcmliZSAnYWpheCwgc2VhcmNoJywgLT5cbiAgICBiZWZvcmUgLT5cbiAgICAgIG1vY2tTZXJ2ZXIuc2ltdWxhdGVQYWdlTm90Rm91bmQoKVxuICAgICAgcGFnZUhhbmRsZXIuY29udGV4dCA9IFsndmlldycsICdleGFtcGxlLmNvbScsICdhc2RmLnRlc3QnLCAnZm9vLmJhciddXG5cbiAgICBpdCAnc2hvdWxkIHNlYXJjaCB0aHJvdWdoIHRoZSBjb250ZXh0IGZvciBhIHBhZ2UnLCAtPlxuICAgICAgcGFnZUhhbmRsZXIuZ2V0IFxuICAgICAgICBwYWdlSW5mb3JtYXRpb246IF8uY2xvbmUoIHBhZ2VJbmZvcm1hdGlvbldpdGhvdXRTaXRlIClcbiAgICAgICAgd2hlbkdvdHRlbjogc2lub24uc3R1YigpXG4gICAgICAgIHdoZW5Ob3RHb3R0ZW46IHNpbm9uLnN0dWIoKVxuXG4gICAgICBleHBlY3QoalF1ZXJ5LmFqYXguYXJnc1swXVswXS51cmwpLnRvLm1hdGNoKC8vL14vc2x1Z05hbWVcXC5qc29uXFw/cmFuZG9tPVthLXowLTldezh9JC8vLylcbiAgICAgIGV4cGVjdChqUXVlcnkuYWpheC5hcmdzWzFdWzBdLnVybCkudG8ubWF0Y2goLy8vXmh0dHA6Ly9leGFtcGxlLmNvbS9zbHVnTmFtZVxcLmpzb25cXD9yYW5kb209W2EtejAtOV17OH0kLy8vKVxuICAgICAgZXhwZWN0KGpRdWVyeS5hamF4LmFyZ3NbMl1bMF0udXJsKS50by5tYXRjaCgvLy9eaHR0cDovL2FzZGYudGVzdC9zbHVnTmFtZVxcLmpzb25cXD9yYW5kb209W2EtejAtOV17OH0kLy8vKVxuICAgICAgZXhwZWN0KGpRdWVyeS5hamF4LmFyZ3NbM11bMF0udXJsKS50by5tYXRjaCgvLy9eaHR0cDovL2Zvby5iYXIvc2x1Z05hbWVcXC5qc29uXFw/cmFuZG9tPVthLXowLTldezh9JC8vLylcblxuICAgIGFmdGVyIC0+XG4gICAgICBqUXVlcnkuYWpheC5yZXN0b3JlKClcblxuZGVzY3JpYmUgJ3BhZ2VIYW5kbGVyLnB1dCcsIC0+XG4gIGJlZm9yZSAtPlxuICAgICQoJzxkaXYgaWQ9XCJwYWdlSGFuZGxlcjNcIiAvPicpLmFwcGVuZFRvKCdib2R5JylcbiAgICBzaW5vbi5zdHViKGpRdWVyeSwgXCJhamF4XCIpLnlpZWxkc1RvKCdzdWNjZXNzJylcblxuICBpdCAnc2hvdWxkIHNhdmUgYW4gYWN0aW9uJywgKGRvbmUpIC0+XG4gICAgYWN0aW9uID0ge3R5cGU6ICdlZGl0JywgaWQ6IDEsIGl0ZW06IHtpZDoxfX1cbiAgICBwYWdlSGFuZGxlci5wdXQgJCgnI3BhZ2VIYW5kbGVyMycpLCBhY3Rpb25cbiAgICBleHBlY3QoalF1ZXJ5LmFqYXguYXJnc1swXVswXS5kYXRhKS50by5lcWwoe2FjdGlvbjogSlNPTi5zdHJpbmdpZnkoYWN0aW9uKX0pXG4gICAgZG9uZSgpXG5cbiAgYWZ0ZXIgLT5cbiAgICBqUXVlcnkuYWpheC5yZXN0b3JlKClcblxuIiwicmVmcmVzaCA9IHJlcXVpcmUoJy4uL2xpYi9yZWZyZXNoLmNvZmZlZScpXG5tb2NrU2VydmVyID0gcmVxdWlyZSgnLi9tb2NrU2VydmVyLmNvZmZlZScpXG5cbmRlc2NyaWJlICdyZWZyZXNoJywgLT5cbiAgc2ltdWxhdGVQYWdlTm90QmVpbmdGb3VuZCA9IC0+XG4gICAgc2lub24uc3R1YihqUXVlcnksIFwiYWpheFwiKS55aWVsZHNUbygnc3VjY2VzcycsIHt0aXRsZTogJ2FzZGYnfSlcblxuICAkcGFnZSA9IHVuZGVmaW5lZFxuXG4gIGJlZm9yZSAtPlxuICAgICRwYWdlID0gJCgnPGRpdiBpZD1cInJlZnJlc2hcIiAvPicpXG4gICAgJHBhZ2UuYXBwZW5kVG8oJ2JvZHknKVxuXG4gIGl0IFwiY3JlYXRlcyBhIGdob3N0IHBhZ2Ugd2hlbiBwYWdlIGNvdWxkbid0IGJlIGZvdW5kXCIsIC0+XG4gICAgbW9ja1NlcnZlci5zaW11bGF0ZVBhZ2VOb3RGb3VuZCgpXG4gICAgJHBhZ2UuZWFjaCByZWZyZXNoXG4gICAgZXhwZWN0KCAkcGFnZS5oYXNDbGFzcygnZ2hvc3QnKSApLnRvLmJlKHRydWUpXG4gICAgZXhwZWN0KCAkcGFnZS5kYXRhKCdkYXRhJykuc3RvcnlbMF0udHlwZSApLnRvLmJlKCdmdXR1cmUnKVxuXG4gIHhpdCAnc2hvdWxkIHJlZnJlc2ggYSBwYWdlJywgKGRvbmUpIC0+XG4gICAgc2ltdWxhdGVQYWdlRm91bmQoe3RpdGxlOiAnYXNkZid9KVxuICAgICRwYWdlLmVhY2ggcmVmcmVzaFxuICAgIGpRdWVyeS5hamF4LnJlc3RvcmUoKVxuXG4gICAgZXhwZWN0KCQoJyNyZWZyZXNoIGgxJykudGV4dCgpKS50by5iZSgnIGFzZGYnKVxuICAgIGRvbmUoKVxuIiwicGx1Z2luID0gcmVxdWlyZSgnLi4vbGliL3BsdWdpbi5jb2ZmZWUnKVxuXG5kZXNjcmliZSAncGx1Z2luJywgLT5cbiAgZmFrZURlZmVycmVkID0gdW5kZWZpbmVkXG5cbiAgYmVmb3JlIC0+XG4gICAgJCgnPGRpdiBpZD1cInBsdWdpblwiIC8+JykuYXBwZW5kVG8oJ2JvZHknKVxuICAgIGZha2VEZWZlcnJlZCA9IHt9XG4gICAgZmFrZURlZmVycmVkLmRvbmUgPSBzaW5vbi5tb2NrKCkucmV0dXJucyhmYWtlRGVmZXJyZWQpXG4gICAgZmFrZURlZmVycmVkLmZhaWwgPSBzaW5vbi5tb2NrKCkucmV0dXJucyhmYWtlRGVmZXJyZWQpXG5cbiAgICBzaW5vbi5zdHViKGpRdWVyeSwnZ2V0U2NyaXB0JykucmV0dXJucyhmYWtlRGVmZXJyZWQpXG5cbiAgYWZ0ZXIgLT5cbiAgICBqUXVlcnkuZ2V0U2NyaXB0LnJlc3RvcmUoKVxuXG4gIGl0ICdzaG91bGQgaGF2ZSBkZWZhdWx0IGltYWdlIHR5cGUnLCAtPlxuICAgIGV4cGVjdCh3aW5kb3cucGx1Z2lucykudG8uaGF2ZS5wcm9wZXJ0eSgnaW1hZ2UnKVxuXG4gIGl0ICdzaG91bGQgZmV0Y2ggYSBwbHVnaW4gc2NyaXB0IGZyb20gdGhlIHJpZ2h0IGxvY2F0aW9uJywgLT5cbiAgICBwbHVnaW4uZ2V0ICd0ZXN0J1xuICAgIGV4cGVjdChqUXVlcnkuZ2V0U2NyaXB0LmNhbGxlZE9uY2UpLnRvLmJlKHRydWUpXG4gICAgZXhwZWN0KGpRdWVyeS5nZXRTY3JpcHQuYXJnc1swXVswXSkudG8uYmUoJy9wbHVnaW5zL3Rlc3QvdGVzdC5qcycpXG5cbiAgaXQgJ3Nob3VsZCByZW5kZXIgYSBwbHVnaW4nLCAtPlxuICAgIGl0ZW0gPVxuICAgICAgdHlwZTogJ3BhcmFncmFwaCdcbiAgICAgIHRleHQ6ICdibGFoIFtbTGlua11dIGFzZGYnXG4gICAgcGx1Z2luLmRvICQoJyNwbHVnaW4nKSwgaXRlbVxuICAgIGV4cGVjdCgkKCcjcGx1Z2luJykuaHRtbCgpKS50b1xuICAgICAgLmJlKCc8cD5ibGFoIDxhIGNsYXNzPVwiaW50ZXJuYWxcIiBocmVmPVwiL2xpbmsuaHRtbFwiIGRhdGEtcGFnZS1uYW1lPVwibGlua1wiIHRpdGxlPVwidmlld1wiPkxpbms8L2E+IGFzZGY8L3A+JylcblxuIiwidXRpbCA9IHJlcXVpcmUoJy4uL2xpYi91dGlsLmNvZmZlZScpXG5yZXZpc2lvbiA9IHJlcXVpcmUgJy4uL2xpYi9yZXZpc2lvbi5jb2ZmZWUnXG5cbmRlc2NyaWJlICdyZXZpc2lvbicsIC0+XG5cbiAgZGF0YSA9IHtcbiAgICBcInRpdGxlXCI6IFwibmV3LXBhZ2VcIixcbiAgICBcInN0b3J5XCI6IFtcbiAgICAgIHtcbiAgICAgICAgXCJ0eXBlXCI6IFwicGFyYWdyYXBoXCIsXG4gICAgICAgIFwiaWRcIjogXCIyYjNlMWJlZjcwOGNiOGQzXCIsXG4gICAgICAgIFwidGV4dFwiOiBcIkEgbmV3IHBhcmFncmFwaCBpcyBub3cgaW4gZmlyc3QgcG9zaXRpb25cIlxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgXCJ0eXBlXCI6IFwicGFyYWdyYXBoXCIsXG4gICAgICAgIFwiaWRcIjogXCJlZTQxNmQ0MzFlYmY0ZmI0XCIsXG4gICAgICAgIFwidGV4dFwiOiBcIlN0YXJ0IHdyaXRpbmcuIFJlYWQgW1tIb3cgdG8gV2lraV1dIGZvciBtb3JlIGlkZWFzLlwiXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBcInR5cGVcIjogXCJwYXJhZ3JhcGhcIixcbiAgICAgICAgXCJpZFwiOiBcIjViZmFlZjM2OTlhODg2MjJcIixcbiAgICAgICAgXCJ0ZXh0XCI6IFwiU29tZSBwYXJhZ3JhcGggdGV4dFwiXG4gICAgICB9XG4gICAgXSxcbiAgICBcImpvdXJuYWxcIjogW1xuICAgICAge1xuICAgICAgICBcInR5cGVcIjogXCJjcmVhdGVcIixcbiAgICAgICAgXCJpZFwiOiBcIjgzMTE4OTUxNzM4MDJhOGVcIixcbiAgICAgICAgXCJpdGVtXCI6IHtcbiAgICAgICAgICBcInRpdGxlXCI6IFwibmV3LXBhZ2VcIlxuICAgICAgICB9LFxuICAgICAgICBcImRhdGVcIjogMTM0MDk5OTYzOTExNFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgXCJpdGVtXCI6IHtcbiAgICAgICAgICBcInR5cGVcIjogXCJmYWN0b3J5XCIsXG4gICAgICAgICAgXCJpZFwiOiBcIjViZmFlZjM2OTlhODg2MjJcIlxuICAgICAgICB9LFxuICAgICAgICBcImlkXCI6IFwiNWJmYWVmMzY5OWE4ODYyMlwiLFxuICAgICAgICBcInR5cGVcIjogXCJhZGRcIixcbiAgICAgICAgXCJkYXRlXCI6IDEzNDExOTE2OTE1MDlcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIFwidHlwZVwiOiBcImVkaXRcIixcbiAgICAgICAgXCJpZFwiOiBcIjViZmFlZjM2OTlhODg2MjJcIixcbiAgICAgICAgXCJpdGVtXCI6IHtcbiAgICAgICAgICBcInR5cGVcIjogXCJwYXJhZ3JhcGhcIixcbiAgICAgICAgICBcImlkXCI6IFwiNWJmYWVmMzY5OWE4ODYyMlwiLFxuICAgICAgICAgIFwidGV4dFwiOiBcIlNvbWUgcGFyYWdyYXBoIHRleHRcIlxuICAgICAgICB9LFxuICAgICAgICBcImRhdGVcIjogMTM0MTE5MTY5NzgxNVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgXCJpdGVtXCI6IHtcbiAgICAgICAgICBcInR5cGVcIjogXCJwYXJhZ3JhcGhcIixcbiAgICAgICAgICBcImlkXCI6IFwiMmIzZTFiZWY3MDhjYjhkM1wiLFxuICAgICAgICAgIFwidGV4dFwiOiBcIlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiaWRcIjogXCIyYjNlMWJlZjcwOGNiOGQzXCIsXG4gICAgICAgIFwidHlwZVwiOiBcImFkZFwiLFxuICAgICAgICBcImFmdGVyXCI6IFwiNWJmYWVmMzY5OWE4ODYyMlwiLFxuICAgICAgICBcImRhdGVcIjogMTM0MTE5MTY5ODMyMVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgXCJ0eXBlXCI6IFwiZWRpdFwiLFxuICAgICAgICBcImlkXCI6IFwiMmIzZTFiZWY3MDhjYjhkM1wiLFxuICAgICAgICBcIml0ZW1cIjoge1xuICAgICAgICAgIFwidHlwZVwiOiBcInBhcmFncmFwaFwiLFxuICAgICAgICAgIFwiaWRcIjogXCIyYjNlMWJlZjcwOGNiOGQzXCIsXG4gICAgICAgICAgXCJ0ZXh0XCI6IFwiQSBuZXcgcGFyYWdyYXBoIGFmdGVyIHRoZSBmaXJzdFwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZGF0ZVwiOiAxMzQxMTkxNzAzNzI1XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBcInR5cGVcIjogXCJhZGRcIixcbiAgICAgICAgXCJpdGVtXCI6IHtcbiAgICAgICAgICBcInR5cGVcIjogXCJwYXJhZ3JhcGhcIixcbiAgICAgICAgICBcImlkXCI6IFwiZWU0MTZkNDMxZWJmNGZiNFwiLFxuICAgICAgICAgIFwidGV4dFwiOiBcIlN0YXJ0IHdyaXRpbmcuIFJlYWQgW1tIb3cgdG8gV2lraV1dIGZvciBtb3JlIGlkZWFzLlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiYWZ0ZXJcIjogXCI1YmZhZWYzNjk5YTg4NjIyXCIsXG4gICAgICAgIFwiaWRcIjogXCJlZTQxNmQ0MzFlYmY0ZmI0XCIsXG4gICAgICAgIFwiZGF0ZVwiOiAxMzQxMTkzMDY4NjExXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBcInR5cGVcIjogXCJtb3ZlXCIsXG4gICAgICAgIFwib3JkZXJcIjogW1xuICAgICAgICAgIFwiMmIzZTFiZWY3MDhjYjhkM1wiLFxuICAgICAgICAgIFwiZWU0MTZkNDMxZWJmNGZiNFwiLFxuICAgICAgICAgIFwiNWJmYWVmMzY5OWE4ODYyMlwiXG4gICAgICAgIF0sXG4gICAgICAgIFwiaWRcIjogXCIyYjNlMWJlZjcwOGNiOGQzXCIsXG4gICAgICAgIFwiZGF0ZVwiOiAxMzQxMTkxNzE0NjgyXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBcInR5cGVcIjogXCJlZGl0XCIsXG4gICAgICAgIFwiaWRcIjogXCIyYjNlMWJlZjcwOGNiOGQzXCIsXG4gICAgICAgIFwiaXRlbVwiOiB7XG4gICAgICAgICAgXCJ0eXBlXCI6IFwicGFyYWdyYXBoXCIsXG4gICAgICAgICAgXCJpZFwiOiBcIjJiM2UxYmVmNzA4Y2I4ZDNcIixcbiAgICAgICAgICBcInRleHRcIjogXCJBIG5ldyBwYXJhZ3JhcGggaXMgbm93XCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJkYXRlXCI6IDEzNDExOTE3MjMyODlcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIFwiaXRlbVwiOiB7XG4gICAgICAgICAgXCJ0eXBlXCI6IFwicGFyYWdyYXBoXCIsXG4gICAgICAgICAgXCJpZFwiOiBcIjJkY2I5YzU1NThmMjEzMjlcIixcbiAgICAgICAgICBcInRleHRcIjogXCIgZmlyc3RcIlxuICAgICAgICB9LFxuICAgICAgICBcImlkXCI6IFwiMmRjYjljNTU1OGYyMTMyOVwiLFxuICAgICAgICBcInR5cGVcIjogXCJhZGRcIixcbiAgICAgICAgXCJhZnRlclwiOiBcIjJiM2UxYmVmNzA4Y2I4ZDNcIixcbiAgICAgICAgXCJkYXRlXCI6IDEzNDExOTE3MjM3OTRcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIFwidHlwZVwiOiBcInJlbW92ZVwiLFxuICAgICAgICBcImlkXCI6IFwiMmRjYjljNTU1OGYyMTMyOVwiLFxuICAgICAgICBcImRhdGVcIjogMTM0MTE5MTcyNTUwOVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgXCJ0eXBlXCI6IFwiZWRpdFwiLFxuICAgICAgICBcImlkXCI6IFwiMmIzZTFiZWY3MDhjYjhkM1wiLFxuICAgICAgICBcIml0ZW1cIjoge1xuICAgICAgICAgIFwidHlwZVwiOiBcInBhcmFncmFwaFwiLFxuICAgICAgICAgIFwiaWRcIjogXCIyYjNlMWJlZjcwOGNiOGQzXCIsXG4gICAgICAgICAgXCJ0ZXh0XCI6IFwiQSBuZXcgcGFyYWdyYXBoIGlzIG5vdyBpbiBmaXJzdCBwb3NpdGlvblwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZGF0ZVwiOiAxMzQxMTkxNzQ4OTQ0XG4gICAgICB9XG4gICAgXVxuICB9XG5cbiAgaXQgJ2FuIGVtcHR5IHBhZ2Ugc2hvdWxkIGxvb2sgbGlrZSBpdHNlbGYnLCAtPlxuICAgIGVtcHR5UGFnZSA9IHV0aWwuZW1wdHlQYWdlKClcbiAgICB2ZXJzaW9uID0gcmV2aXNpb24uY3JlYXRlIDAsIGVtcHR5UGFnZVxuICAgIGV4cGVjdCh2ZXJzaW9uKS50by5lcWwoZW1wdHlQYWdlKVxuXG4gIGl0ICdzaG91bGQgc2hvcnRlbiB0aGUgam91cm5hbCB0byBnaXZlbiByZXZpc2lvbicsIC0+XG4gICAgdmVyc2lvbiA9IHJldmlzaW9uLmNyZWF0ZSAxLCBkYXRhXG4gICAgZXhwZWN0KHZlcnNpb24uam91cm5hbC5sZW5ndGgpLnRvLmJlKDIpXG5cbiAgaXQgJ3Nob3VsZCByZWNyZWF0ZSBzdG9yeSBvbiBnaXZlbiByZXZpc2lvbicsIC0+XG4gICAgdmVyc2lvbiA9IHJldmlzaW9uLmNyZWF0ZSAyLCBkYXRhXG4gICAgZXhwZWN0KHZlcnNpb24uc3RvcnkubGVuZ3RoKS50by5iZSgxKVxuICAgIGV4cGVjdCh2ZXJzaW9uLnN0b3J5WzBdLnRleHQpLnRvLmJlKCdTb21lIHBhcmFncmFwaCB0ZXh0JylcblxuICBpdCAnc2hvdWxkIGFjY2VwdCByZXZpc2lvbiBhcyBzdHJpbmcnLCAtPlxuICAgIHZlcnNpb24gPSByZXZpc2lvbi5jcmVhdGUgJzEnLCBkYXRhXG4gICAgZXhwZWN0KHZlcnNpb24uam91cm5hbC5sZW5ndGgpLnRvLmJlKDIpXG5cbiAgZGVzY3JpYmUgJ2pvdXJuYWwgZW50cnkgdHlwZXMnLCAtPlxuXG4gICAgZGVzY3JpYmUgJ2NyZWF0ZScsIC0+XG5cbiAgICAgIGl0ICdzaG91bGQgdXNlIG9yaWdpbmFsIHRpdGxlIGlmIGl0ZW0gaGFzIG5vIHRpdGxlJywgLT5cbiAgICAgICAgdmVyc2lvbiA9IHJldmlzaW9uLmNyZWF0ZSAwLCBkYXRhXG4gICAgICAgIGV4cGVjdCh2ZXJzaW9uLnRpdGxlKS50by5lcWwoJ25ldy1wYWdlJylcblxuICAgICAgaXQgJ3Nob3VsZCBkZWZpbmUgdGhlIHRpdGxlIG9mIHRoZSB2ZXJzaW9uJywgLT5cbiAgICAgICAgcGFnZVdpdGhOZXdUaXRsZSA9IGpRdWVyeS5leHRlbmQodHJ1ZSwge30sIGRhdGEpXG4gICAgICAgIHBhZ2VXaXRoTmV3VGl0bGUuam91cm5hbFswXS5pdGVtLnRpdGxlID0gXCJuZXctdGl0bGVcIlxuICAgICAgICB2ZXJzaW9uID0gcmV2aXNpb24uY3JlYXRlIDAsIHBhZ2VXaXRoTmV3VGl0bGVcbiAgICAgICAgZXhwZWN0KHZlcnNpb24udGl0bGUpLnRvLmVxbCgnbmV3LXRpdGxlJylcblxuICAgIGRlc2NyaWJlICdhZGQnLCAtPlxuXG4gICAgICBkZXNjcmliZSAndXNpbmcgYSBmYWN0b3J5JywgLT5cbiAgICAgICAgaXQgJ3Nob3VsZCByZWNvdmVyIHRoZSBmYWN0b3J5IGFzIGxhc3QgaXRlbSBvZiB0aGUgc3RvcnknLCAtPlxuICAgICAgICAgIHZlcnNpb24gPSByZXZpc2lvbi5jcmVhdGUgMSwgZGF0YVxuICAgICAgICAgIGV4cGVjdCh2ZXJzaW9uLnN0b3J5WzBdLnR5cGUpLnRvLmJlKFwiZmFjdG9yeVwiKVxuXG4gICAgICBkZXNjcmliZSAnZHJhZ2dpbmcgaXRlbSBmcm9tIGFub3RoZXIgcGFnZScsIC0+XG4gICAgICAgIGl0ICdzaG91bGQgcGxhY2Ugc3RvcnkgaXRlbSBvbiBkcm9wcGVkIHBvc2l0aW9uJywgLT5cbiAgICAgICAgICB2ZXJzaW9uID0gcmV2aXNpb24uY3JlYXRlIDUsIGRhdGFcbiAgICAgICAgICBleHBlY3QodmVyc2lvbi5zdG9yeVsxXS50ZXh0KS50by5iZShcIlN0YXJ0IHdyaXRpbmcuIFJlYWQgW1tIb3cgdG8gV2lraV1dIGZvciBtb3JlIGlkZWFzLlwiKVxuXG4gICAgICAgIGl0ICdzaG91bGQgcGxhY2Ugc3RvcnkgaXRlbSBhdCB0aGUgZW5kIGlmIGRyb3BwZWQgcG9zaXRpb24gaXMgbm90IGRlZmluZWQnLCAtPlxuICAgICAgICAgIGRyYWdnZWRJdGVtV2l0aG91dEFmdGVyID0galF1ZXJ5LmV4dGVuZCh0cnVlLCB7fSwgZGF0YSlcbiAgICAgICAgICBkZWxldGUgZHJhZ2dlZEl0ZW1XaXRob3V0QWZ0ZXIuam91cm5hbFs1XS5hZnRlclxuICAgICAgICAgIHZlcnNpb24gPSByZXZpc2lvbi5jcmVhdGUgNSwgZHJhZ2dlZEl0ZW1XaXRob3V0QWZ0ZXJcbiAgICAgICAgICBleHBlY3QodmVyc2lvbi5zdG9yeVsyXS50ZXh0KS50by5iZShcIlN0YXJ0IHdyaXRpbmcuIFJlYWQgW1tIb3cgdG8gV2lraV1dIGZvciBtb3JlIGlkZWFzLlwiKVxuXG4gICAgICBkZXNjcmliZSAnc3BsaXR0aW5nIHBhcmFncmFwaCcsIC0+XG4gICAgICAgIGl0ICdzaG91bGQgcGxhY2UgcGFyYWdyYXBocyBhZnRlciBlYWNoIG90aGVyJywgLT5cbiAgICAgICAgICB2ZXJzaW9uID0gcmV2aXNpb24uY3JlYXRlIDgsIGRhdGFcbiAgICAgICAgICBleHBlY3QodmVyc2lvbi5zdG9yeVswXS50ZXh0KS50by5iZSgnQSBuZXcgcGFyYWdyYXBoIGlzIG5vdycpXG4gICAgICAgICAgZXhwZWN0KHZlcnNpb24uc3RvcnlbMV0udGV4dCkudG8uYmUoJyBmaXJzdCcpXG5cbiAgICAgICAgaXQgJ3Nob3VsZCBwbGFjZSBuZXcgcGFyYWdyYXBoIGF0IHRoZSBlbmQgaWYgc3BsaXQgaXRlbSBpcyBub3QgZGVmaW5lZCcsIC0+XG4gICAgICAgICAgc3BsaXRQYXJhZ3JhcGhXaXRob3V0QWZ0ZXIgPSBqUXVlcnkuZXh0ZW5kKHRydWUsIHt9LCBkYXRhKVxuICAgICAgICAgIGRlbGV0ZSBzcGxpdFBhcmFncmFwaFdpdGhvdXRBZnRlci5qb3VybmFsWzhdLmFmdGVyXG4gICAgICAgICAgdmVyc2lvbiA9IHJldmlzaW9uLmNyZWF0ZSA4LCBzcGxpdFBhcmFncmFwaFdpdGhvdXRBZnRlclxuICAgICAgICAgIGV4cGVjdCh2ZXJzaW9uLnN0b3J5WzBdLnRleHQpLnRvLmJlKCdBIG5ldyBwYXJhZ3JhcGggaXMgbm93JylcbiAgICAgICAgICBleHBlY3QodmVyc2lvbi5zdG9yeVszXS50ZXh0KS50by5iZSgnIGZpcnN0JylcblxuICAgIGRlc2NyaWJlICdlZGl0JywgLT5cblxuICAgICAgaXQgJ3Nob3VsZCByZXBsYWNlIGVkaXRlZCBzdG9yeSBpdGVtJywgLT5cbiAgICAgICAgdmVyc2lvbiA9IHJldmlzaW9uLmNyZWF0ZSA3LCBkYXRhXG4gICAgICAgIGV4cGVjdCh2ZXJzaW9uLnN0b3J5WzBdLnRleHQpLnRvLmJlKCdBIG5ldyBwYXJhZ3JhcGggaXMgbm93JylcblxuICAgICAgaXQgJ3Nob3VsZCBwbGFjZSBpdGVtIGF0IHRoZSBlbmQgaWYgZWRpdGVkIGl0ZW0gaXMgbm90IGZvdW5kJywgLT5cbiAgICAgICAgcGFnZVdpdGhPbmx5RWRpdCA9IHV0aWwuZW1wdHlQYWdlKClcbiAgICAgICAgZWRpdGVkSXRlbSA9IHtcbiAgICAgICAgICBcInR5cGVcIjogXCJwYXJhZ3JhcGhcIixcbiAgICAgICAgICBcImlkXCI6IFwiMmIzZTFiZWY3MDhjYjhkM1wiLFxuICAgICAgICAgIFwidGV4dFwiOiBcIkEgbmV3IHBhcmFncmFwaFwiXG4gICAgICAgIH1cbiAgICAgICAgcGFnZVdpdGhPbmx5RWRpdC5qb3VybmFsLnB1c2gge1xuICAgICAgICAgIFwidHlwZVwiOiBcImVkaXRcIixcbiAgICAgICAgICBcImlkXCI6IFwiMmIzZTFiZWY3MDhjYjhkM1wiLFxuICAgICAgICAgIFwiaXRlbVwiOiBlZGl0ZWRJdGVtLFxuICAgICAgICAgIFwiZGF0ZVwiOiAxMzQxMTkxNzQ4OTQ0XG4gICAgICAgIH1cbiAgICAgICAgdmVyc2lvbiA9IHJldmlzaW9uLmNyZWF0ZSAxLCBwYWdlV2l0aE9ubHlFZGl0XG4gICAgICAgIGV4cGVjdCh2ZXJzaW9uLnN0b3J5WzBdLnRleHQpLnRvLmJlKCdBIG5ldyBwYXJhZ3JhcGgnKVxuXG4gICAgZGVzY3JpYmUgJ21vdmUnLCAtPlxuICAgICAgaXQgJ3Nob3VsZCByZW9yZGVyIHRoZSBzdG9yeSBpdGVtcyBhY2NvcmRpbmcgdG8gbW92ZSBvcmRlcicsIC0+XG4gICAgICAgIHZlcnNpb24gPSByZXZpc2lvbi5jcmVhdGUgNSwgZGF0YVxuICAgICAgICBleHBlY3QodmVyc2lvbi5zdG9yeVswXS50ZXh0KS50by5iZSgnU29tZSBwYXJhZ3JhcGggdGV4dCcpXG4gICAgICAgIGV4cGVjdCh2ZXJzaW9uLnN0b3J5WzFdLnRleHQpLnRvLmJlKCdTdGFydCB3cml0aW5nLiBSZWFkIFtbSG93IHRvIFdpa2ldXSBmb3IgbW9yZSBpZGVhcy4nKVxuICAgICAgICBleHBlY3QodmVyc2lvbi5zdG9yeVsyXS50ZXh0KS50by5iZSgnQSBuZXcgcGFyYWdyYXBoIGFmdGVyIHRoZSBmaXJzdCcpXG5cbiAgICAgICAgdmVyc2lvbiA9IHJldmlzaW9uLmNyZWF0ZSA2LCBkYXRhXG4gICAgICAgIGV4cGVjdCh2ZXJzaW9uLnN0b3J5WzBdLnRleHQpLnRvLmJlKCdBIG5ldyBwYXJhZ3JhcGggYWZ0ZXIgdGhlIGZpcnN0JylcbiAgICAgICAgZXhwZWN0KHZlcnNpb24uc3RvcnlbMV0udGV4dCkudG8uYmUoJ1N0YXJ0IHdyaXRpbmcuIFJlYWQgW1tIb3cgdG8gV2lraV1dIGZvciBtb3JlIGlkZWFzLicpXG4gICAgICAgIGV4cGVjdCh2ZXJzaW9uLnN0b3J5WzJdLnRleHQpLnRvLmJlKCdTb21lIHBhcmFncmFwaCB0ZXh0JylcblxuICAgIGRlc2NyaWJlICdyZW1vdmUnLCAtPlxuICAgICAgaXQgJ3Nob3VsZCByZW1vdmUgdGhlIHN0b3J5IGl0ZW0nLCAtPlxuICAgICAgICB2ZXJzaW9uID0gcmV2aXNpb24uY3JlYXRlIDgsIGRhdGFcbiAgICAgICAgZXhwZWN0KHZlcnNpb24uc3RvcnlbMF0udGV4dCkudG8uYmUoJ0EgbmV3IHBhcmFncmFwaCBpcyBub3cnKVxuICAgICAgICBleHBlY3QodmVyc2lvbi5zdG9yeVsxXS50ZXh0KS50by5iZSgnIGZpcnN0JylcbiAgICAgICAgZXhwZWN0KHZlcnNpb24uc3RvcnlbMl0udGV4dCkudG8uYmUoJ1N0YXJ0IHdyaXRpbmcuIFJlYWQgW1tIb3cgdG8gV2lraV1dIGZvciBtb3JlIGlkZWFzLicpXG4gICAgICAgIGV4cGVjdCh2ZXJzaW9uLnN0b3J5WzNdLnRleHQpLnRvLmJlKCdTb21lIHBhcmFncmFwaCB0ZXh0JylcblxuICAgICAgICB2ZXJzaW9uID0gcmV2aXNpb24uY3JlYXRlIDksIGRhdGFcbiAgICAgICAgZXhwZWN0KHZlcnNpb24uc3RvcnlbMF0udGV4dCkudG8uYmUoJ0EgbmV3IHBhcmFncmFwaCBpcyBub3cnKVxuICAgICAgICBleHBlY3QodmVyc2lvbi5zdG9yeVsxXS50ZXh0KS50by5iZSgnU3RhcnQgd3JpdGluZy4gUmVhZCBbW0hvdyB0byBXaWtpXV0gZm9yIG1vcmUgaWRlYXMuJylcbiAgICAgICAgZXhwZWN0KHZlcnNpb24uc3RvcnlbMl0udGV4dCkudG8uYmUoJ1NvbWUgcGFyYWdyYXBoIHRleHQnKVxuIiwibmVpZ2hib3Job29kID0gcmVxdWlyZSAnLi4vbGliL25laWdoYm9yaG9vZC5jb2ZmZWUnXG5cbmRlc2NyaWJlICduZWlnaGJvcmhvb2QnLCAtPlxuXG4gIGRlc2NyaWJlICdubyBuZWlnaGJvcnMnLCAtPlxuICAgIGl0ICdzaG91bGQgcmV0dXJuIGFuIGVtcHR5IGFycmF5IGZvciBvdXIgc2VhcmNoJywgLT5cbiAgICAgIHNlYXJjaFJlc3VsdCA9IG5laWdoYm9yaG9vZC5zZWFyY2goIFwicXVlcnkgc3RyaW5nXCIgKVxuICAgICAgZXhwZWN0KHNlYXJjaFJlc3VsdC5maW5kcykudG8uZXFsKCBbXSApXG5cblxuICBkZXNjcmliZSAnYSBzaW5nbGUgbmVpZ2hib3Igd2l0aCBhIGZldyBwYWdlcycsIC0+XG4gICAgYmVmb3JlIC0+XG4gICAgICBmYWtlU2l0ZW1hcCA9IFtcbiAgICAgICAgeyB0aXRsZTogJ1BhZ2UgT25lJywgc2x1ZzogJ3BhZ2Utb25lJywgZGF0ZTogJ2RhdGUxJyB9LFxuICAgICAgICB7IHRpdGxlOiAnUGFnZSBUd28nLCBzbHVnOiAncGFnZS10d28nLCBkYXRlOiAnZGF0ZTInIH0sXG4gICAgICAgIHsgdGl0bGU6ICdQYWdlIFRocmVlJyB9XG4gICAgICBdXG5cbiAgICAgIG5laWdoYm9yID0ge1xuICAgICAgICBzaXRlbWFwOiBmYWtlU2l0ZW1hcFxuICAgICAgfVxuXG4gICAgICB3aWtpLm5laWdoYm9yaG9vZCA9IHt9XG4gICAgICB3aWtpLm5laWdoYm9yaG9vZFsnbXktc2l0ZSddID0gbmVpZ2hib3JcblxuICAgIGl0ICdyZXR1cm5zIGFsbCBwYWdlcyB0aGF0IG1hdGNoIHRoZSBxdWVyeScsIC0+XG4gICAgICBzZWFyY2hSZXN1bHQgPSBuZWlnaGJvcmhvb2Quc2VhcmNoKCBcIlBhZ2VcIiApXG4gICAgICBleHBlY3QoIHNlYXJjaFJlc3VsdC5maW5kcyApLnRvLmhhdmUubGVuZ3RoKDMpXG5cbiAgICBpdCAncmV0dXJucyBvbmx5IHBhZ2VzIHRoYXQgbWF0Y2ggdGhlIHF1ZXJ5JywgLT5cbiAgICAgIHNlYXJjaFJlc3VsdCA9IG5laWdoYm9yaG9vZC5zZWFyY2goIFwiUGFnZSBUXCIgKVxuICAgICAgZXhwZWN0KCBzZWFyY2hSZXN1bHQuZmluZHMgKS50by5oYXZlLmxlbmd0aCgyKVxuXG4gICAgaXQgJ3Nob3VsZCBwYWNrYWdlIHRoZSByZXN1bHRzIGluIHRoZSBjb3JyZWN0IGZvcm1hdCcsIC0+XG4gICAgICBleHBlY3RlZFJlc3VsdCA9IFtcbiAgICAgICAge1xuICAgICAgICAgIHNpdGU6ICdteS1zaXRlJyxcbiAgICAgICAgICBwYWdlOiB7IHRpdGxlOiAnUGFnZSBUd28nLCBzbHVnOiAncGFnZS10d28nLCBkYXRlOiAnZGF0ZTInIH0sXG4gICAgICAgICAgcmFuazogMVxuICAgICAgICB9XG4gICAgICBdXG4gICAgICBzZWFyY2hSZXN1bHQgPSBuZWlnaGJvcmhvb2Quc2VhcmNoKCBcIlBhZ2UgVHdvXCIgKVxuICAgICAgZXhwZWN0KCBzZWFyY2hSZXN1bHQuZmluZHMgKS50by5lcWwoIGV4cGVjdGVkUmVzdWx0IClcblxuXG4gICAgaXQgJ3NlYXJjaGVzIGJvdGggdGhlIHNsdWcgYW5kIHRoZSB0aXRsZSdcblxuICBkZXNjcmliZSAnbW9yZSB0aGFuIG9uZSBuZWlnaGJvcicsIC0+XG4gICAgYmVmb3JlIC0+XG4gICAgICB3aWtpLm5laWdoYm9yaG9vZCA9IHt9XG4gICAgICB3aWtpLm5laWdoYm9yaG9vZFsnc2l0ZS1vbmUnXSA9IHtcbiAgICAgICAgc2l0ZW1hcDogW1xuICAgICAgICAgIHsgdGl0bGU6ICdQYWdlIE9uZSBmcm9tIFNpdGUgMScgfSxcbiAgICAgICAgICB7IHRpdGxlOiAnUGFnZSBUd28gZnJvbSBTaXRlIDEnIH0sXG4gICAgICAgICAgeyB0aXRsZTogJ1BhZ2UgVGhyZWUgZnJvbSBTaXRlIDEnIH1cbiAgICAgICAgXVxuICAgICAgfVxuXG4gICAgICB3aWtpLm5laWdoYm9yaG9vZFsnc2l0ZS10d28nXSA9IHtcbiAgICAgICAgc2l0ZW1hcDogW1xuICAgICAgICAgIHsgdGl0bGU6ICdQYWdlIE9uZSBmcm9tIFNpdGUgMicgfSxcbiAgICAgICAgICB7IHRpdGxlOiAnUGFnZSBUd28gZnJvbSBTaXRlIDInIH0sXG4gICAgICAgICAgeyB0aXRsZTogJ1BhZ2UgVGhyZWUgZnJvbSBTaXRlIDInIH1cbiAgICAgICAgXVxuICAgICAgfVxuXG4gICAgaXQgJ3JldHVybnMgbWF0Y2hpbmcgcGFnZXMgZnJvbSBldmVyeSBuZWlnaGJvcicsIC0+XG4gICAgICBzZWFyY2hSZXN1bHQgPSBuZWlnaGJvcmhvb2Quc2VhcmNoKCBcIlBhZ2UgVHdvXCIgKVxuICAgICAgZXhwZWN0KCBzZWFyY2hSZXN1bHQuZmluZHMgKS50by5oYXZlLmxlbmd0aCgyKVxuICAgICAgc2l0ZXMgPSBfLnBsdWNrKCBzZWFyY2hSZXN1bHQuZmluZHMsICdzaXRlJyApXG4gICAgICBleHBlY3QoIHNpdGVzLnNvcnQoKSApLnRvLmVxbCggWydzaXRlLW9uZScsJ3NpdGUtdHdvJ10uc29ydCgpIClcblxuXG4gIGRlc2NyaWJlICdhbiB1bnBvcHVsYXRlZCBuZWlnaGJvcicsIC0+XG4gICAgYmVmb3JlIC0+XG4gICAgICB3aWtpLm5laWdoYm9yaG9vZCA9IHt9XG4gICAgICB3aWtpLm5laWdoYm9yaG9vZFsndW5wb3B1bGF0ZWQtc2l0ZSddID0ge31cblxuICAgIGl0ICdncmFjZWZ1bGx5IGlnbm9yZXMgdW5wb3B1bGF0ZWQgbmVpZ2hib3JzJywgLT5cbiAgICAgIHNlYXJjaFJlc3VsdCA9IG5laWdoYm9yaG9vZC5zZWFyY2goIFwic29tZSBzZWFyY2ggcXVlcnlcIiApXG4gICAgICBleHBlY3QoIHNlYXJjaFJlc3VsdC5maW5kcyApLnRvLmJlLmVtcHR5KClcblxuICAgIGl0ICdzaG91bGQgcmUtcG9wdWxhdGUgdGhlIG5laWdoYm9yJ1xuIiwiY3JlYXRlU2VhcmNoID0gcmVxdWlyZSAnLi4vbGliL3NlYXJjaC5jb2ZmZWUnXG5cbmRlc2NyaWJlICdzZWFyY2gnLCAtPlxuICAjIENhbid0IHRlc3QgZm9yIHJpZ2h0IG5vdywgYmVjYXVzZSBwZXJmb3JtaW5nIGEgc2VhcmNoXG4gICMgZG9lcyBET00gbWFuaXB1bGF0aW9uIHRvIGJ1aWxkIGEgcGFnZSwgd2hpY2ggZmFpbHMgaW4gdGhlIHRlc3QgcnVubmVyLiBXZSdkIGxpa2UgdG8gaXNvbGF0ZSB0aGF0IERPTSBtYW5pcHVsYXRpb24sIGJ1dCBjYW4ndCByaWdodCBub3cuXG4gIHhpdCAncGVyZm9ybXMgYSBzZWFyY2ggb24gdGhlIG5laWdoYm9yaG9vZCcsIC0+XG4gICAgc3B5TmVpZ2hib3Job29kID0ge1xuICAgICAgc2VhcmNoOiBzaW5vbi5zdHViKCkucmV0dXJucyhbXSlcbiAgICB9XG4gICAgc2VhcmNoID0gY3JlYXRlU2VhcmNoKCBuZWlnaGJvcmhvb2Q6IHNweU5laWdoYm9yaG9vZCApXG4gICAgc2VhcmNoLnBlcmZvcm1TZWFyY2goICdzb21lIHNlYXJjaCBxdWVyeScgKVxuXG4gICAgZXhwZWN0KCBzcHlOZWlnaGJvcmhvb2Quc2VhcmNoLmNhbGxlZCApLnRvLmJlKHRydWUpXG4gICAgZXhwZWN0KCBzcHlOZWlnaGJvcmhvb2Quc2VhcmNoLmFyZ3NbMF1bMF0gKS50by5iZSgnc29tZSBzZWFyY2ggcXVlcnknKVxuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjYuMlxuKGZ1bmN0aW9uKCkge1xuICB2YXIgYXBwbHksIGJpbmQsIGVtaXQsIHBhcnNlLCByZXBvcnQsIHZhbHVlO1xuXG4gIHBhcnNlID0gZnVuY3Rpb24odGV4dCkge1xuICAgIHZhciBkZWZuLCBsaW5lLCBwcmV2LCB3b3JkLCB3b3JkcywgX2ksIF9qLCBfbGVuLCBfbGVuMSwgX3JlZiwgX3JlZjE7XG5cbiAgICBkZWZuID0ge307XG4gICAgX3JlZiA9IHRleHQuc3BsaXQoL1xcbisvKTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIGxpbmUgPSBfcmVmW19pXTtcbiAgICAgIHdvcmRzID0gbGluZS5zcGxpdCgvXFxzKy8pO1xuICAgICAgaWYgKHdvcmRzWzBdKSB7XG4gICAgICAgIGRlZm5bd29yZHNbMF1dID0gcHJldiA9IHdvcmRzLnNsaWNlKDEsIDEwMDApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX3JlZjEgPSB3b3Jkcy5zbGljZSgxLCAxMDAwKTtcbiAgICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gX3JlZjEubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgICAgd29yZCA9IF9yZWYxW19qXTtcbiAgICAgICAgICBwcmV2LnB1c2god29yZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRlZm47XG4gIH07XG5cbiAgdmFsdWUgPSBmdW5jdGlvbih0eXBlLCBudW1iZXIsIGFyZykge1xuICAgIHZhciBzdHJpbmc7XG5cbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ0EnOlxuICAgICAgICBpZiAobnVtYmVyLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiBhcmdbK251bWJlcl07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGFyZztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ0InOlxuICAgICAgICByZXR1cm4gMSAmIChhcmcgPj4gKG51bWJlciB8fCAwKSk7XG4gICAgICBjYXNlICdDJzpcbiAgICAgICAgc3RyaW5nID0gYXJnLnRvU3RyaW5nKCk7XG4gICAgICAgIGlmIChudW1iZXIgPCBzdHJpbmcubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuIHN0cmluZy5jaGFyQ29kZUF0KG51bWJlcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIDMyO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnRCc6XG4gICAgICAgIHJldHVybiA0OCArIE1hdGguZmxvb3IoK2FyZyAvIChNYXRoLnBvdygxMCwgbnVtYmVyKSkgJSAxMCk7XG4gICAgICBjYXNlICcnOlxuICAgICAgICByZXR1cm4gbnVtYmVyO1xuICAgIH1cbiAgfTtcblxuICBhcHBseSA9IGZ1bmN0aW9uKGRlZm4sIGNhbGwsIGFyZywgZW1pdCkge1xuICAgIHZhciB3b3JkcywgX3JlZjtcblxuICAgIGlmICghKHdvcmRzID0gKF9yZWYgPSBkZWZuW2NhbGxdKSAhPSBudWxsID8gX3JlZi5zbGljZSgwKSA6IHZvaWQgMCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIChmdW5jdGlvbihzdGFjaywgcmVzdWx0KSB7XG4gICAgICB2YXIgbmV4dCwgc2VuZDtcblxuICAgICAgc2VuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdGV4dDtcblxuICAgICAgICBpZiAoIXJlc3VsdC5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGV4dCA9IFwiXCIgKyAocmVzdWx0LmpvaW4oJyAnKSkgKyBcIlxcblwiO1xuICAgICAgICByZXN1bHQgPSBbXTtcbiAgICAgICAgcmV0dXJuIGVtaXQodGV4dCwgc3RhY2ssIG5leHQpO1xuICAgICAgfTtcbiAgICAgIG5leHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG0sIHdvcmQsIF9yZWYxLCBfcmVmMiwgX3JlZjM7XG5cbiAgICAgICAgaWYgKCFzdGFjay5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgd29yZCA9IChfcmVmMSA9IHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdKSAhPSBudWxsID8gX3JlZjEud29yZHMuc2hpZnQoKSA6IHZvaWQgMDtcbiAgICAgICAgYXJnID0gKF9yZWYyID0gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0pICE9IG51bGwgPyBfcmVmMi5hcmcgOiB2b2lkIDA7XG4gICAgICAgIGlmICh3b3JkID09PSB2b2lkIDApIHtcbiAgICAgICAgICBzdGFjay5wb3AoKTtcbiAgICAgICAgfSBlbHNlIGlmICh3b3JkID09PSAnTkwnKSB7XG4gICAgICAgICAgcmV0dXJuIHNlbmQoKTtcbiAgICAgICAgfSBlbHNlIGlmIChtID0gd29yZC5tYXRjaCgvXihbQUJDRF0pKFswLTldKikkLykpIHtcbiAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZShtWzFdLCBtWzJdLCBhcmcpKTtcbiAgICAgICAgfSBlbHNlIGlmIChtID0gd29yZC5tYXRjaCgvXihbQS1aXVtBLVowLTldKikoXFwvKFtBQkNEXT8pKFswLTldKikpPyQvKSkge1xuICAgICAgICAgIGlmIChzdGFjay5sZW5ndGggPCAxMCAmJiAod29yZHMgPSAoX3JlZjMgPSBkZWZuW21bMV1dKSAhPSBudWxsID8gX3JlZjMuc2xpY2UoMCkgOiB2b2lkIDApKSB7XG4gICAgICAgICAgICBpZiAobVsyXSkge1xuICAgICAgICAgICAgICBhcmcgPSB2YWx1ZShtWzNdLCBtWzRdLCBhcmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RhY2sucHVzaCh7XG4gICAgICAgICAgICAgIGNhbGw6IHdvcmQsXG4gICAgICAgICAgICAgIGFyZzogYXJnLFxuICAgICAgICAgICAgICB3b3Jkczogd29yZHNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHQucHVzaCh3b3JkKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhY2subGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gc2VuZCgpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgaWYgKHdvcmRzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgfVxuICAgIH0pKFtcbiAgICAgIHtcbiAgICAgICAgY2FsbDogY2FsbCxcbiAgICAgICAgYXJnOiBhcmcsXG4gICAgICAgIHdvcmRzOiB3b3Jkc1xuICAgICAgfVxuICAgIF0sIFtdKTtcbiAgfTtcblxuICByZXBvcnQgPSBmdW5jdGlvbihkZWZuKSB7XG4gICAgdmFyIGtleSwgd29yZCwgd29yZHMsIF9pLCBfbGVuO1xuXG4gICAgcmVwb3J0ID0gW107XG4gICAgZm9yIChrZXkgaW4gZGVmbikge1xuICAgICAgd29yZHMgPSBkZWZuW2tleV07XG4gICAgICByZXBvcnQucHVzaChcIjxsaSBjbGFzcz1cXFwiXCIgKyBrZXkgKyBcIlxcXCI+PHNwYW4+XCIgKyBrZXkgKyBcIjwvc3Bhbj5cIik7XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHdvcmRzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIHdvcmQgPSB3b3Jkc1tfaV07XG4gICAgICAgIHJlcG9ydC5wdXNoKFwiPHNwYW4+XCIgKyB3b3JkICsgXCI8L3NwYW4+XCIpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVwb3J0LmpvaW4oJyAnKTtcbiAgfTtcblxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUgIT09IG51bGwpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgIHBhcnNlOiBwYXJzZSxcbiAgICAgIGFwcGx5OiBhcHBseVxuICAgIH07XG4gIH1cblxuICBlbWl0ID0gZnVuY3Rpb24oJGl0ZW0sIGl0ZW0pIHtcbiAgICByZXR1cm4gJGl0ZW0uYXBwZW5kKFwiPGRpdiBzdHlsZT1cXFwid2lkdGg6OTMlOyBiYWNrZ3JvdW5kOiNlZWU7IHBhZGRpbmc6LjhlbTsgbWFyZ2luLWJvdHRvbTo1cHg7XFxcIj5cXG4gIDxwIGNsYXNzPVxcXCJyZXBvcnRcXFwiIHN0eWxlPVxcXCJ3aGl0ZS1zcGFjZTogcHJlOyB3aGl0ZS1zcGFjZTogcHJlLXdyYXA7XFxcIj5cIiArIGl0ZW0udGV4dCArIFwiPC9wPlxcbiAgPHAgY2xhc3M9XFxcImNhcHRpb25cXFwiPnN0YXR1cyBoZXJlPC9wPlxcbjwvZGl2PlwiKTtcbiAgfTtcblxuICBiaW5kID0gZnVuY3Rpb24oJGl0ZW0sIGl0ZW0pIHtcbiAgICB2YXIgJHBhZ2UsIGRlZm4sIGZyYW1lLCBob3N0LCBvbGRyZXNwb25zZSwgcHJvZ3Jlc3MsIHJjdmQsIHJlc3BvbnNlLCBycmVwdCwgc2VudCwgc29ja2V0LCBzcmVwdCwgc3RhcnRUaWNraW5nLCB0aWNrLCB0aW1lciwgdHJpZ2dlcjtcblxuICAgIGRlZm4gPSBwYXJzZShpdGVtLnRleHQpO1xuICAgICRwYWdlID0gJGl0ZW0ucGFyZW50cygnLnBhZ2U6Zmlyc3QnKTtcbiAgICBob3N0ID0gJHBhZ2UuZGF0YSgnc2l0ZScpIHx8IGxvY2F0aW9uLmhvc3Q7XG4gICAgaWYgKGhvc3QgPT09ICdvcmlnaW4nIHx8IGhvc3QgPT09ICdsb2NhbCcpIHtcbiAgICAgIGhvc3QgPSBsb2NhdGlvbi5ob3N0O1xuICAgIH1cbiAgICBzb2NrZXQgPSBuZXcgV2ViU29ja2V0KFwid3M6Ly9cIiArIGhvc3QgKyBcIi9wbHVnaW4vdHh0enltZVwiKTtcbiAgICBzZW50ID0gcmN2ZCA9IDA7XG4gICAgc3JlcHQgPSBycmVwdCA9IFwiXCI7XG4gICAgb2xkcmVzcG9uc2UgPSByZXNwb25zZSA9IFtdO1xuICAgIGlmIChpdGVtLnRleHQucmVwbGFjZSgvXy4qP18vZywgJycpLm1hdGNoKC9wLykpIHtcbiAgICAgICRpdGVtLmFkZENsYXNzKCdzZXF1ZW5jZS1zb3VyY2UnKTtcbiAgICAgICRpdGVtLmdldCgwKS5nZXRTZXF1ZW5jZURhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHJlc3BvbnNlLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gb2xkcmVzcG9uc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICAgIGZyYW1lID0gMDtcbiAgICB0aWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJnLCBub3c7XG5cbiAgICAgIGZyYW1lID0gZnJhbWUgJSA0MCArIDE7XG4gICAgICBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgYXJnID0gW2ZyYW1lLCBub3cuZ2V0U2Vjb25kcygpLCBub3cuZ2V0TWludXRlcygpLCBub3cuZ2V0SG91cnMoKV07XG4gICAgICB0cmlnZ2VyKCdGUkFNRScsIGFyZyk7XG4gICAgICBpZiAoZnJhbWUgIT09IDEpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgYXJnLnNoaWZ0KCk7XG4gICAgICB0cmlnZ2VyKCdTRUNPTkQnLCBhcmcpO1xuICAgICAgaWYgKGFyZ1swXSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0cmlnZ2VyKCdNSU5VVEUnLCBhcmcpO1xuICAgICAgaWYgKGFyZ1sxXSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0cmlnZ2VyKCdIT1VSJywgYXJnKTtcbiAgICAgIGlmIChhcmdbMl0pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRyaWdnZXIoJ0RBWScsIGFyZyk7XG4gICAgfTtcbiAgICB0aW1lciA9IG51bGw7XG4gICAgc3RhcnRUaWNraW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICB0aW1lciA9IHNldEludGVydmFsKHRpY2ssIDI1KTtcbiAgICAgIHJldHVybiB0aWNrKCk7XG4gICAgfTtcbiAgICBzZXRUaW1lb3V0KHN0YXJ0VGlja2luZywgMTAwMCAtIChuZXcgRGF0ZSgpLmdldE1pbGxpc2Vjb25kcygpKSk7XG4gICAgJGl0ZW0uZGJsY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgICAgIGlmIChzb2NrZXQgIT0gbnVsbCkge1xuICAgICAgICBzb2NrZXQuY2xvc2UoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB3aWtpLnRleHRFZGl0b3IoJGl0ZW0sIGl0ZW0pO1xuICAgIH0pO1xuICAgICQoXCIubWFpblwiKS5vbigndGh1bWInLCBmdW5jdGlvbihldnQsIHRodW1iKSB7XG4gICAgICByZXR1cm4gdHJpZ2dlcignVEhVTUInLCB0aHVtYik7XG4gICAgfSk7XG4gICAgJGl0ZW0uZGVsZWdhdGUoJy5yY3ZkJywgJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gd2lraS5kaWFsb2coXCJUeHR6eW1lIFJlc3BvbnNlc1wiLCBcIjxwcmU+XCIgKyAocmVzcG9uc2Uuam9pbihcIlxcblwiKSkpO1xuICAgIH0pO1xuICAgIHRyaWdnZXIgPSBmdW5jdGlvbih3b3JkLCBhcmcpIHtcbiAgICAgIGlmIChhcmcgPT0gbnVsbCkge1xuICAgICAgICBhcmcgPSAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFwcGx5KGRlZm4sIHdvcmQsIGFyZywgZnVuY3Rpb24obWVzc2FnZSwgc3RhY2ssIGRvbmUpIHtcbiAgICAgICAgdmFyIGNhbGwsIHRvZG8sIHdvcmRzO1xuXG4gICAgICAgIHRvZG8gPSAoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBfaSwgX2xlbiwgX3JlZiwgX3Jlc3VsdHM7XG5cbiAgICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gc3RhY2subGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgICAgIF9yZWYgPSBzdGFja1tfaV0sIGNhbGwgPSBfcmVmLmNhbGwsIHdvcmRzID0gX3JlZi53b3JkcztcbiAgICAgICAgICAgIF9yZXN1bHRzLnB1c2goXCJcIiArIGNhbGwgKyBcIiBcIiArICh3b3Jkcy5qb2luKCcgJykpICsgXCI8YnI+XCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICAgIH0pKCkpLmpvaW4oJycpO1xuICAgICAgICAkaXRlbS5maW5kKCdwLnJlcG9ydCcpLmh0bWwoXCJcIiArIHRvZG8gKyBtZXNzYWdlKTtcbiAgICAgICAgaWYgKHNvY2tldCkge1xuICAgICAgICAgIHByb2dyZXNzKChzcmVwdCA9IFwiIFwiICsgKCsrc2VudCkgKyBcIiBzZW50IFwiKSArIHJyZXB0KTtcbiAgICAgICAgICBpZiAocmVzcG9uc2UubGVuZ3RoKSB7XG4gICAgICAgICAgICB3aW5kb3cuZGlhbG9nLmh0bWwoXCI8cHJlPlwiICsgKHJlc3BvbnNlLmpvaW4oXCJcXG5cIikpKTtcbiAgICAgICAgICAgICRpdGVtLnRyaWdnZXIoJ3NlcXVlbmNlJywgW3Jlc3BvbnNlXSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc3BvbnNlID0gW107XG4gICAgICAgICAgc29ja2V0LnNlbmQobWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZG9uZSwgMjAwKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcHJvZ3Jlc3MgPSBmdW5jdGlvbihtKSB7XG4gICAgICByZXR1cm4gJGl0ZW0uZmluZCgncC5jYXB0aW9uJykuaHRtbChtKTtcbiAgICB9O1xuICAgIHNvY2tldC5vbm9wZW4gPSBmdW5jdGlvbigpIHtcbiAgICAgIHByb2dyZXNzKFwib3BlbmVkXCIpO1xuICAgICAgcmV0dXJuIHRyaWdnZXIoJ09QRU4nKTtcbiAgICB9O1xuICAgIHNvY2tldC5vbm1lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgbGluZSwgX2ksIF9sZW4sIF9yZWYsIF9yZXN1bHRzO1xuXG4gICAgICBfcmVmID0gZS5kYXRhLnNwbGl0KC9cXHI/XFxuLyk7XG4gICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGxpbmUgPSBfcmVmW19pXTtcbiAgICAgICAgaWYgKGxpbmUpIHtcbiAgICAgICAgICBwcm9ncmVzcyhzcmVwdCArIChycmVwdCA9IFwiPHNwYW4gY2xhc3M9cmN2ZD4gXCIgKyAoKytyY3ZkKSArIFwiIHJjdmQgXCIgKyBsaW5lICsgXCIgPC9zcGFuPlwiKSk7XG4gICAgICAgICAgX3Jlc3VsdHMucHVzaChyZXNwb25zZS5wdXNoKGxpbmUpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfcmVzdWx0cy5wdXNoKHZvaWQgMCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICB9O1xuICAgIHJldHVybiBzb2NrZXQub25jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcHJvZ3Jlc3MoXCJjbG9zZWRcIik7XG4gICAgICByZXR1cm4gc29ja2V0ID0gbnVsbDtcbiAgICB9O1xuICB9O1xuXG4gIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvdyAhPT0gbnVsbCkge1xuICAgIHdpbmRvdy5wbHVnaW5zLnR4dHp5bWUgPSB7XG4gICAgICBlbWl0OiBlbWl0LFxuICAgICAgYmluZDogYmluZFxuICAgIH07XG4gIH1cblxufSkuY2FsbCh0aGlzKTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS42LjJcbihmdW5jdGlvbigpIHtcbiAgdmFyIGFwcGx5LCBiaW5kLCBlbWl0LCBmb3JtYXQsIG1vbnRocywgcGFyc2UsIHNob3csIHNwYW4sIHNwYW5zO1xuXG4gIG1vbnRocyA9IFsnSkFOJywgJ0ZFQicsICdNQVInLCAnQVBSJywgJ01BWScsICdKVU4nLCAnSlVMJywgJ0FVRycsICdTRVAnLCAnT0NUJywgJ05PVicsICdERUMnXTtcblxuICBzcGFucyA9IFsnRUFSTFknLCAnTEFURScsICdERUNBREUnLCAnREFZJywgJ01PTlRIJywgJ1lFQVInXTtcblxuICBzcGFuID0gZnVuY3Rpb24ocmVzdWx0LCBzcGFuKSB7XG4gICAgdmFyIG07XG5cbiAgICBpZiAoKG0gPSBzcGFucy5pbmRleE9mKHJlc3VsdC5zcGFuKSkgPCAwKSB7XG4gICAgICByZXR1cm4gcmVzdWx0LnNwYW4gPSBzcGFuO1xuICAgIH0gZWxzZSBpZiAoKHNwYW5zLmluZGV4T2Yoc3BhbikpIDwgbSkge1xuICAgICAgcmV0dXJuIHJlc3VsdC5zcGFuID0gc3BhbjtcbiAgICB9XG4gIH07XG5cbiAgcGFyc2UgPSBmdW5jdGlvbih0ZXh0KSB7XG4gICAgdmFyIGksIGxpbmUsIG0sIHJlc3VsdCwgcm93cywgd29yZCwgd29yZHMsIF9pLCBfaiwgX2xlbiwgX2xlbjEsIF9yZWY7XG5cbiAgICByb3dzID0gW107XG4gICAgX3JlZiA9IHRleHQuc3BsaXQoL1xcbi8pO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgbGluZSA9IF9yZWZbX2ldO1xuICAgICAgcmVzdWx0ID0ge307XG4gICAgICB3b3JkcyA9IGxpbmUubWF0Y2goL1xcUysvZyk7XG4gICAgICBmb3IgKGkgPSBfaiA9IDAsIF9sZW4xID0gd29yZHMubGVuZ3RoOyBfaiA8IF9sZW4xOyBpID0gKytfaikge1xuICAgICAgICB3b3JkID0gd29yZHNbaV07XG4gICAgICAgIGlmICh3b3JkLm1hdGNoKC9eXFxkXFxkXFxkXFxkJC8pKSB7XG4gICAgICAgICAgcmVzdWx0LnllYXIgPSArd29yZDtcbiAgICAgICAgICBzcGFuKHJlc3VsdCwgJ1lFQVInKTtcbiAgICAgICAgfSBlbHNlIGlmIChtID0gd29yZC5tYXRjaCgvXihcXGQwKVMkLykpIHtcbiAgICAgICAgICByZXN1bHQueWVhciA9ICttWzFdICsgMTkwMDtcbiAgICAgICAgICBzcGFuKHJlc3VsdCwgJ0RFQ0FERScpO1xuICAgICAgICB9IGVsc2UgaWYgKChtID0gc3BhbnMuaW5kZXhPZih3b3JkKSkgPj0gMCkge1xuICAgICAgICAgIHJlc3VsdC5zcGFuID0gc3BhbnNbbV07XG4gICAgICAgIH0gZWxzZSBpZiAoKG0gPSBtb250aHMuaW5kZXhPZih3b3JkLnNsaWNlKDAsIDMpKSkgPj0gMCkge1xuICAgICAgICAgIHJlc3VsdC5tb250aCA9IG0gKyAxO1xuICAgICAgICAgIHNwYW4ocmVzdWx0LCAnTU9OVEgnKTtcbiAgICAgICAgfSBlbHNlIGlmIChtID0gd29yZC5tYXRjaCgvXihbMS0zXT9bMC05XSkkLykpIHtcbiAgICAgICAgICByZXN1bHQuZGF5ID0gK21bMV07XG4gICAgICAgICAgc3BhbihyZXN1bHQsICdEQVknKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHQubGFiZWwgPSB3b3Jkcy5zbGljZShpLCAxMDAwKS5qb2luKCcgJyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJvd3MucHVzaChyZXN1bHQpO1xuICAgIH1cbiAgICByZXR1cm4gcm93cztcbiAgfTtcblxuICBhcHBseSA9IGZ1bmN0aW9uKGlucHV0LCBvdXRwdXQsIGRhdGUsIHJvd3MpIHtcbiAgICB2YXIgcmVzdWx0LCByb3csIF9pLCBfbGVuLCBfcmVmLCBfcmVmMTtcblxuICAgIHJlc3VsdCA9IFtdO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gcm93cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgcm93ID0gcm93c1tfaV07XG4gICAgICBpZiAoKChfcmVmID0gaW5wdXRbcm93LmxhYmVsXSkgIT0gbnVsbCA/IF9yZWYuZGF0ZSA6IHZvaWQgMCkgIT0gbnVsbCkge1xuICAgICAgICBkYXRlID0gaW5wdXRbcm93LmxhYmVsXS5kYXRlO1xuICAgICAgfVxuICAgICAgaWYgKCgoX3JlZjEgPSBvdXRwdXRbcm93LmxhYmVsXSkgIT0gbnVsbCA/IF9yZWYxLmRhdGUgOiB2b2lkIDApICE9IG51bGwpIHtcbiAgICAgICAgZGF0ZSA9IG91dHB1dFtyb3cubGFiZWxdLmRhdGU7XG4gICAgICB9XG4gICAgICBpZiAocm93LnllYXIgIT0gbnVsbCkge1xuICAgICAgICBkYXRlID0gbmV3IERhdGUocm93LnllYXIsIDEgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChyb3cubW9udGggIT0gbnVsbCkge1xuICAgICAgICBkYXRlID0gbmV3IERhdGUoZGF0ZS5nZXRZZWFyKCkgKyAxOTAwLCByb3cubW9udGggLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChyb3cuZGF5ICE9IG51bGwpIHtcbiAgICAgICAgZGF0ZSA9IG5ldyBEYXRlKGRhdGUuZ2V0WWVhcigpICsgMTkwMCwgZGF0ZS5nZXRNb250aCgpLCByb3cuZGF5KTtcbiAgICAgIH1cbiAgICAgIGlmIChyb3cubGFiZWwgIT0gbnVsbCkge1xuICAgICAgICBvdXRwdXRbcm93LmxhYmVsXSA9IHtcbiAgICAgICAgICBkYXRlOiBkYXRlXG4gICAgICAgIH07XG4gICAgICAgIGlmIChyb3cuc3BhbiAhPSBudWxsKSB7XG4gICAgICAgICAgb3V0cHV0W3Jvdy5sYWJlbF0uc3BhbiA9IHJvdy5zcGFuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByb3cuZGF0ZSA9IGRhdGU7XG4gICAgICByZXN1bHQucHVzaChyb3cpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIHNob3cgPSBmdW5jdGlvbihkYXRlLCBzcGFuKSB7XG4gICAgc3dpdGNoIChzcGFuKSB7XG4gICAgICBjYXNlICdZRUFSJzpcbiAgICAgICAgcmV0dXJuIGRhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICAgIGNhc2UgJ0RFQ0FERSc6XG4gICAgICAgIHJldHVybiBcIlwiICsgKGRhdGUuZ2V0RnVsbFllYXIoKSkgKyBcIidTXCI7XG4gICAgICBjYXNlICdFQVJMWSc6XG4gICAgICAgIHJldHVybiBcIkVhcmx5IFwiICsgKGRhdGUuZ2V0RnVsbFllYXIoKSkgKyBcIidTXCI7XG4gICAgICBjYXNlICdMQVRFJzpcbiAgICAgICAgcmV0dXJuIFwiTGF0ZSBcIiArIChkYXRlLmdldEZ1bGxZZWFyKCkpICsgXCInU1wiO1xuICAgICAgY2FzZSAnTU9OVEgnOlxuICAgICAgICByZXR1cm4gXCJcIiArIG1vbnRoc1tkYXRlLmdldE1vbnRoKCldICsgXCIgXCIgKyAoZGF0ZS5nZXRGdWxsWWVhcigpKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBcIlwiICsgKGRhdGUuZ2V0RGF0ZSgpKSArIFwiIFwiICsgbW9udGhzW2RhdGUuZ2V0TW9udGgoKV0gKyBcIiBcIiArIChkYXRlLmdldEZ1bGxZZWFyKCkpO1xuICAgIH1cbiAgfTtcblxuICBmb3JtYXQgPSBmdW5jdGlvbihyb3dzKSB7XG4gICAgdmFyIHJvdywgX2ksIF9sZW4sIF9yZXN1bHRzO1xuXG4gICAgX3Jlc3VsdHMgPSBbXTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHJvd3MubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIHJvdyA9IHJvd3NbX2ldO1xuICAgICAgX3Jlc3VsdHMucHVzaChcIjx0cj48dGQ+XCIgKyAoc2hvdyhyb3cuZGF0ZSwgcm93LnNwYW4pKSArIFwiPHRkPlwiICsgcm93LmxhYmVsKTtcbiAgICB9XG4gICAgcmV0dXJuIF9yZXN1bHRzO1xuICB9O1xuXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZSAhPT0gbnVsbCkge1xuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgcGFyc2U6IHBhcnNlLFxuICAgICAgYXBwbHk6IGFwcGx5LFxuICAgICAgZm9ybWF0OiBmb3JtYXRcbiAgICB9O1xuICB9XG5cbiAgZW1pdCA9IGZ1bmN0aW9uKGRpdiwgaXRlbSkge1xuICAgIHZhciByZXN1bHRzLCByb3dzO1xuXG4gICAgcm93cyA9IHBhcnNlKGl0ZW0udGV4dCk7XG4gICAgd2lraS5sb2coJ2NhbGVuZGFyIHJvd3MnLCByb3dzKTtcbiAgICByZXN1bHRzID0gYXBwbHkoe30sIHt9LCBuZXcgRGF0ZSgpLCByb3dzKTtcbiAgICB3aWtpLmxvZygnY2FsZW5kYXIgcmVzdWx0cycsIHJlc3VsdHMpO1xuICAgIHJldHVybiBkaXYuYXBwZW5kKFwiPHRhYmxlIHN0eWxlPVxcXCJ3aWR0aDoxMDAlOyBiYWNrZ3JvdW5kOiNlZWU7IHBhZGRpbmc6LjhlbTsgbWFyZ2luLWJvdHRvbTo1cHg7XFxcIj5cIiArIChmb3JtYXQocmVzdWx0cykuam9pbignJykpICsgXCI8L3RhYmxlPlwiKTtcbiAgfTtcblxuICBiaW5kID0gZnVuY3Rpb24oZGl2LCBpdGVtKSB7XG4gICAgcmV0dXJuIGRpdi5kYmxjbGljayhmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB3aWtpLnRleHRFZGl0b3IoZGl2LCBpdGVtKTtcbiAgICB9KTtcbiAgfTtcblxuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB3aW5kb3cgIT09IG51bGwpIHtcbiAgICB3aW5kb3cucGx1Z2lucy5jYWxlbmRhciA9IHtcbiAgICAgIGVtaXQ6IGVtaXQsXG4gICAgICBiaW5kOiBiaW5kXG4gICAgfTtcbiAgfVxuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjYuMlxuKGZ1bmN0aW9uKCkge1xuICB2YXIgY29uc3RydWN0b3IsIGxpc3RJdGVtSHRtbCwgcGFnZUJ1bmRsZTtcblxuICBsaXN0SXRlbUh0bWwgPSBmdW5jdGlvbihzbHVnLCBwYWdlKSB7XG4gICAgcmV0dXJuIFwiPGxpPjxhIGNsYXNzPVxcXCJpbnRlcm5hbFxcXCIgaHJlZj1cXFwiI1xcXCIgdGl0bGU9XFxcImxvY2FsXFxcIiBkYXRhLXBhZ2UtbmFtZT1cXFwiXCIgKyBzbHVnICsgXCJcXFwiIGRhdGEtc2l0ZT1cXFwibG9jYWxcXFwiPlwiICsgcGFnZS50aXRsZSArIFwiPC9hPiA8YnV0dG9uIGNsYXNzPVxcXCJkZWxldGVcXFwiPuKclTwvYnV0dG9uPjwvbGk+XCI7XG4gIH07XG5cbiAgcGFnZUJ1bmRsZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBidW5kbGUsIGksIGxlbmd0aCwgc2x1ZywgX2k7XG5cbiAgICBidW5kbGUgPSB7fTtcbiAgICBsZW5ndGggPSBsb2NhbFN0b3JhZ2UubGVuZ3RoO1xuICAgIGZvciAoaSA9IF9pID0gMDsgMCA8PSBsZW5ndGggPyBfaSA8IGxlbmd0aCA6IF9pID4gbGVuZ3RoOyBpID0gMCA8PSBsZW5ndGggPyArK19pIDogLS1faSkge1xuICAgICAgc2x1ZyA9IGxvY2FsU3RvcmFnZS5rZXkoaSk7XG4gICAgICBidW5kbGVbc2x1Z10gPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKHNsdWcpKTtcbiAgICB9XG4gICAgcmV0dXJuIGJ1bmRsZTtcbiAgfTtcblxuICBjb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKCQsIGRlcGVuZGVuY2llcykge1xuICAgIHZhciBiaW5kLCBlbWl0LCBsb2NhbFN0b3JhZ2U7XG5cbiAgICBpZiAoZGVwZW5kZW5jaWVzID09IG51bGwpIHtcbiAgICAgIGRlcGVuZGVuY2llcyA9IHt9O1xuICAgIH1cbiAgICBsb2NhbFN0b3JhZ2UgPSBkZXBlbmRlbmNpZXMubG9jYWxTdG9yYWdlIHx8IHdpbmRvdy5sb2NhbFN0b3JhZ2U7XG4gICAgZW1pdCA9IGZ1bmN0aW9uKCRkaXYsIGl0ZW0pIHtcbiAgICAgIHZhciBpLCBwYWdlLCBzbHVnLCB1bCwgX2ksIF9yZWY7XG5cbiAgICAgIGlmIChsb2NhbFN0b3JhZ2UubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICRkaXYuYXBwZW5kKCc8dWw+PHA+ZW1wdHk8L3A+PC91bD4nKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgJGRpdi5hcHBlbmQodWwgPSAkKCc8dWwgLz4nKSk7XG4gICAgICBmb3IgKGkgPSBfaSA9IDAsIF9yZWYgPSBsb2NhbFN0b3JhZ2UubGVuZ3RoOyAwIDw9IF9yZWYgPyBfaSA8IF9yZWYgOiBfaSA+IF9yZWY7IGkgPSAwIDw9IF9yZWYgPyArK19pIDogLS1faSkge1xuICAgICAgICBzbHVnID0gbG9jYWxTdG9yYWdlLmtleShpKTtcbiAgICAgICAgcGFnZSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oc2x1ZykpO1xuICAgICAgICB1bC5hcHBlbmQobGlzdEl0ZW1IdG1sKHNsdWcsIHBhZ2UpKTtcbiAgICAgIH1cbiAgICAgIGlmIChpdGVtLnN1Ym1pdCAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiB1bC5hcHBlbmQoXCI8YnV0dG9uIGNsYXNzPVxcXCJzdWJtaXRcXFwiPlN1Ym1pdCBDaGFuZ2VzPC9idXR0b24+XCIpO1xuICAgICAgfVxuICAgIH07XG4gICAgYmluZCA9IGZ1bmN0aW9uKCRkaXYsIGl0ZW0pIHtcbiAgICAgICRkaXYub24oJ2NsaWNrJywgJy5kZWxldGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNsdWc7XG5cbiAgICAgICAgc2x1ZyA9ICQodGhpcykuc2libGluZ3MoJ2EuaW50ZXJuYWwnKS5kYXRhKCdwYWdlTmFtZScpO1xuICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShzbHVnKTtcbiAgICAgICAgcmV0dXJuIGVtaXQoJGRpdi5lbXB0eSgpLCBpdGVtKTtcbiAgICAgIH0pO1xuICAgICAgJGRpdi5vbignY2xpY2snLCAnLnN1Ym1pdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJC5hamF4KHtcbiAgICAgICAgICB0eXBlOiAnUFVUJyxcbiAgICAgICAgICB1cmw6IFwiL3N1Ym1pdFwiLFxuICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICdidW5kbGUnOiBKU09OLnN0cmluZ2lmeShwYWdlQnVuZGxlKCkpXG4gICAgICAgICAgfSxcbiAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihjaXRhdGlvbiwgdGV4dFN0YXR1cywganFYSFIpIHtcbiAgICAgICAgICAgIHZhciBiZWZvcmUsIGJlZm9yZUVsZW1lbnQsIGl0ZW1FbGVtZW50LCBwYWdlRWxlbWVudDtcblxuICAgICAgICAgICAgd2lraS5sb2coXCJhamF4IHN1Ym1pdCBzdWNjZXNzXCIsIGNpdGF0aW9uLCB0ZXh0U3RhdHVzLCBqcVhIUik7XG4gICAgICAgICAgICBpZiAoIShjaXRhdGlvbi50eXBlICYmIGNpdGF0aW9uLnNpdGUpKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFeGNlcHRpb24oXCJJbmNvbXBsZXRlIFN1Ym1pc3Npb25cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYWdlRWxlbWVudCA9ICRkaXYucGFyZW50cygnLnBhZ2U6Zmlyc3QnKTtcbiAgICAgICAgICAgIGl0ZW1FbGVtZW50ID0gJChcIjxkaXYgLz5cIiwge1xuICAgICAgICAgICAgICBcImNsYXNzXCI6IFwiaXRlbSBcIiArIGNpdGF0aW9uLnR5cGVcbiAgICAgICAgICAgIH0pLmRhdGEoJ2l0ZW0nLCBjaXRhdGlvbikuYXR0cignZGF0YS1pZCcsIGNpdGF0aW9uLmlkKTtcbiAgICAgICAgICAgIGl0ZW1FbGVtZW50LmRhdGEoJ3BhZ2VFbGVtZW50JywgcGFnZUVsZW1lbnQpO1xuICAgICAgICAgICAgcGFnZUVsZW1lbnQuZmluZChcIi5zdG9yeVwiKS5hcHBlbmQoaXRlbUVsZW1lbnQpO1xuICAgICAgICAgICAgd2lraS5kb1BsdWdpbihpdGVtRWxlbWVudCwgY2l0YXRpb24pO1xuICAgICAgICAgICAgYmVmb3JlRWxlbWVudCA9IGl0ZW1FbGVtZW50LnByZXYoJy5pdGVtJyk7XG4gICAgICAgICAgICBiZWZvcmUgPSB3aWtpLmdldEl0ZW0oYmVmb3JlRWxlbWVudCk7XG4gICAgICAgICAgICByZXR1cm4gd2lraS5wYWdlSGFuZGxlci5wdXQocGFnZUVsZW1lbnQsIHtcbiAgICAgICAgICAgICAgaXRlbTogY2l0YXRpb24sXG4gICAgICAgICAgICAgIGlkOiBjaXRhdGlvbi5pZCxcbiAgICAgICAgICAgICAgdHlwZTogXCJhZGRcIixcbiAgICAgICAgICAgICAgYWZ0ZXI6IGJlZm9yZSAhPSBudWxsID8gYmVmb3JlLmlkIDogdm9pZCAwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGVycm9yOiBmdW5jdGlvbih4aHIsIHR5cGUsIG1zZykge1xuICAgICAgICAgICAgcmV0dXJuIHdpa2kubG9nKFwiYWpheCBlcnJvciBjYWxsYmFja1wiLCB0eXBlLCBtc2cpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiAkZGl2LmRibGNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYnVuZGxlLCBjb3VudDtcblxuICAgICAgICBidW5kbGUgPSBwYWdlQnVuZGxlKCk7XG4gICAgICAgIGNvdW50ID0gXy5zaXplKGJ1bmRsZSk7XG4gICAgICAgIHJldHVybiB3aWtpLmRpYWxvZyhcIkpTT04gYnVuZGxlIGZvciBcIiArIGNvdW50ICsgXCIgcGFnZXNcIiwgJCgnPHByZS8+JykudGV4dChKU09OLnN0cmluZ2lmeShidW5kbGUsIG51bGwsIDIpKSk7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICBlbWl0OiBlbWl0LFxuICAgICAgYmluZDogYmluZFxuICAgIH07XG4gIH07XG5cbiAgd2lraS5yZWdpc3RlclBsdWdpbignY2hhbmdlcycsIGNvbnN0cnVjdG9yKTtcblxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUgIT09IG51bGwpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGNvbnN0cnVjdG9yO1xuICB9XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuNi4yXG4oZnVuY3Rpb24oKSB7XG4gIHdpbmRvdy5wbHVnaW5zLmVmZmljaWVuY3kgPSB7XG4gICAgZW1pdDogZnVuY3Rpb24oZGl2LCBpdGVtKSB7XG4gICAgICBkaXYuYWRkQ2xhc3MoJ2RhdGEnKTtcbiAgICAgICQoJzxwIC8+JykuYWRkQ2xhc3MoJ3JlYWRvdXQnKS5hcHBlbmRUbyhkaXYpLnRleHQoXCIwJVwiKTtcbiAgICAgIHJldHVybiAkKCc8cCAvPicpLmh0bWwod2lraS5yZXNvbHZlTGlua3MoaXRlbS50ZXh0IHx8ICdlZmZpY2llbmN5JykpLmFwcGVuZFRvKGRpdik7XG4gICAgfSxcbiAgICBiaW5kOiBmdW5jdGlvbihkaXYsIGl0ZW0pIHtcbiAgICAgIHZhciBjYWxjdWxhdGUsIGNhbGN1bGF0ZVBlcmNlbnRhZ2UsIGRpc3BsYXksIGdldEltYWdlRGF0YSwgbGFzdFRodW1iLCBsb2NhdGU7XG5cbiAgICAgIGxhc3RUaHVtYiA9IG51bGw7XG4gICAgICBkaXYuZmluZCgncDpmaXJzdCcpLmRibGNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgcmV0dXJuIHdpa2kuZGlhbG9nKFwiSlNPTiBmb3IgXCIgKyBpdGVtLnRleHQsICQoJzxwcmUvPicpLnRleHQoXCJzb21ldGhpbmcgZ29vZFwiKSk7XG4gICAgICB9KTtcbiAgICAgIGRpdi5maW5kKCdwOmxhc3QnKS5kYmxjbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdpa2kudGV4dEVkaXRvcihkaXYsIGl0ZW0pO1xuICAgICAgfSk7XG4gICAgICBsb2NhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGlkeDtcblxuICAgICAgICBpZHggPSAkKCcuaXRlbScpLmluZGV4KGRpdik7XG4gICAgICAgIHJldHVybiAkKFwiLml0ZW06bHQoXCIgKyBpZHggKyBcIilcIikuZmlsdGVyKCcuaW1hZ2U6bGFzdCcpO1xuICAgICAgfTtcbiAgICAgIGNhbGN1bGF0ZSA9IGZ1bmN0aW9uKGRpdikge1xuICAgICAgICByZXR1cm4gY2FsY3VsYXRlUGVyY2VudGFnZShnZXRJbWFnZURhdGEoZGl2KSk7XG4gICAgICB9O1xuICAgICAgZGlzcGxheSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBkaXYuZmluZCgncDpmaXJzdCcpLnRleHQoXCJcIiArICh2YWx1ZS50b0ZpeGVkKDEpKSArIFwiJVwiKTtcbiAgICAgIH07XG4gICAgICBnZXRJbWFnZURhdGEgPSBmdW5jdGlvbihkaXYpIHtcbiAgICAgICAgdmFyIGMsIGQsIGgsIGltYWdlRGF0YSwgaW1nLCB3O1xuXG4gICAgICAgIGltZyA9IG5ldyBJbWFnZTtcbiAgICAgICAgaW1nLnNyYyA9ICQoZGl2KS5kYXRhKCdpdGVtJykudXJsO1xuICAgICAgICB3ID0gaW1nLndpZHRoO1xuICAgICAgICBoID0gaW1nLmhlaWdodDtcbiAgICAgICAgYyA9ICQoJzxjYW52YXMgaWQ9XCJteUNhbnZhc1wiIHdpZHRoPVwiI3t3fVwiIGhlaWdodD1cIiN7aH1cIj4nKTtcbiAgICAgICAgZCA9IGMuZ2V0KDApLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICAgICAgZC5kcmF3SW1hZ2UoaW1nLCAwLCAwKTtcbiAgICAgICAgaW1hZ2VEYXRhID0gZC5nZXRJbWFnZURhdGEoMCwgMCwgdywgaCk7XG4gICAgICAgIHJldHVybiBpbWFnZURhdGEuZGF0YTtcbiAgICAgIH07XG4gICAgICBjYWxjdWxhdGVQZXJjZW50YWdlID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgbHVtYXM7XG5cbiAgICAgICAgbHVtYXMgPSB3aW5kb3cucGx1Z2lucy5lZmZpY2llbmN5LmdldEdyYXlMdW1hRnJvbVJHQlQoZGF0YSk7XG4gICAgICAgIHJldHVybiB3aW5kb3cucGx1Z2lucy5lZmZpY2llbmN5LmNhbGN1bGF0ZVN0cmF0ZWd5X0dyYXlCaW5hcnkobHVtYXMpO1xuICAgICAgfTtcbiAgICAgIHJldHVybiBkaXNwbGF5KGNhbGN1bGF0ZShsb2NhdGUoKSkpO1xuICAgIH0sXG4gICAgZ2V0R3JheUx1bWFGcm9tUkdCVDogZnVuY3Rpb24ocmdidCkge1xuICAgICAgdmFyIEIsIEcsIFIsIGksIGx1bWFzLCBudW1QaXgsIF9pLCBfcmVmO1xuXG4gICAgICBudW1QaXggPSByZ2J0Lmxlbmd0aCAvIDQ7XG4gICAgICBsdW1hcyA9IFtdO1xuICAgICAgZm9yIChpID0gX2kgPSAwLCBfcmVmID0gbnVtUGl4IC0gMTsgMCA8PSBfcmVmID8gX2kgPD0gX3JlZiA6IF9pID49IF9yZWY7IGkgPSAwIDw9IF9yZWYgPyArK19pIDogLS1faSkge1xuICAgICAgICBSID0gcmdidFtpICogNCArIDBdO1xuICAgICAgICBHID0gcmdidFtpICogNCArIDFdO1xuICAgICAgICBCID0gcmdidFtpICogNCArIDJdO1xuICAgICAgICBsdW1hc1tpXSA9ICgwLjMwICogUikgKyAoMC42MCAqIEcpICsgKDAuMTAgKiBCKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsdW1hcztcbiAgICB9LFxuICAgIGNhbGN1bGF0ZVN0cmF0ZWd5X0dyYXlCaW5hcnk6IGZ1bmN0aW9uKGx1bWFzKSB7XG4gICAgICB2YXIgbCwgbHVtYUhpZ2hDb3VudCwgbHVtYUxvd0NvdW50LCBsdW1hTWF4LCBsdW1hTWlkLCBsdW1hTWluLCBudW1MdW1hcywgcGVyY2VudGFnZSwgX2ksIF9sZW47XG5cbiAgICAgIGx1bWFNaW4gPSBNYXRoLm1pbi5hcHBseShNYXRoLCBsdW1hcyk7XG4gICAgICBsdW1hTWF4ID0gTWF0aC5tYXguYXBwbHkoTWF0aCwgbHVtYXMpO1xuICAgICAgbnVtTHVtYXMgPSBsdW1hcy5sZW5ndGg7XG4gICAgICBsdW1hTWlkID0gKGx1bWFNYXggLSBsdW1hTWluKSAvIDIuMCArIGx1bWFNaW47XG4gICAgICBsdW1hTG93Q291bnQgPSAwO1xuICAgICAgbHVtYUhpZ2hDb3VudCA9IDA7XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IGx1bWFzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGwgPSBsdW1hc1tfaV07XG4gICAgICAgIGlmIChsIDw9IGx1bWFNaWQpIHtcbiAgICAgICAgICBsdW1hTG93Q291bnQrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsdW1hSGlnaENvdW50Kys7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHBlcmNlbnRhZ2UgPSBsdW1hSGlnaENvdW50IC8gbnVtTHVtYXMgKiAxMDA7XG4gICAgICByZXR1cm4gcGVyY2VudGFnZTtcbiAgICB9LFxuICAgIGNhbGN1bGF0ZVN0cmF0ZWd5X0dyYXlJdGVyYXRpdmVDbHVzdGVyaW5nOiBmdW5jdGlvbihsdW1hcykge1xuICAgICAgdmFyIE1BWF9UUklFUywgVEhSRVNIT0xEX0NPTlZFUkdFTkNFX0dPQUwsIGhpZ2gsIGwsIGxvdywgbHVtYUF2Z0hpZ2gsIGx1bWFBdmdMb3csIGx1bWFIaWdoQ291bnQsIGx1bWFIaWdoVG90YWwsIGx1bWFMb3dDb3VudCwgbHVtYUxvd1RvdGFsLCBsdW1hTWF4LCBsdW1hTWluLCBsdW1hc0hpZ2gsIGx1bWFzTG93LCBudW1MdW1hcywgbnVtUGl4LCBudW1UcmllcywgcGVyY2VudGFnZSwgdGhyZXNob2xkLCB0aHJlc2hvbGREaWZmLCB0aHJlc2hvbGRJbml0aWFsLCBfaSwgX2osIF9rLCBfbGVuLCBfbGVuMSwgX2xlbjI7XG5cbiAgICAgIFRIUkVTSE9MRF9DT05WRVJHRU5DRV9HT0FMID0gNTtcbiAgICAgIE1BWF9UUklFUyA9IDEwO1xuICAgICAgbHVtYU1pbiA9IE1hdGgubWluLmFwcGx5KE1hdGgsIGx1bWFzKTtcbiAgICAgIGx1bWFNYXggPSBNYXRoLm1heC5hcHBseShNYXRoLCBsdW1hcyk7XG4gICAgICBudW1MdW1hcyA9IGx1bWFzLmxlbmd0aDtcbiAgICAgIG51bVBpeCA9IG51bUx1bWFzO1xuICAgICAgdGhyZXNob2xkSW5pdGlhbCA9IChsdW1hTWF4IC0gbHVtYU1pbikgLyAyICsgbHVtYU1pbjtcbiAgICAgIHRocmVzaG9sZCA9IHRocmVzaG9sZEluaXRpYWw7XG4gICAgICBsdW1hSGlnaENvdW50ID0gMDtcbiAgICAgIG51bVRyaWVzID0gMDtcbiAgICAgIHdoaWxlIChudW1UcmllcyA8IE1BWF9UUklFUykge1xuICAgICAgICBudW1UcmllcysrO1xuICAgICAgICBsdW1hc0xvdyA9IFtdO1xuICAgICAgICBsdW1hc0hpZ2ggPSBbXTtcbiAgICAgICAgbHVtYUxvd0NvdW50ID0gMDtcbiAgICAgICAgbHVtYUhpZ2hDb3VudCA9IDA7XG4gICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gbHVtYXMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgICBsID0gbHVtYXNbX2ldO1xuICAgICAgICAgIGlmIChsIDw9IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgbHVtYXNMb3cucHVzaChsKTtcbiAgICAgICAgICAgIGx1bWFMb3dDb3VudCsrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAobCAhPT0gTmFOKSB7XG4gICAgICAgICAgICAgIGx1bWFzSGlnaC5wdXNoKGwpO1xuICAgICAgICAgICAgICBsdW1hSGlnaENvdW50Kys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGx1bWFMb3dUb3RhbCA9IDA7XG4gICAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IGx1bWFzTG93Lmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgICAgIGxvdyA9IGx1bWFzTG93W19qXTtcbiAgICAgICAgICBpZiAoIWlzTmFOKGxvdykpIHtcbiAgICAgICAgICAgIGx1bWFMb3dUb3RhbCArPSBsb3c7XG4gICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsdW1hQXZnTG93ID0gMDtcbiAgICAgICAgaWYgKGx1bWFMb3dDb3VudCA+IDApIHtcbiAgICAgICAgICBsdW1hQXZnTG93ID0gbHVtYUxvd1RvdGFsIC8gbHVtYUxvd0NvdW50O1xuICAgICAgICB9XG4gICAgICAgIGx1bWFIaWdoVG90YWwgPSAwO1xuICAgICAgICBmb3IgKF9rID0gMCwgX2xlbjIgPSBsdW1hc0hpZ2gubGVuZ3RoOyBfayA8IF9sZW4yOyBfaysrKSB7XG4gICAgICAgICAgaGlnaCA9IGx1bWFzSGlnaFtfa107XG4gICAgICAgICAgaWYgKCFpc05hTihoaWdoKSkge1xuICAgICAgICAgICAgbHVtYUhpZ2hUb3RhbCArPSBoaWdoO1xuICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbHVtYUF2Z0hpZ2ggPSAwO1xuICAgICAgICBpZiAobHVtYUhpZ2hDb3VudCA+IDApIHtcbiAgICAgICAgICBsdW1hQXZnSGlnaCA9IGx1bWFIaWdoVG90YWwgLyBsdW1hSGlnaENvdW50O1xuICAgICAgICB9XG4gICAgICAgIHRocmVzaG9sZCA9IChsdW1hQXZnSGlnaCAtIGx1bWFBdmdMb3cpIC8gMiArIGx1bWFBdmdMb3c7XG4gICAgICAgIHRocmVzaG9sZERpZmYgPSBNYXRoLmFicyh0aHJlc2hvbGQgLSB0aHJlc2hvbGRJbml0aWFsKTtcbiAgICAgICAgaWYgKHRocmVzaG9sZERpZmYgPD0gVEhSRVNIT0xEX0NPTlZFUkdFTkNFX0dPQUwgfHwgbnVtVHJpZXMgPiBNQVhfVFJJRVMpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJlc2hvbGRJbml0aWFsID0gdGhyZXNob2xkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwZXJjZW50YWdlID0gbHVtYUhpZ2hDb3VudCAvIG51bVBpeCAqIDEwMDtcbiAgICAgIGlmIChwZXJjZW50YWdlID4gMTAwLjApIHtcbiAgICAgICAgcGVyY2VudGFnZSA9IDEwMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwZXJjZW50YWdlO1xuICAgIH1cbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS42LjJcbihmdW5jdGlvbigpIHtcbiAgdmFyIGFkdmFuY2UsIGJpbmQsIGVtaXQsIGVudW1lcmF0ZSwgZXhwbGFpbiwgaG91cnMsIGh1bWFuLCBpbnRlcnZhbHMsIG1vbnRocywgcGFyc2UsIHByaW1BZHZhbmNlLCBzb29uLCBzdW1tYXJpemUsIHdkYXlzLFxuICAgIF9fc2xpY2UgPSBbXS5zbGljZTtcblxuICBlbnVtZXJhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaSwgaywga2V5cywgb2JqLCBfaSwgX2xlbjtcblxuICAgIGtleXMgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgIG9iaiA9IHtcbiAgICAgIGtleXM6IGtleXNcbiAgICB9O1xuICAgIGZvciAoaSA9IF9pID0gMCwgX2xlbiA9IGtleXMubGVuZ3RoOyBfaSA8IF9sZW47IGkgPSArK19pKSB7XG4gICAgICBrID0ga2V5c1tpXTtcbiAgICAgIG9ialtrXSA9IGkgKyAxO1xuICAgIH1cbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIGludGVydmFscyA9IGVudW1lcmF0ZSgnSE9VUkxZJywgJ0RBSUxZJywgJ1dFRUtMWScsICdNT05USExZJywgJ1lFQVJMWScpO1xuXG4gIGhvdXJzID0gZW51bWVyYXRlKCdNSUROSUdIVCcsICdNT1JOSU5HJywgJ05PT04nLCAnRVZFTklORycpO1xuXG4gIHdkYXlzID0gZW51bWVyYXRlKCdTVU5EQVknLCAnTU9OREFZJywgJ1RVRVNEQVknLCAnV0VETkVTREFZJywgJ1RIVVJTREFZJywgJ0ZSSURBWScsICdTQVRVUkRBWScpO1xuXG4gIG1vbnRocyA9IGVudW1lcmF0ZSgnSkFOVUFSWScsICdGRUJVQVJZJywgJ01BUkNIJywgJ0FQUklMJywgJ01BWScsICdKVU5FJywgJ0pVTFknLCAnQVVHVVNUJywgJ1NFUFRFTUJFUicsICdPQ1RPQkVSJywgJ05PVkVNQkVSJywgJ0RFQ0VNQkVSJyk7XG5cbiAgcGFyc2UgPSBmdW5jdGlvbih0ZXh0KSB7XG4gICAgdmFyIGUsIGlzc3VlLCBzY2hlZHVsZSwgd29yZCwgX2ksIF9sZW4sIF9yZWY7XG5cbiAgICBzY2hlZHVsZSA9IFtdO1xuICAgIGlzc3VlID0gbnVsbDtcbiAgICBfcmVmID0gdGV4dC5tYXRjaCgvXFxTKy9nKSB8fCBbXTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIHdvcmQgPSBfcmVmW19pXTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChpbnRlcnZhbHNbd29yZF0pIHtcbiAgICAgICAgICBzY2hlZHVsZS5wdXNoKGlzc3VlID0ge1xuICAgICAgICAgICAgaW50ZXJ2YWw6IHdvcmQsXG4gICAgICAgICAgICByZWNpcGllbnRzOiBbXSxcbiAgICAgICAgICAgIG9mZnNldHM6IFtdXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAobW9udGhzW3dvcmRdIHx8IHdkYXlzW3dvcmRdIHx8IGhvdXJzW3dvcmRdKSB7XG4gICAgICAgICAgaXNzdWUub2Zmc2V0cy5wdXNoKHdvcmQpO1xuICAgICAgICB9IGVsc2UgaWYgKHdvcmQubWF0Y2goL0AvKSkge1xuICAgICAgICAgIGlzc3VlLnJlY2lwaWVudHMucHVzaCh3b3JkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzY2hlZHVsZS5wdXNoKHtcbiAgICAgICAgICAgIHRyb3VibGU6IHdvcmRcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICAgIGUgPSBfZXJyb3I7XG4gICAgICAgIHNjaGVkdWxlLnB1c2goe1xuICAgICAgICAgIHRyb3VibGU6IGUubWVzc2FnZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNjaGVkdWxlO1xuICB9O1xuXG4gIGh1bWFuID0gZnVuY3Rpb24obXNlY3MpIHtcbiAgICB2YXIgZGF5cywgaHJzLCBtaW5zLCBzZWNzLCB3ZWVrcywgeWVhcnM7XG5cbiAgICBpZiAoKHNlY3MgPSBtc2VjcyAvIDEwMDApIDwgMikge1xuICAgICAgcmV0dXJuIFwiXCIgKyAoTWF0aC5mbG9vcihtc2VjcykpICsgXCIgbWlsbGlzZWNvbmRzXCI7XG4gICAgfVxuICAgIGlmICgobWlucyA9IHNlY3MgLyA2MCkgPCAyKSB7XG4gICAgICByZXR1cm4gXCJcIiArIChNYXRoLmZsb29yKHNlY3MpKSArIFwiIHNlY29uZHNcIjtcbiAgICB9XG4gICAgaWYgKChocnMgPSBtaW5zIC8gNjApIDwgMikge1xuICAgICAgcmV0dXJuIFwiXCIgKyAoTWF0aC5mbG9vcihtaW5zKSkgKyBcIiBtaW51dGVzXCI7XG4gICAgfVxuICAgIGlmICgoZGF5cyA9IGhycyAvIDI0KSA8IDIpIHtcbiAgICAgIHJldHVybiBcIlwiICsgKE1hdGguZmxvb3IoaHJzKSkgKyBcIiBob3Vyc1wiO1xuICAgIH1cbiAgICBpZiAoKHdlZWtzID0gZGF5cyAvIDcpIDwgMikge1xuICAgICAgcmV0dXJuIFwiXCIgKyAoTWF0aC5mbG9vcihkYXlzKSkgKyBcIiBkYXlzXCI7XG4gICAgfVxuICAgIGlmICgobW9udGhzID0gZGF5cyAvIDMwLjUpIDwgMikge1xuICAgICAgcmV0dXJuIFwiXCIgKyAoTWF0aC5mbG9vcih3ZWVrcykpICsgXCIgd2Vla3NcIjtcbiAgICB9XG4gICAgaWYgKCh5ZWFycyA9IGRheXMgLyAzNjUpIDwgMikge1xuICAgICAgcmV0dXJuIFwiXCIgKyAoTWF0aC5mbG9vcihtb250aHMpKSArIFwiIG1vbnRoc1wiO1xuICAgIH1cbiAgICByZXR1cm4gXCJcIiArIChNYXRoLmZsb29yKHllYXJzKSkgKyBcIiB5ZWFyc1wiO1xuICB9O1xuXG4gIHByaW1BZHZhbmNlID0gZnVuY3Rpb24oZGF0ZSwgaXNzdWUsIGNvdW50KSB7XG4gICAgdmFyIGQsIGgsIG0sIG9mZnNldCwgcmVzdWx0LCB5LCBfaSwgX2xlbiwgX3JlZiwgX3JlZjEsIF9yZWYyO1xuXG4gICAgX3JlZiA9IFtkYXRlLmdldEZ1bGxZZWFyKCksIGRhdGUuZ2V0TW9udGgoKSwgZGF0ZS5nZXREYXRlKCksIGRhdGUuZ2V0SG91cnMoKV0sIHkgPSBfcmVmWzBdLCBtID0gX3JlZlsxXSwgZCA9IF9yZWZbMl0sIGggPSBfcmVmWzNdO1xuICAgIHJlc3VsdCA9IChmdW5jdGlvbigpIHtcbiAgICAgIHN3aXRjaCAoaXNzdWUuaW50ZXJ2YWwpIHtcbiAgICAgICAgY2FzZSAnSE9VUkxZJzpcbiAgICAgICAgICByZXR1cm4gbmV3IERhdGUoeSwgbSwgZCwgaCArIGNvdW50KTtcbiAgICAgICAgY2FzZSAnREFJTFknOlxuICAgICAgICAgIHJldHVybiBuZXcgRGF0ZSh5LCBtLCBkICsgY291bnQpO1xuICAgICAgICBjYXNlICdXRUVLTFknOlxuICAgICAgICAgIHJldHVybiBuZXcgRGF0ZSh5LCBtLCBkIC0gZGF0ZS5nZXREYXkoKSArIDcgKiBjb3VudCk7XG4gICAgICAgIGNhc2UgJ01PTlRITFknOlxuICAgICAgICAgIHJldHVybiBuZXcgRGF0ZSh5LCBtICsgY291bnQpO1xuICAgICAgICBjYXNlICdZRUFSTFknOlxuICAgICAgICAgIHJldHVybiBuZXcgRGF0ZSh5ICsgY291bnQsIDApO1xuICAgICAgfVxuICAgIH0pKCk7XG4gICAgX3JlZjEgPSBpc3N1ZS5vZmZzZXRzO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZjEubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIG9mZnNldCA9IF9yZWYxW19pXTtcbiAgICAgIF9yZWYyID0gW3Jlc3VsdC5nZXRGdWxsWWVhcigpLCByZXN1bHQuZ2V0TW9udGgoKSwgcmVzdWx0LmdldERhdGUoKSwgcmVzdWx0LmdldEhvdXJzKCldLCB5ID0gX3JlZjJbMF0sIG0gPSBfcmVmMlsxXSwgZCA9IF9yZWYyWzJdLCBoID0gX3JlZjJbM107XG4gICAgICByZXN1bHQgPSBtb250aHNbb2Zmc2V0XSA/IG5ldyBEYXRlKHksIG1vbnRoc1tvZmZzZXRdIC0gMSwgZCwgaCkgOiB3ZGF5c1tvZmZzZXRdID8gbmV3IERhdGUoeSwgbSwgZCArICg3IC0gcmVzdWx0LmdldERheSgpICsgd2RheXNbb2Zmc2V0XSAtIDEpICUgNywgaCkgOiBob3Vyc1tvZmZzZXRdID8gbmV3IERhdGUoeSwgbSwgZCwgaCArIDYgKiAoaG91cnNbb2Zmc2V0XSAtIDEpKSA6IHZvaWQgMDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICBhZHZhbmNlID0gZnVuY3Rpb24oZGF0ZSwgaXNzdWUsIGNvdW50KSB7XG4gICAgdmFyIHByaW07XG5cbiAgICBwcmltID0gcHJpbUFkdmFuY2UoZGF0ZSwgaXNzdWUsIDApO1xuICAgIGlmIChwcmltID4gZGF0ZSkge1xuICAgICAgcmV0dXJuIHByaW1BZHZhbmNlKGRhdGUsIGlzc3VlLCBjb3VudCAtIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcHJpbUFkdmFuY2UoZGF0ZSwgaXNzdWUsIGNvdW50KTtcbiAgICB9XG4gIH07XG5cbiAgc29vbiA9IGZ1bmN0aW9uKGlzc3VlKSB7XG4gICAgdmFyIG5leHQsIG5vdztcblxuICAgIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgbmV4dCA9IGFkdmFuY2Uobm93LCBpc3N1ZSwgMSk7XG4gICAgcmV0dXJuIGh1bWFuKG5leHQuZ2V0VGltZSgpIC0gbm93LmdldFRpbWUoKSk7XG4gIH07XG5cbiAgZXhwbGFpbiA9IGZ1bmN0aW9uKGlzc3VlKSB7XG4gICAgaWYgKGlzc3VlLmludGVydmFsICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBcInJlcG9ydGluZyBcIiArIGlzc3VlLmludGVydmFsICsgXCIgZm9yIFwiICsgaXNzdWUucmVjaXBpZW50cy5sZW5ndGggKyBcIiByZWNpcGllbnRzIGluIFwiICsgKHNvb24oaXNzdWUpKTtcbiAgICB9IGVsc2UgaWYgKGlzc3VlLnRyb3VibGUgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFwiZG9uJ3QgZXhwZWN0OiA8c3BhbiBjbGFzcz1lcnJvcj5cIiArIGlzc3VlLnRyb3VibGUgKyBcIjwvc3Bhbj5cIjtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFwidHJvdWJsZVwiO1xuICAgIH1cbiAgfTtcblxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUgIT09IG51bGwpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgIGludGVydmFsczogaW50ZXJ2YWxzLFxuICAgICAgcGFyc2U6IHBhcnNlLFxuICAgICAgZXhwbGFpbjogZXhwbGFpbixcbiAgICAgIGFkdmFuY2U6IGFkdmFuY2VcbiAgICB9O1xuICB9XG5cbiAgc3VtbWFyaXplID0gZnVuY3Rpb24oc2NoZWR1bGUpIHtcbiAgICB2YXIgaXNzdWU7XG5cbiAgICByZXR1cm4gKChmdW5jdGlvbigpIHtcbiAgICAgIHZhciBfaSwgX2xlbiwgX3Jlc3VsdHM7XG5cbiAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHNjaGVkdWxlLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGlzc3VlID0gc2NoZWR1bGVbX2ldO1xuICAgICAgICBfcmVzdWx0cy5wdXNoKGV4cGxhaW4oaXNzdWUpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICB9KSgpKS5qb2luKFwiPGJyPlwiKTtcbiAgfTtcblxuICBlbWl0ID0gZnVuY3Rpb24oJGl0ZW0sIGl0ZW0pIHtcbiAgICByZXR1cm4gJGl0ZW0uYXBwZW5kKCQoXCI8cD5cIiArIChzdW1tYXJpemUocGFyc2UoaXRlbS50ZXh0KSkpICsgXCI8L3A+XCIpKTtcbiAgfTtcblxuICBiaW5kID0gZnVuY3Rpb24oJGl0ZW0sIGl0ZW0pIHtcbiAgICByZXR1cm4gJGl0ZW0uZGJsY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gd2lraS50ZXh0RWRpdG9yKCRpdGVtLCBpdGVtKTtcbiAgICB9KTtcbiAgfTtcblxuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB3aW5kb3cgIT09IG51bGwpIHtcbiAgICB3aW5kb3cucGx1Z2lucy5yZXBvcnQgPSB7XG4gICAgICBlbWl0OiBlbWl0LFxuICAgICAgYmluZDogYmluZFxuICAgIH07XG4gIH1cblxufSkuY2FsbCh0aGlzKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gKHBhZ2UpIC0+XG4gIHN5bm9wc2lzID0gcGFnZS5zeW5vcHNpc1xuICBpZiBwYWdlPyAmJiBwYWdlLnN0b3J5P1xuICAgIHAxID0gcGFnZS5zdG9yeVswXVxuICAgIHAyID0gcGFnZS5zdG9yeVsxXVxuICAgIHN5bm9wc2lzIHx8PSBwMS50ZXh0IGlmIHAxICYmIHAxLnR5cGUgPT0gJ3BhcmFncmFwaCdcbiAgICBzeW5vcHNpcyB8fD0gcDIudGV4dCBpZiBwMiAmJiBwMi50eXBlID09ICdwYXJhZ3JhcGgnXG4gICAgc3lub3BzaXMgfHw9IHAxLnRleHQgaWYgcDEgJiYgcDEudGV4dD9cbiAgICBzeW5vcHNpcyB8fD0gcDIudGV4dCBpZiBwMiAmJiBwMi50ZXh0P1xuICAgIHN5bm9wc2lzIHx8PSBwYWdlLnN0b3J5PyAmJiBcIkEgcGFnZSB3aXRoICN7cGFnZS5zdG9yeS5sZW5ndGh9IGl0ZW1zLlwiXG4gIGVsc2VcbiAgICBzeW5vcHNpcyA9ICdBIHBhZ2Ugd2l0aCBubyBzdG9yeS4nXG4gIHJldHVybiBzeW5vcHNpc1xuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHdpa2kudXRpbCA9IHV0aWwgPSB7fVxuXG51dGlsLnN5bWJvbHMgPVxuICBjcmVhdGU6ICfimLwnXG4gIGFkZDogJysnXG4gIGVkaXQ6ICfinI4nXG4gIGZvcms6ICfimpEnXG4gIG1vdmU6ICfihpUnXG4gIHJlbW92ZTogJ+KclSdcblxudXRpbC5yYW5kb21CeXRlID0gLT5cbiAgKCgoMStNYXRoLnJhbmRvbSgpKSoweDEwMCl8MCkudG9TdHJpbmcoMTYpLnN1YnN0cmluZygxKVxuXG51dGlsLnJhbmRvbUJ5dGVzID0gKG4pIC0+XG4gICh1dGlsLnJhbmRvbUJ5dGUoKSBmb3IgWzEuLm5dKS5qb2luKCcnKVxuXG4jIGZvciBjaGFydCBwbHVnLWluXG51dGlsLmZvcm1hdFRpbWUgPSAodGltZSkgLT5cbiAgZCA9IG5ldyBEYXRlIChpZiB0aW1lID4gMTAwMDAwMDAwMDAgdGhlbiB0aW1lIGVsc2UgdGltZSoxMDAwKVxuICBtbyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLCAnT2N0JywgJ05vdicsICdEZWMnXVtkLmdldE1vbnRoKCldXG4gIGggPSBkLmdldEhvdXJzKClcbiAgYW0gPSBpZiBoIDwgMTIgdGhlbiAnQU0nIGVsc2UgJ1BNJ1xuICBoID0gaWYgaCA9PSAwIHRoZW4gMTIgZWxzZSBpZiBoID4gMTIgdGhlbiBoIC0gMTIgZWxzZSBoXG4gIG1pID0gKGlmIGQuZ2V0TWludXRlcygpIDwgMTAgdGhlbiBcIjBcIiBlbHNlIFwiXCIpICsgZC5nZXRNaW51dGVzKClcbiAgXCIje2h9OiN7bWl9ICN7YW19PGJyPiN7ZC5nZXREYXRlKCl9ICN7bW99ICN7ZC5nZXRGdWxsWWVhcigpfVwiXG5cbiMgZm9yIGpvdXJuYWwgbW91c2Utb3ZlcnMgYW5kIHBvc3NpYmx5IGZvciBkYXRlIGhlYWRlclxudXRpbC5mb3JtYXREYXRlID0gKG1zU2luY2VFcG9jaCkgLT5cbiAgZCA9IG5ldyBEYXRlKG1zU2luY2VFcG9jaClcbiAgd2sgPSBbJ1N1bicsICdNb24nLCAnVHVlJywgJ1dlZCcsICdUaHUnLCAnRnJpJywgJ1NhdCddW2QuZ2V0RGF5KCldXG4gIG1vID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsICdPY3QnLCAnTm92JywgJ0RlYyddW2QuZ2V0TW9udGgoKV1cbiAgZGF5ID0gZC5nZXREYXRlKCk7XG4gIHlyID0gZC5nZXRGdWxsWWVhcigpO1xuICBoID0gZC5nZXRIb3VycygpXG4gIGFtID0gaWYgaCA8IDEyIHRoZW4gJ0FNJyBlbHNlICdQTSdcbiAgaCA9IGlmIGggPT0gMCB0aGVuIDEyIGVsc2UgaWYgaCA+IDEyIHRoZW4gaCAtIDEyIGVsc2UgaFxuICBtaSA9IChpZiBkLmdldE1pbnV0ZXMoKSA8IDEwIHRoZW4gXCIwXCIgZWxzZSBcIlwiKSArIGQuZ2V0TWludXRlcygpXG4gIHNlYyA9IChpZiBkLmdldFNlY29uZHMoKSA8IDEwIHRoZW4gXCIwXCIgZWxzZSBcIlwiKSArIGQuZ2V0U2Vjb25kcygpXG4gIFwiI3t3a30gI3ttb30gI3tkYXl9LCAje3lyfTxicj4je2h9OiN7bWl9OiN7c2VjfSAje2FtfVwiXG5cbnV0aWwuZm9ybWF0RWxhcHNlZFRpbWUgPSAobXNTaW5jZUVwb2NoKSAtPlxuICBtc2VjcyA9IChuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIG1zU2luY2VFcG9jaClcbiAgcmV0dXJuIFwiI3tNYXRoLmZsb29yIG1zZWNzfSBtaWxsaXNlY29uZHMgYWdvXCIgaWYgKHNlY3MgPSBtc2Vjcy8xMDAwKSA8IDJcbiAgcmV0dXJuIFwiI3tNYXRoLmZsb29yIHNlY3N9IHNlY29uZHMgYWdvXCIgaWYgKG1pbnMgPSBzZWNzLzYwKSA8IDJcbiAgcmV0dXJuIFwiI3tNYXRoLmZsb29yIG1pbnN9IG1pbnV0ZXMgYWdvXCIgaWYgKGhycyA9IG1pbnMvNjApIDwgMlxuICByZXR1cm4gXCIje01hdGguZmxvb3IgaHJzfSBob3VycyBhZ29cIiBpZiAoZGF5cyA9IGhycy8yNCkgPCAyXG4gIHJldHVybiBcIiN7TWF0aC5mbG9vciBkYXlzfSBkYXlzIGFnb1wiIGlmICh3ZWVrcyA9IGRheXMvNykgPCAyXG4gIHJldHVybiBcIiN7TWF0aC5mbG9vciB3ZWVrc30gd2Vla3MgYWdvXCIgaWYgKG1vbnRocyA9IGRheXMvMzEpIDwgMlxuICByZXR1cm4gXCIje01hdGguZmxvb3IgbW9udGhzfSBtb250aHMgYWdvXCIgaWYgKHllYXJzID0gZGF5cy8zNjUpIDwgMlxuICByZXR1cm4gXCIje01hdGguZmxvb3IgeWVhcnN9IHllYXJzIGFnb1wiXG5cbiMgREVGQVVMVFMgZm9yIHJlcXVpcmVkIGZpZWxkc1xuXG51dGlsLmVtcHR5UGFnZSA9ICgpIC0+XG4gIHRpdGxlOiAnZW1wdHknXG4gIHN0b3J5OiBbXVxuICBqb3VybmFsOiBbXVxuXG5cbiMgSWYgdGhlIHNlbGVjdGlvbiBzdGFydCBhbmQgc2VsZWN0aW9uIGVuZCBhcmUgYm90aCB0aGUgc2FtZSxcbiMgdGhlbiB5b3UgaGF2ZSB0aGUgY2FyZXQgcG9zaXRpb24uIElmIHRoZXJlIGlzIHNlbGVjdGVkIHRleHQsIFxuIyB0aGUgYnJvd3NlciB3aWxsIG5vdCB0ZWxsIHlvdSB3aGVyZSB0aGUgY2FyZXQgaXMsIGJ1dCBpdCB3aWxsIFxuIyBlaXRoZXIgYmUgYXQgdGhlIGJlZ2lubmluZyBvciB0aGUgZW5kIG9mIHRoZSBzZWxlY3Rpb24gXG4jKGRlcGVuZGluZyBvbiB0aGUgZGlyZWN0aW9uIG9mIHRoZSBzZWxlY3Rpb24pLlxudXRpbC5nZXRTZWxlY3Rpb25Qb3MgPSAoalF1ZXJ5RWxlbWVudCkgLT4gXG4gIGVsID0galF1ZXJ5RWxlbWVudC5nZXQoMCkgIyBnZXRzIERPTSBOb2RlIGZyb20gZnJvbSBqUXVlcnkgd3JhcHBlclxuICBpZiBkb2N1bWVudC5zZWxlY3Rpb24gIyBJRVxuICAgIGVsLmZvY3VzKClcbiAgICBzZWwgPSBkb2N1bWVudC5zZWxlY3Rpb24uY3JlYXRlUmFuZ2UoKVxuICAgIHNlbC5tb3ZlU3RhcnQgJ2NoYXJhY3RlcicsIC1lbC52YWx1ZS5sZW5ndGhcbiAgICBpZVBvcyA9IHNlbC50ZXh0Lmxlbmd0aFxuICAgIHtzdGFydDogaWVQb3MsIGVuZDogaWVQb3N9XG4gIGVsc2VcbiAgICB7c3RhcnQ6IGVsLnNlbGVjdGlvblN0YXJ0LCBlbmQ6IGVsLnNlbGVjdGlvbkVuZH1cblxudXRpbC5zZXRDYXJldFBvc2l0aW9uID0gKGpRdWVyeUVsZW1lbnQsIGNhcmV0UG9zKSAtPlxuICBlbCA9IGpRdWVyeUVsZW1lbnQuZ2V0KDApXG4gIGlmIGVsP1xuICAgIGlmIGVsLmNyZWF0ZVRleHRSYW5nZSAjIElFXG4gICAgICByYW5nZSA9IGVsLmNyZWF0ZVRleHRSYW5nZSgpXG4gICAgICByYW5nZS5tb3ZlIFwiY2hhcmFjdGVyXCIsIGNhcmV0UG9zXG4gICAgICByYW5nZS5zZWxlY3QoKVxuICAgIGVsc2UgIyByZXN0IG9mIHRoZSB3b3JsZFxuICAgICAgZWwuc2V0U2VsZWN0aW9uUmFuZ2UgY2FyZXRQb3MsIGNhcmV0UG9zXG4gICAgZWwuZm9jdXMoKVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGFjdGl2ZSA9IHt9XG4jIEZVTkNUSU9OUyBhbmQgSEFORExFUlMgdG8gbWFuYWdlIHRoZSBhY3RpdmUgcGFnZSwgYW5kIHNjcm9sbCB2aWV3cG9ydCB0byBzaG93IGl0XG5cbmFjdGl2ZS5zY3JvbGxDb250YWluZXIgPSB1bmRlZmluZWRcbmZpbmRTY3JvbGxDb250YWluZXIgPSAtPlxuICBzY3JvbGxlZCA9ICQoXCJib2R5LCBodG1sXCIpLmZpbHRlciAtPiAkKHRoaXMpLnNjcm9sbExlZnQoKSA+IDBcbiAgaWYgc2Nyb2xsZWQubGVuZ3RoID4gMFxuICAgIHNjcm9sbGVkXG4gIGVsc2VcbiAgICAkKFwiYm9keSwgaHRtbFwiKS5zY3JvbGxMZWZ0KDEyKS5maWx0ZXIoLT4gJCh0aGlzKS5zY3JvbGxMZWZ0KCkgPiAwKS5zY3JvbGxUb3AoMClcblxuc2Nyb2xsVG8gPSAoZWwpIC0+XG4gIGFjdGl2ZS5zY3JvbGxDb250YWluZXIgPz0gZmluZFNjcm9sbENvbnRhaW5lcigpXG4gIGJvZHlXaWR0aCA9ICQoXCJib2R5XCIpLndpZHRoKClcbiAgbWluWCA9IGFjdGl2ZS5zY3JvbGxDb250YWluZXIuc2Nyb2xsTGVmdCgpXG4gIG1heFggPSBtaW5YICsgYm9keVdpZHRoXG4gIHRhcmdldCA9IGVsLnBvc2l0aW9uKCkubGVmdFxuICB3aWR0aCA9IGVsLm91dGVyV2lkdGgodHJ1ZSlcbiAgY29udGVudFdpZHRoID0gJChcIi5wYWdlXCIpLm91dGVyV2lkdGgodHJ1ZSkgKiAkKFwiLnBhZ2VcIikuc2l6ZSgpXG5cbiAgaWYgdGFyZ2V0IDwgbWluWFxuICAgIGFjdGl2ZS5zY3JvbGxDb250YWluZXIuYW5pbWF0ZSBzY3JvbGxMZWZ0OiB0YXJnZXRcbiAgZWxzZSBpZiB0YXJnZXQgKyB3aWR0aCA+IG1heFhcbiAgICBhY3RpdmUuc2Nyb2xsQ29udGFpbmVyLmFuaW1hdGUgc2Nyb2xsTGVmdDogdGFyZ2V0IC0gKGJvZHlXaWR0aCAtIHdpZHRoKVxuICBlbHNlIGlmIG1heFggPiAkKFwiLnBhZ2VzXCIpLm91dGVyV2lkdGgoKVxuICAgIGFjdGl2ZS5zY3JvbGxDb250YWluZXIuYW5pbWF0ZSBzY3JvbGxMZWZ0OiBNYXRoLm1pbih0YXJnZXQsIGNvbnRlbnRXaWR0aCAtIGJvZHlXaWR0aClcblxuYWN0aXZlLnNldCA9IChlbCkgLT5cbiAgZWwgPSAkKGVsKVxuICAkKFwiLmFjdGl2ZVwiKS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKVxuICBzY3JvbGxUbyBlbC5hZGRDbGFzcyhcImFjdGl2ZVwiKVxuXG4iLCJzaW11bGF0ZVBhZ2VOb3RGb3VuZCA9IC0+XG4gIHhockZvcjQwNCA9IHtcbiAgICBzdGF0dXM6IDQwNFxuICB9XG4gIHNpbm9uLnN0dWIoalF1ZXJ5LCBcImFqYXhcIikueWllbGRzVG8oJ2Vycm9yJyx4aHJGb3I0MDQpXG5cbnNpbXVsYXRlUGFnZUZvdW5kID0gKHBhZ2VUb1JldHVybiA9IHt9KS0+XG4gIHNpbm9uLnN0dWIoalF1ZXJ5LCBcImFqYXhcIikueWllbGRzVG8oJ3N1Y2Nlc3MnLCBwYWdlVG9SZXR1cm4pXG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHNpbXVsYXRlUGFnZU5vdEZvdW5kLFxuICBzaW11bGF0ZVBhZ2VGb3VuZFxufVxuIiwiIyAqKnJldmlzaW9uLmNvZmZlZSoqXG4jIFRoaXMgbW9kdWxlIGdlbmVyYXRlcyBhIHBhc3QgcmV2aXNpb24gb2YgYSBkYXRhIGZpbGUgYW5kIGNhY2hlcyBpdCBpbiAnZGF0YS9yZXYnLlxuI1xuIyBUaGUgc2F2ZWQgZmlsZSBoYXMgdGhlIG5hbWUgb2YgdGhlIGlkIG9mIHRoZSBwb2ludCBpbiB0aGUgam91cm5hbCdzIGhpc3RvcnlcbiMgdGhhdCB0aGUgcmV2aXNpb24gcmVwcmVzZW50cy5cblxuY3JlYXRlID0gKHJldkluZGV4LCBkYXRhKSAtPlxuICBqb3VybmFsID0gZGF0YS5qb3VybmFsXG4gIHJldlRpdGxlID0gZGF0YS50aXRsZVxuICByZXZTdG9yeSA9IFtdXG4gIHJldkpvdXJuYWwgPSBqb3VybmFsWzAuLigrcmV2SW5kZXgpXVxuICBmb3Igam91cm5hbEVudHJ5IGluIHJldkpvdXJuYWxcbiAgICByZXZTdG9yeUlkcyA9IHJldlN0b3J5Lm1hcCAoc3RvcnlJdGVtKSAtPiBzdG9yeUl0ZW0uaWRcbiAgICBzd2l0Y2ggam91cm5hbEVudHJ5LnR5cGVcbiAgICAgIHdoZW4gJ2NyZWF0ZSdcbiAgICAgICAgaWYgam91cm5hbEVudHJ5Lml0ZW0udGl0bGU/XG4gICAgICAgICAgcmV2VGl0bGUgPSBqb3VybmFsRW50cnkuaXRlbS50aXRsZVxuICAgICAgICAgIHJldlN0b3J5ID0gam91cm5hbEVudHJ5Lml0ZW0uc3RvcnkgfHwgW11cbiAgICAgIHdoZW4gJ2FkZCdcbiAgICAgICAgaWYgKGFmdGVySW5kZXggPSByZXZTdG9yeUlkcy5pbmRleE9mIGpvdXJuYWxFbnRyeS5hZnRlcikgIT0gLTFcbiAgICAgICAgICByZXZTdG9yeS5zcGxpY2UoYWZ0ZXJJbmRleCsxLDAsam91cm5hbEVudHJ5Lml0ZW0pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXZTdG9yeS5wdXNoIGpvdXJuYWxFbnRyeS5pdGVtXG4gICAgICB3aGVuICdlZGl0J1xuICAgICAgICBpZiAoZWRpdEluZGV4ID0gcmV2U3RvcnlJZHMuaW5kZXhPZiBqb3VybmFsRW50cnkuaWQpICE9IC0xXG4gICAgICAgICAgcmV2U3Rvcnkuc3BsaWNlKGVkaXRJbmRleCwxLGpvdXJuYWxFbnRyeS5pdGVtKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV2U3RvcnkucHVzaCBqb3VybmFsRW50cnkuaXRlbVxuICAgICAgd2hlbiAnbW92ZSdcbiAgICAgICAgaXRlbXMgPSB7fVxuICAgICAgICBmb3Igc3RvcnlJdGVtIGluIHJldlN0b3J5XG4gICAgICAgICAgaXRlbXNbc3RvcnlJdGVtLmlkXSA9IHN0b3J5SXRlbVxuICAgICAgICByZXZTdG9yeSA9IFtdXG4gICAgICAgIGZvciBpdGVtSWQgaW4gam91cm5hbEVudHJ5Lm9yZGVyXG4gICAgICAgICAgcmV2U3RvcnkucHVzaChpdGVtc1tpdGVtSWRdKSBpZiBpdGVtc1tpdGVtSWRdP1xuICAgICAgd2hlbiAncmVtb3ZlJ1xuICAgICAgICBpZiAocmVtb3ZlSW5kZXggPSByZXZTdG9yeUlkcy5pbmRleE9mIGpvdXJuYWxFbnRyeS5pZCkgIT0gLTFcbiAgICAgICAgICByZXZTdG9yeS5zcGxpY2UocmVtb3ZlSW5kZXgsMSlcbiAgICAgICN3aGVuICdmb3JrJyAgICMgZG8gbm90aGluZyB3aGVuIGZvcmtcbiAgcmV0dXJuIHtzdG9yeTogcmV2U3RvcnksIGpvdXJuYWw6IHJldkpvdXJuYWwsIHRpdGxlOiByZXZUaXRsZX1cblxuZXhwb3J0cy5jcmVhdGUgPSBjcmVhdGUiLCJ1dGlsID0gcmVxdWlyZSgnLi91dGlsLmNvZmZlZScpXG5zdGF0ZSA9IHJlcXVpcmUoJy4vc3RhdGUuY29mZmVlJylcbnJldmlzaW9uID0gcmVxdWlyZSgnLi9yZXZpc2lvbi5jb2ZmZWUnKVxuYWRkVG9Kb3VybmFsID0gcmVxdWlyZSgnLi9hZGRUb0pvdXJuYWwuY29mZmVlJylcblxubW9kdWxlLmV4cG9ydHMgPSBwYWdlSGFuZGxlciA9IHt9XG5cbnBhZ2VGcm9tTG9jYWxTdG9yYWdlID0gKHNsdWcpLT5cbiAgaWYganNvbiA9IGxvY2FsU3RvcmFnZVtzbHVnXVxuICAgIEpTT04ucGFyc2UoanNvbilcbiAgZWxzZVxuICAgIHVuZGVmaW5lZFxuXG5yZWN1cnNpdmVHZXQgPSAoe3BhZ2VJbmZvcm1hdGlvbiwgd2hlbkdvdHRlbiwgd2hlbk5vdEdvdHRlbiwgbG9jYWxDb250ZXh0fSkgLT5cbiAge3NsdWcscmV2LHNpdGV9ID0gcGFnZUluZm9ybWF0aW9uXG5cbiAgaWYgc2l0ZVxuICAgIGxvY2FsQ29udGV4dCA9IFtdXG4gIGVsc2VcbiAgICBzaXRlID0gbG9jYWxDb250ZXh0LnNoaWZ0KClcblxuICBzaXRlID0gbnVsbCBpZiBzaXRlPT0ndmlldydcblxuICBpZiBzaXRlP1xuICAgIGlmIHNpdGUgPT0gJ2xvY2FsJ1xuICAgICAgaWYgbG9jYWxQYWdlID0gcGFnZUZyb21Mb2NhbFN0b3JhZ2UocGFnZUluZm9ybWF0aW9uLnNsdWcpXG4gICAgICAgIHJldHVybiB3aGVuR290dGVuKCBsb2NhbFBhZ2UsICdsb2NhbCcgKVxuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gd2hlbk5vdEdvdHRlbigpXG4gICAgZWxzZVxuICAgICAgaWYgc2l0ZSA9PSAnb3JpZ2luJ1xuICAgICAgICB1cmwgPSBcIi8je3NsdWd9Lmpzb25cIlxuICAgICAgZWxzZVxuICAgICAgICB1cmwgPSBcImh0dHA6Ly8je3NpdGV9LyN7c2x1Z30uanNvblwiXG4gIGVsc2VcbiAgICB1cmwgPSBcIi8je3NsdWd9Lmpzb25cIlxuXG4gICQuYWpheFxuICAgIHR5cGU6ICdHRVQnXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgIHVybDogdXJsICsgXCI/cmFuZG9tPSN7dXRpbC5yYW5kb21CeXRlcyg0KX1cIlxuICAgIHN1Y2Nlc3M6IChwYWdlKSAtPlxuICAgICAgcGFnZSA9IHJldmlzaW9uLmNyZWF0ZSByZXYsIHBhZ2UgaWYgcmV2XG4gICAgICByZXR1cm4gd2hlbkdvdHRlbihwYWdlLHNpdGUpXG4gICAgZXJyb3I6ICh4aHIsIHR5cGUsIG1zZykgLT5cbiAgICAgIGlmICh4aHIuc3RhdHVzICE9IDQwNCkgYW5kICh4aHIuc3RhdHVzICE9IDApXG4gICAgICAgIHdpa2kubG9nICdwYWdlSGFuZGxlci5nZXQgZXJyb3InLCB4aHIsIHhoci5zdGF0dXMsIHR5cGUsIG1zZ1xuICAgICAgICByZXBvcnQgPVxuICAgICAgICAgICd0aXRsZSc6IFwiI3t4aHIuc3RhdHVzfSAje21zZ31cIlxuICAgICAgICAgICdzdG9yeSc6IFtcbiAgICAgICAgICAgICd0eXBlJzogJ3BhcmFncmFwaCdcbiAgICAgICAgICAgICdpZCc6ICc5Mjg3MzkxODcyNDMnXG4gICAgICAgICAgICAndGV4dCc6IFwiPHByZT4je3hoci5yZXNwb25zZVRleHR9XCJcbiAgICAgICAgICBdXG4gICAgICAgIHJldHVybiB3aGVuR290dGVuIHJlcG9ydCwgJ2xvY2FsJ1xuICAgICAgaWYgbG9jYWxDb250ZXh0Lmxlbmd0aCA+IDBcbiAgICAgICAgcmVjdXJzaXZlR2V0KCB7cGFnZUluZm9ybWF0aW9uLCB3aGVuR290dGVuLCB3aGVuTm90R290dGVuLCBsb2NhbENvbnRleHR9IClcbiAgICAgIGVsc2VcbiAgICAgICAgd2hlbk5vdEdvdHRlbigpXG5cbnBhZ2VIYW5kbGVyLmdldCA9ICh7d2hlbkdvdHRlbix3aGVuTm90R290dGVuLHBhZ2VJbmZvcm1hdGlvbn0gICkgLT5cblxuICB1bmxlc3MgcGFnZUluZm9ybWF0aW9uLnNpdGVcbiAgICBpZiBsb2NhbFBhZ2UgPSBwYWdlRnJvbUxvY2FsU3RvcmFnZShwYWdlSW5mb3JtYXRpb24uc2x1ZylcbiAgICAgIGxvY2FsUGFnZSA9IHJldmlzaW9uLmNyZWF0ZSBwYWdlSW5mb3JtYXRpb24ucmV2LCBsb2NhbFBhZ2UgaWYgcGFnZUluZm9ybWF0aW9uLnJldlxuICAgICAgcmV0dXJuIHdoZW5Hb3R0ZW4oIGxvY2FsUGFnZSwgJ2xvY2FsJyApXG5cbiAgcGFnZUhhbmRsZXIuY29udGV4dCA9IFsndmlldyddIHVubGVzcyBwYWdlSGFuZGxlci5jb250ZXh0Lmxlbmd0aFxuXG4gIHJlY3Vyc2l2ZUdldFxuICAgIHBhZ2VJbmZvcm1hdGlvbjogcGFnZUluZm9ybWF0aW9uXG4gICAgd2hlbkdvdHRlbjogd2hlbkdvdHRlblxuICAgIHdoZW5Ob3RHb3R0ZW46IHdoZW5Ob3RHb3R0ZW5cbiAgICBsb2NhbENvbnRleHQ6IF8uY2xvbmUocGFnZUhhbmRsZXIuY29udGV4dClcblxuXG5wYWdlSGFuZGxlci5jb250ZXh0ID0gW11cblxucHVzaFRvTG9jYWwgPSAocGFnZUVsZW1lbnQsIHBhZ2VQdXRJbmZvLCBhY3Rpb24pIC0+XG4gIHBhZ2UgPSBwYWdlRnJvbUxvY2FsU3RvcmFnZSBwYWdlUHV0SW5mby5zbHVnXG4gIHBhZ2UgPSB7dGl0bGU6IGFjdGlvbi5pdGVtLnRpdGxlfSBpZiBhY3Rpb24udHlwZSA9PSAnY3JlYXRlJ1xuICBwYWdlIHx8PSBwYWdlRWxlbWVudC5kYXRhKFwiZGF0YVwiKVxuICBwYWdlLmpvdXJuYWwgPSBbXSB1bmxlc3MgcGFnZS5qb3VybmFsP1xuICBpZiAoc2l0ZT1hY3Rpb25bJ2ZvcmsnXSk/XG4gICAgcGFnZS5qb3VybmFsID0gcGFnZS5qb3VybmFsLmNvbmNhdCh7J3R5cGUnOidmb3JrJywnc2l0ZSc6c2l0ZX0pXG4gICAgZGVsZXRlIGFjdGlvblsnZm9yayddXG4gIHBhZ2Uuam91cm5hbCA9IHBhZ2Uuam91cm5hbC5jb25jYXQoYWN0aW9uKVxuICBwYWdlLnN0b3J5ID0gJChwYWdlRWxlbWVudCkuZmluZChcIi5pdGVtXCIpLm1hcCgtPiAkKEApLmRhdGEoXCJpdGVtXCIpKS5nZXQoKVxuICBsb2NhbFN0b3JhZ2VbcGFnZVB1dEluZm8uc2x1Z10gPSBKU09OLnN0cmluZ2lmeShwYWdlKVxuICBhZGRUb0pvdXJuYWwgcGFnZUVsZW1lbnQuZmluZCgnLmpvdXJuYWwnKSwgYWN0aW9uXG5cbnB1c2hUb1NlcnZlciA9IChwYWdlRWxlbWVudCwgcGFnZVB1dEluZm8sIGFjdGlvbikgLT5cbiAgJC5hamF4XG4gICAgdHlwZTogJ1BVVCdcbiAgICB1cmw6IFwiL3BhZ2UvI3twYWdlUHV0SW5mby5zbHVnfS9hY3Rpb25cIlxuICAgIGRhdGE6XG4gICAgICAnYWN0aW9uJzogSlNPTi5zdHJpbmdpZnkoYWN0aW9uKVxuICAgIHN1Y2Nlc3M6ICgpIC0+XG4gICAgICBhZGRUb0pvdXJuYWwgcGFnZUVsZW1lbnQuZmluZCgnLmpvdXJuYWwnKSwgYWN0aW9uXG4gICAgICBpZiBhY3Rpb24udHlwZSA9PSAnZm9yaycgIyBwdXNoXG4gICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtIHBhZ2VFbGVtZW50LmF0dHIoJ2lkJylcbiAgICAgICAgc3RhdGUuc2V0VXJsXG4gICAgZXJyb3I6ICh4aHIsIHR5cGUsIG1zZykgLT5cbiAgICAgIHdpa2kubG9nIFwicGFnZUhhbmRsZXIucHV0IGFqYXggZXJyb3IgY2FsbGJhY2tcIiwgdHlwZSwgbXNnXG5cbnBhZ2VIYW5kbGVyLnB1dCA9IChwYWdlRWxlbWVudCwgYWN0aW9uKSAtPlxuXG4gIGNoZWNrZWRTaXRlID0gKCkgLT5cbiAgICBzd2l0Y2ggc2l0ZSA9IHBhZ2VFbGVtZW50LmRhdGEoJ3NpdGUnKVxuICAgICAgd2hlbiAnb3JpZ2luJywgJ2xvY2FsJywgJ3ZpZXcnIHRoZW4gbnVsbFxuICAgICAgd2hlbiBsb2NhdGlvbi5ob3N0IHRoZW4gbnVsbFxuICAgICAgZWxzZSBzaXRlXG5cbiAgIyBhYm91dCB0aGUgcGFnZSB3ZSBoYXZlXG4gIHBhZ2VQdXRJbmZvID0ge1xuICAgIHNsdWc6IHBhZ2VFbGVtZW50LmF0dHIoJ2lkJykuc3BsaXQoJ19yZXYnKVswXVxuICAgIHJldjogcGFnZUVsZW1lbnQuYXR0cignaWQnKS5zcGxpdCgnX3JldicpWzFdXG4gICAgc2l0ZTogY2hlY2tlZFNpdGUoKVxuICAgIGxvY2FsOiBwYWdlRWxlbWVudC5oYXNDbGFzcygnbG9jYWwnKVxuICB9XG4gIGZvcmtGcm9tID0gcGFnZVB1dEluZm8uc2l0ZVxuICB3aWtpLmxvZyAncGFnZUhhbmRsZXIucHV0JywgYWN0aW9uLCBwYWdlUHV0SW5mb1xuXG4gICMgZGV0ZWN0IHdoZW4gZm9yayB0byBsb2NhbCBzdG9yYWdlXG4gIGlmIHdpa2kudXNlTG9jYWxTdG9yYWdlKClcbiAgICBpZiBwYWdlUHV0SW5mby5zaXRlP1xuICAgICAgd2lraS5sb2cgJ3JlbW90ZSA9PiBsb2NhbCdcbiAgICBlbHNlIGlmICFwYWdlUHV0SW5mby5sb2NhbFxuICAgICAgd2lraS5sb2cgJ29yaWdpbiA9PiBsb2NhbCdcbiAgICAgIGFjdGlvbi5zaXRlID0gZm9ya0Zyb20gPSBsb2NhdGlvbi5ob3N0XG4gICAgIyBlbHNlIGlmICFwYWdlRnJvbUxvY2FsU3RvcmFnZShwYWdlUHV0SW5mby5zbHVnKVxuICAgICMgICB3aWtpLmxvZyAnJ1xuICAgICMgICBhY3Rpb24uc2l0ZSA9IGZvcmtGcm9tID0gcGFnZVB1dEluZm8uc2l0ZVxuICAgICMgICB3aWtpLmxvZyAnbG9jYWwgc3RvcmFnZSBmaXJzdCB0aW1lJywgYWN0aW9uLCAnZm9ya0Zyb20nLCBmb3JrRnJvbVxuXG4gICMgdHdlZWsgYWN0aW9uIGJlZm9yZSBzYXZpbmdcbiAgYWN0aW9uLmRhdGUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpXG4gIGRlbGV0ZSBhY3Rpb24uc2l0ZSBpZiBhY3Rpb24uc2l0ZSA9PSAnb3JpZ2luJ1xuXG4gICMgdXBkYXRlIGRvbSB3aGVuIGZvcmtpbmdcbiAgaWYgZm9ya0Zyb21cbiAgICAjIHB1bGwgcmVtb3RlIHNpdGUgY2xvc2VyIHRvIHVzXG4gICAgcGFnZUVsZW1lbnQuZmluZCgnaDEgaW1nJykuYXR0cignc3JjJywgJy9mYXZpY29uLnBuZycpXG4gICAgcGFnZUVsZW1lbnQuZmluZCgnaDEgYScpLmF0dHIoJ2hyZWYnLCAnLycpXG4gICAgcGFnZUVsZW1lbnQuZGF0YSgnc2l0ZScsIG51bGwpXG4gICAgcGFnZUVsZW1lbnQucmVtb3ZlQ2xhc3MoJ3JlbW90ZScpXG4gICAgc3RhdGUuc2V0VXJsKClcbiAgICBpZiBhY3Rpb24udHlwZSAhPSAnZm9yaydcbiAgICAgICMgYnVuZGxlIGltcGxpY2l0IGZvcmsgd2l0aCBuZXh0IGFjdGlvblxuICAgICAgYWN0aW9uLmZvcmsgPSBmb3JrRnJvbVxuICAgICAgYWRkVG9Kb3VybmFsIHBhZ2VFbGVtZW50LmZpbmQoJy5qb3VybmFsJyksXG4gICAgICAgIHR5cGU6ICdmb3JrJ1xuICAgICAgICBzaXRlOiBmb3JrRnJvbVxuICAgICAgICBkYXRlOiBhY3Rpb24uZGF0ZVxuXG4gICMgc3RvcmUgYXMgYXBwcm9wcmlhdGVcbiAgaWYgd2lraS51c2VMb2NhbFN0b3JhZ2UoKSBvciBwYWdlUHV0SW5mby5zaXRlID09ICdsb2NhbCdcbiAgICBwdXNoVG9Mb2NhbChwYWdlRWxlbWVudCwgcGFnZVB1dEluZm8sIGFjdGlvbilcbiAgICBwYWdlRWxlbWVudC5hZGRDbGFzcyhcImxvY2FsXCIpXG4gIGVsc2VcbiAgICBwdXNoVG9TZXJ2ZXIocGFnZUVsZW1lbnQsIHBhZ2VQdXRJbmZvLCBhY3Rpb24pXG5cbiIsInV0aWwgPSByZXF1aXJlKCcuL3V0aWwuY29mZmVlJylcbnBhZ2VIYW5kbGVyID0gcmVxdWlyZSgnLi9wYWdlSGFuZGxlci5jb2ZmZWUnKVxucGx1Z2luID0gcmVxdWlyZSgnLi9wbHVnaW4uY29mZmVlJylcbnN0YXRlID0gcmVxdWlyZSgnLi9zdGF0ZS5jb2ZmZWUnKVxubmVpZ2hib3Job29kID0gcmVxdWlyZSgnLi9uZWlnaGJvcmhvb2QuY29mZmVlJylcbmFkZFRvSm91cm5hbCA9IHJlcXVpcmUoJy4vYWRkVG9Kb3VybmFsLmNvZmZlZScpXG53aWtpID0gcmVxdWlyZSgnLi93aWtpLmNvZmZlZScpXG5cbmhhbmRsZURyYWdnaW5nID0gKGV2dCwgdWkpIC0+XG4gIGl0ZW1FbGVtZW50ID0gdWkuaXRlbVxuXG4gIGl0ZW0gPSB3aWtpLmdldEl0ZW0oaXRlbUVsZW1lbnQpXG4gIHRoaXNQYWdlRWxlbWVudCA9ICQodGhpcykucGFyZW50cygnLnBhZ2U6Zmlyc3QnKVxuICBzb3VyY2VQYWdlRWxlbWVudCA9IGl0ZW1FbGVtZW50LmRhdGEoJ3BhZ2VFbGVtZW50JylcbiAgc291cmNlU2l0ZSA9IHNvdXJjZVBhZ2VFbGVtZW50LmRhdGEoJ3NpdGUnKVxuXG4gIGRlc3RpbmF0aW9uUGFnZUVsZW1lbnQgPSBpdGVtRWxlbWVudC5wYXJlbnRzKCcucGFnZTpmaXJzdCcpXG4gIGVxdWFscyA9IChhLCBiKSAtPiBhIGFuZCBiIGFuZCBhLmdldCgwKSA9PSBiLmdldCgwKVxuXG4gIG1vdmVXaXRoaW5QYWdlID0gbm90IHNvdXJjZVBhZ2VFbGVtZW50IG9yIGVxdWFscyhzb3VyY2VQYWdlRWxlbWVudCwgZGVzdGluYXRpb25QYWdlRWxlbWVudClcbiAgbW92ZUZyb21QYWdlID0gbm90IG1vdmVXaXRoaW5QYWdlIGFuZCBlcXVhbHModGhpc1BhZ2VFbGVtZW50LCBzb3VyY2VQYWdlRWxlbWVudClcbiAgbW92ZVRvUGFnZSA9IG5vdCBtb3ZlV2l0aGluUGFnZSBhbmQgZXF1YWxzKHRoaXNQYWdlRWxlbWVudCwgZGVzdGluYXRpb25QYWdlRWxlbWVudClcblxuICBpZiBtb3ZlRnJvbVBhZ2VcbiAgICBpZiBzb3VyY2VQYWdlRWxlbWVudC5oYXNDbGFzcygnZ2hvc3QnKSBvclxuICAgICAgc291cmNlUGFnZUVsZW1lbnQuYXR0cignaWQnKSA9PSBkZXN0aW5hdGlvblBhZ2VFbGVtZW50LmF0dHIoJ2lkJylcbiAgICAgICAgIyBzdGVtIHRoZSBkYW1hZ2UsIGJldHRlciBpZGVhcyBoZXJlOlxuICAgICAgICAjIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzkxNjA4OS9qcXVlcnktdWktc29ydGFibGVzLWNvbm5lY3QtbGlzdHMtY29weS1pdGVtc1xuICAgICAgICByZXR1cm5cblxuICBhY3Rpb24gPSBpZiBtb3ZlV2l0aGluUGFnZVxuICAgIG9yZGVyID0gJCh0aGlzKS5jaGlsZHJlbigpLm1hcCgoXywgdmFsdWUpIC0+ICQodmFsdWUpLmF0dHIoJ2RhdGEtaWQnKSkuZ2V0KClcbiAgICB7dHlwZTogJ21vdmUnLCBvcmRlcjogb3JkZXJ9XG4gIGVsc2UgaWYgbW92ZUZyb21QYWdlXG4gICAgd2lraS5sb2cgJ2RyYWcgZnJvbScsIHNvdXJjZVBhZ2VFbGVtZW50LmZpbmQoJ2gxJykudGV4dCgpXG4gICAge3R5cGU6ICdyZW1vdmUnfVxuICBlbHNlIGlmIG1vdmVUb1BhZ2VcbiAgICBpdGVtRWxlbWVudC5kYXRhICdwYWdlRWxlbWVudCcsIHRoaXNQYWdlRWxlbWVudFxuICAgIGJlZm9yZUVsZW1lbnQgPSBpdGVtRWxlbWVudC5wcmV2KCcuaXRlbScpXG4gICAgYmVmb3JlID0gd2lraS5nZXRJdGVtKGJlZm9yZUVsZW1lbnQpXG4gICAge3R5cGU6ICdhZGQnLCBpdGVtOiBpdGVtLCBhZnRlcjogYmVmb3JlPy5pZH1cbiAgYWN0aW9uLmlkID0gaXRlbS5pZFxuICBwYWdlSGFuZGxlci5wdXQgdGhpc1BhZ2VFbGVtZW50LCBhY3Rpb25cblxuaW5pdERyYWdnaW5nID0gKCRwYWdlKSAtPlxuICAkc3RvcnkgPSAkcGFnZS5maW5kKCcuc3RvcnknKVxuICAkc3Rvcnkuc29ydGFibGUoY29ubmVjdFdpdGg6ICcucGFnZSAuc3RvcnknKS5vbihcInNvcnR1cGRhdGVcIiwgaGFuZGxlRHJhZ2dpbmcpXG5cblxuaW5pdEFkZEJ1dHRvbiA9ICgkcGFnZSkgLT5cbiAgJHBhZ2UuZmluZChcIi5hZGQtZmFjdG9yeVwiKS5saXZlIFwiY2xpY2tcIiwgKGV2dCkgLT5cbiAgICByZXR1cm4gaWYgJHBhZ2UuaGFzQ2xhc3MgJ2dob3N0J1xuICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY3JlYXRlRmFjdG9yeSgkcGFnZSlcblxuY3JlYXRlRmFjdG9yeSA9ICgkcGFnZSkgLT5cbiAgaXRlbSA9XG4gICAgdHlwZTogXCJmYWN0b3J5XCJcbiAgICBpZDogdXRpbC5yYW5kb21CeXRlcyg4KVxuICBpdGVtRWxlbWVudCA9ICQoXCI8ZGl2IC8+XCIsIGNsYXNzOiBcIml0ZW0gZmFjdG9yeVwiKS5kYXRhKCdpdGVtJyxpdGVtKS5hdHRyKCdkYXRhLWlkJywgaXRlbS5pZClcbiAgaXRlbUVsZW1lbnQuZGF0YSAncGFnZUVsZW1lbnQnLCAkcGFnZVxuICAkcGFnZS5maW5kKFwiLnN0b3J5XCIpLmFwcGVuZChpdGVtRWxlbWVudClcbiAgcGx1Z2luLmRvIGl0ZW1FbGVtZW50LCBpdGVtXG4gIGJlZm9yZUVsZW1lbnQgPSBpdGVtRWxlbWVudC5wcmV2KCcuaXRlbScpXG4gIGJlZm9yZSA9IHdpa2kuZ2V0SXRlbShiZWZvcmVFbGVtZW50KVxuICBwYWdlSGFuZGxlci5wdXQgJHBhZ2UsIHtpdGVtOiBpdGVtLCBpZDogaXRlbS5pZCwgdHlwZTogXCJhZGRcIiwgYWZ0ZXI6IGJlZm9yZT8uaWR9XG5cbmJ1aWxkUGFnZUhlYWRlciA9ICh7cGFnZSx0b29sdGlwLGhlYWRlcl9ocmVmLGZhdmljb25fc3JjfSktPlxuICB0b29sdGlwICs9IFwiXFxuI3twYWdlLnBsdWdpbn0gcGx1Z2luXCIgaWYgcGFnZS5wbHVnaW5cbiAgXCJcIlwiPGgxIHRpdGxlPVwiI3t0b29sdGlwfVwiPjxhIGhyZWY9XCIje2hlYWRlcl9ocmVmfVwiPjxpbWcgc3JjPVwiI3tmYXZpY29uX3NyY31cIiBoZWlnaHQ9XCIzMnB4XCIgY2xhc3M9XCJmYXZpY29uXCI+PC9hPiAje3BhZ2UudGl0bGV9PC9oMT5cIlwiXCJcblxuZW1pdEhlYWRlciA9ICgkaGVhZGVyLCAkcGFnZSwgcGFnZSkgLT5cbiAgc2l0ZSA9ICRwYWdlLmRhdGEoJ3NpdGUnKVxuICBpc1JlbW90ZVBhZ2UgPSBzaXRlPyBhbmQgc2l0ZSAhPSAnbG9jYWwnIGFuZCBzaXRlICE9ICdvcmlnaW4nIGFuZCBzaXRlICE9ICd2aWV3J1xuICBoZWFkZXIgPSAnJ1xuXG4gIHZpZXdIZXJlID0gaWYgd2lraS5hc1NsdWcocGFnZS50aXRsZSkgaXMgJ3dlbGNvbWUtdmlzaXRvcnMnIHRoZW4gXCJcIlxuICBlbHNlIFwiL3ZpZXcvI3t3aWtpLmFzU2x1ZyhwYWdlLnRpdGxlKX1cIlxuICBwYWdlSGVhZGVyID0gaWYgaXNSZW1vdGVQYWdlXG4gICAgYnVpbGRQYWdlSGVhZGVyXG4gICAgICB0b29sdGlwOiBzaXRlXG4gICAgICBoZWFkZXJfaHJlZjogXCIvLyN7c2l0ZX0vdmlldy93ZWxjb21lLXZpc2l0b3JzI3t2aWV3SGVyZX1cIlxuICAgICAgZmF2aWNvbl9zcmM6IFwiaHR0cDovLyN7c2l0ZX0vZmF2aWNvbi5wbmdcIlxuICAgICAgcGFnZTogcGFnZVxuICBlbHNlXG4gICAgYnVpbGRQYWdlSGVhZGVyXG4gICAgICB0b29sdGlwOiBsb2NhdGlvbi5ob3N0XG4gICAgICBoZWFkZXJfaHJlZjogXCIvdmlldy93ZWxjb21lLXZpc2l0b3JzI3t2aWV3SGVyZX1cIlxuICAgICAgZmF2aWNvbl9zcmM6IFwiL2Zhdmljb24ucG5nXCJcbiAgICAgIHBhZ2U6IHBhZ2VcblxuICAkaGVhZGVyLmFwcGVuZCggcGFnZUhlYWRlciApXG4gIFxuICB1bmxlc3MgaXNSZW1vdGVQYWdlXG4gICAgJCgnaW1nLmZhdmljb24nLCRwYWdlKS5lcnJvciAoZSktPlxuICAgICAgcGx1Z2luLmdldCAnZmF2aWNvbicsIChmYXZpY29uKSAtPlxuICAgICAgICBmYXZpY29uLmNyZWF0ZSgpXG5cbiAgaWYgJHBhZ2UuYXR0cignaWQnKS5tYXRjaCAvX3Jldi9cbiAgICByZXYgPSBwYWdlLmpvdXJuYWwubGVuZ3RoLTFcbiAgICBkYXRlID0gcGFnZS5qb3VybmFsW3Jldl0uZGF0ZVxuICAgICRwYWdlLmFkZENsYXNzKCdnaG9zdCcpLmRhdGEoJ3JldicscmV2KVxuICAgICRoZWFkZXIuYXBwZW5kICQgXCJcIlwiXG4gICAgICA8aDIgY2xhc3M9XCJyZXZpc2lvblwiPlxuICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAje2lmIGRhdGU/IHRoZW4gdXRpbC5mb3JtYXREYXRlKGRhdGUpIGVsc2UgXCJSZXZpc2lvbiAje3Jldn1cIn1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9oMj5cbiAgICBcIlwiXCJcblxuZW1pdFR3aW5zID0gd2lraS5lbWl0VHdpbnMgPSAoJHBhZ2UpIC0+XG4gIHBhZ2UgPSAkcGFnZS5kYXRhICdkYXRhJ1xuICBzaXRlID0gJHBhZ2UuZGF0YSgnc2l0ZScpIG9yIHdpbmRvdy5sb2NhdGlvbi5ob3N0XG4gIHNpdGUgPSB3aW5kb3cubG9jYXRpb24uaG9zdCBpZiBzaXRlIGluIFsndmlldycsICdvcmlnaW4nXVxuICBzbHVnID0gd2lraS5hc1NsdWcgcGFnZS50aXRsZVxuICBpZiAoYWN0aW9ucyA9IHBhZ2Uuam91cm5hbD8ubGVuZ3RoKT8gYW5kICh2aWV3aW5nID0gcGFnZS5qb3VybmFsW2FjdGlvbnMtMV0/LmRhdGUpP1xuICAgIHZpZXdpbmcgPSBNYXRoLmZsb29yKHZpZXdpbmcvMTAwMCkqMTAwMFxuICAgIGJpbnMgPSB7bmV3ZXI6W10sIHNhbWU6W10sIG9sZGVyOltdfVxuICAgICMge2ZlZC53aWtpLm9yZzogW3tzbHVnOiBcImhhcHBlbmluZ3NcIiwgdGl0bGU6IFwiSGFwcGVuaW5nc1wiLCBkYXRlOiAxMzU4OTc1MzAzMDAwLCBzeW5vcHNpczogXCJDaGFuZ2VzIGhlcmUgLi4uXCJ9XX1cbiAgICBmb3IgcmVtb3RlU2l0ZSwgaW5mbyBvZiB3aWtpLm5laWdoYm9yaG9vZFxuICAgICAgaWYgcmVtb3RlU2l0ZSAhPSBzaXRlIGFuZCBpbmZvLnNpdGVtYXA/XG4gICAgICAgIGZvciBpdGVtIGluIGluZm8uc2l0ZW1hcFxuICAgICAgICAgIGlmIGl0ZW0uc2x1ZyA9PSBzbHVnXG4gICAgICAgICAgICBiaW4gPSBpZiBpdGVtLmRhdGUgPiB2aWV3aW5nIHRoZW4gYmlucy5uZXdlclxuICAgICAgICAgICAgZWxzZSBpZiBpdGVtLmRhdGUgPCB2aWV3aW5nIHRoZW4gYmlucy5vbGRlclxuICAgICAgICAgICAgZWxzZSBiaW5zLnNhbWVcbiAgICAgICAgICAgIGJpbi5wdXNoIHtyZW1vdGVTaXRlLCBpdGVtfVxuICAgIHR3aW5zID0gW11cbiAgICAjIHtuZXdlcjpbcmVtb3RlU2l0ZTogXCJmZWQud2lraS5vcmdcIiwgaXRlbToge3NsdWc6IC4uLiwgZGF0ZTogLi4ufSwgLi4uXX1cbiAgICBmb3IgbGVnZW5kLCBiaW4gb2YgYmluc1xuICAgICAgY29udGludWUgdW5sZXNzIGJpbi5sZW5ndGhcbiAgICAgIGJpbi5zb3J0IChhLGIpIC0+XG4gICAgICAgIGEuaXRlbS5kYXRlIDwgYi5pdGVtLmRhdGVcbiAgICAgIGZsYWdzID0gZm9yIHtyZW1vdGVTaXRlLCBpdGVtfSwgaSBpbiBiaW5cbiAgICAgICAgYnJlYWsgaWYgaSA+PSA4XG4gICAgICAgIFwiXCJcIjxpbWcgY2xhc3M9XCJyZW1vdGVcIlxuICAgICAgICAgIHNyYz1cImh0dHA6Ly8je3JlbW90ZVNpdGV9L2Zhdmljb24ucG5nXCJcbiAgICAgICAgICBkYXRhLXNsdWc9XCIje3NsdWd9XCJcbiAgICAgICAgICBkYXRhLXNpdGU9XCIje3JlbW90ZVNpdGV9XCJcbiAgICAgICAgICB0aXRsZT1cIiN7cmVtb3RlU2l0ZX1cIj5cbiAgICAgICAgXCJcIlwiXG4gICAgICB0d2lucy5wdXNoIFwiI3tmbGFncy5qb2luICcmbmJzcDsnfSAje2xlZ2VuZH1cIlxuICAgICRwYWdlLmZpbmQoJy50d2lucycpLmh0bWwgXCJcIlwiPHA+I3t0d2lucy5qb2luIFwiLCBcIn08L3A+XCJcIlwiIGlmIHR3aW5zXG5cbnJlbmRlclBhZ2VJbnRvUGFnZUVsZW1lbnQgPSAocGFnZURhdGEsJHBhZ2UsIHNpdGVGb3VuZCkgLT5cbiAgcGFnZSA9ICQuZXh0ZW5kKHV0aWwuZW1wdHlQYWdlKCksIHBhZ2VEYXRhKVxuICAkcGFnZS5kYXRhKFwiZGF0YVwiLCBwYWdlKVxuICBzbHVnID0gJHBhZ2UuYXR0cignaWQnKVxuICBzaXRlID0gJHBhZ2UuZGF0YSgnc2l0ZScpXG5cbiAgY29udGV4dCA9IFsndmlldyddXG4gIGNvbnRleHQucHVzaCBzaXRlIGlmIHNpdGU/XG4gIGFkZENvbnRleHQgPSAoc2l0ZSkgLT4gY29udGV4dC5wdXNoIHNpdGUgaWYgc2l0ZT8gYW5kIG5vdCBfLmluY2x1ZGUgY29udGV4dCwgc2l0ZVxuICBhZGRDb250ZXh0IGFjdGlvbi5zaXRlIGZvciBhY3Rpb24gaW4gcGFnZS5qb3VybmFsLnNsaWNlKDApLnJldmVyc2UoKVxuXG4gIHdpa2kucmVzb2x1dGlvbkNvbnRleHQgPSBjb250ZXh0XG5cbiAgJHBhZ2UuZW1wdHkoKVxuICBbJHR3aW5zLCAkaGVhZGVyLCAkc3RvcnksICRqb3VybmFsLCAkZm9vdGVyXSA9IFsndHdpbnMnLCAnaGVhZGVyJywgJ3N0b3J5JywgJ2pvdXJuYWwnLCAnZm9vdGVyJ10ubWFwIChjbGFzc05hbWUpIC0+XG4gICAgJChcIjxkaXYgLz5cIikuYWRkQ2xhc3MoY2xhc3NOYW1lKS5hcHBlbmRUbygkcGFnZSlcblxuICBlbWl0SGVhZGVyICRoZWFkZXIsICRwYWdlLCBwYWdlXG5cbiAgZW1pdEl0ZW0gPSAoaSkgLT5cbiAgICByZXR1cm4gaWYgaSA+PSBwYWdlLnN0b3J5Lmxlbmd0aFxuICAgIGl0ZW0gPSBwYWdlLnN0b3J5W2ldXG4gICAgaWYgaXRlbT8udHlwZSBhbmQgaXRlbT8uaWRcbiAgICAgICRpdGVtID0gJCBcIlwiXCI8ZGl2IGNsYXNzPVwiaXRlbSAje2l0ZW0udHlwZX1cIiBkYXRhLWlkPVwiI3tpdGVtLmlkfVwiPlwiXCJcIlxuICAgICAgJHN0b3J5LmFwcGVuZCAkaXRlbVxuICAgICAgcGx1Z2luLmRvICRpdGVtLCBpdGVtLCAtPiBlbWl0SXRlbSBpKzFcbiAgICBlbHNlXG4gICAgICAkc3RvcnkuYXBwZW5kICQgXCJcIlwiPGRpdj48cCBjbGFzcz1cImVycm9yXCI+Q2FuJ3QgbWFrZSBzZW5zZSBvZiBzdG9yeVsje2l9XTwvcD48L2Rpdj5cIlwiXCJcbiAgICAgIGVtaXRJdGVtIGkrMVxuICBlbWl0SXRlbSAwXG5cbiAgZm9yIGFjdGlvbiBpbiBwYWdlLmpvdXJuYWxcbiAgICBhZGRUb0pvdXJuYWwgJGpvdXJuYWwsIGFjdGlvblxuXG4gIGVtaXRUd2lucyAkcGFnZVxuXG4gICRqb3VybmFsLmFwcGVuZCBcIlwiXCJcbiAgICA8ZGl2IGNsYXNzPVwiY29udHJvbC1idXR0b25zXCI+XG4gICAgICA8YSBocmVmPVwiI1wiIGNsYXNzPVwiYnV0dG9uIGZvcmstcGFnZVwiIHRpdGxlPVwiZm9yayB0aGlzIHBhZ2VcIj4je3V0aWwuc3ltYm9sc1snZm9yayddfTwvYT5cbiAgICAgIDxhIGhyZWY9XCIjXCIgY2xhc3M9XCJidXR0b24gYWRkLWZhY3RvcnlcIiB0aXRsZT1cImFkZCBwYXJhZ3JhcGhcIj4je3V0aWwuc3ltYm9sc1snYWRkJ119PC9hPlxuICAgIDwvZGl2PlxuICBcIlwiXCJcblxuICAkZm9vdGVyLmFwcGVuZCBcIlwiXCJcbiAgICA8YSBpZD1cImxpY2Vuc2VcIiBocmVmPVwiaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnktc2EvMy4wL1wiPkNDIEJZLVNBIDMuMDwvYT4gLlxuICAgIDxhIGNsYXNzPVwic2hvdy1wYWdlLXNvdXJjZVwiIGhyZWY9XCIvI3tzbHVnfS5qc29uP3JhbmRvbT0je3V0aWwucmFuZG9tQnl0ZXMoNCl9XCIgdGl0bGU9XCJzb3VyY2VcIj5KU09OPC9hPiAuXG4gICAgPGEgaHJlZj0gXCIvLyN7c2l0ZUZvdW5kIHx8IGxvY2F0aW9uLmhvc3R9LyN7c2x1Z30uaHRtbFwiPiN7c2l0ZUZvdW5kIHx8IGxvY2F0aW9uLmhvc3R9PC9hPlxuICBcIlwiXCJcblxuXG53aWtpLmJ1aWxkUGFnZSA9IChkYXRhLHNpdGVGb3VuZCwkcGFnZSkgLT5cblxuICBpZiBzaXRlRm91bmQgPT0gJ2xvY2FsJ1xuICAgICRwYWdlLmFkZENsYXNzKCdsb2NhbCcpXG4gIGVsc2UgaWYgc2l0ZUZvdW5kXG4gICAgc2l0ZUZvdW5kID0gJ29yaWdpbicgaWYgc2l0ZUZvdW5kIGlzIHdpbmRvdy5sb2NhdGlvbi5ob3N0XG4gICAgJHBhZ2UuYWRkQ2xhc3MoJ3JlbW90ZScpIHVubGVzcyBzaXRlRm91bmQgaW4gWyd2aWV3JywgJ29yaWdpbiddXG4gICAgJHBhZ2UuZGF0YSgnc2l0ZScsIHNpdGVGb3VuZClcbiAgaWYgZGF0YS5wbHVnaW4/XG4gICAgJHBhZ2UuYWRkQ2xhc3MoJ3BsdWdpbicpXG5cbiAgI1RPRE86IGF2b2lkIHBhc3Npbmcgc2l0ZUZvdW5kXG4gIHJlbmRlclBhZ2VJbnRvUGFnZUVsZW1lbnQoIGRhdGEsICRwYWdlLCBzaXRlRm91bmQgKVxuXG4gIHN0YXRlLnNldFVybCgpXG5cbiAgaW5pdERyYWdnaW5nICRwYWdlXG4gIGluaXRBZGRCdXR0b24gJHBhZ2VcbiAgJHBhZ2VcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZnJlc2ggPSB3aWtpLnJlZnJlc2ggPSAtPlxuICAkcGFnZSA9ICQodGhpcylcblxuICBbc2x1ZywgcmV2XSA9ICRwYWdlLmF0dHIoJ2lkJykuc3BsaXQoJ19yZXYnKVxuICBwYWdlSW5mb3JtYXRpb24gPSB7XG4gICAgc2x1Zzogc2x1Z1xuICAgIHJldjogcmV2XG4gICAgc2l0ZTogJHBhZ2UuZGF0YSgnc2l0ZScpXG4gIH1cblxuICBjcmVhdGVHaG9zdFBhZ2UgPSAtPlxuICAgIHRpdGxlID0gJChcIlwiXCJhW2hyZWY9XCIvI3tzbHVnfS5odG1sXCJdOmxhc3RcIlwiXCIpLnRleHQoKSBvciBzbHVnXG4gICAgcGFnZSA9XG4gICAgICAndGl0bGUnOiB0aXRsZVxuICAgICAgJ3N0b3J5JzogW1xuICAgICAgICAnaWQnOiB1dGlsLnJhbmRvbUJ5dGVzIDhcbiAgICAgICAgJ3R5cGUnOiAnZnV0dXJlJ1xuICAgICAgICAndGV4dCc6ICdXZSBjb3VsZCBub3QgZmluZCB0aGlzIHBhZ2UuJ1xuICAgICAgICAndGl0bGUnOiB0aXRsZVxuICAgICAgXVxuICAgIGhlYWRpbmcgPVxuICAgICAgJ3R5cGUnOiAncGFyYWdyYXBoJ1xuICAgICAgJ2lkJzogdXRpbC5yYW5kb21CeXRlcyg4KVxuICAgICAgJ3RleHQnOiBcIldlIGRpZCBmaW5kIHRoZSBwYWdlIGluIHlvdXIgY3VycmVudCBuZWlnaGJvcmhvb2QuXCJcbiAgICBoaXRzID0gW11cbiAgICBmb3Igc2l0ZSwgaW5mbyBvZiB3aWtpLm5laWdoYm9yaG9vZFxuICAgICAgaWYgaW5mby5zaXRlbWFwP1xuICAgICAgICByZXN1bHQgPSBfLmZpbmQgaW5mby5zaXRlbWFwLCAoZWFjaCkgLT5cbiAgICAgICAgICBlYWNoLnNsdWcgPT0gc2x1Z1xuICAgICAgICBpZiByZXN1bHQ/XG4gICAgICAgICAgaGl0cy5wdXNoXG4gICAgICAgICAgICBcInR5cGVcIjogXCJyZWZlcmVuY2VcIlxuICAgICAgICAgICAgXCJpZFwiOiB1dGlsLnJhbmRvbUJ5dGVzKDgpXG4gICAgICAgICAgICBcInNpdGVcIjogc2l0ZVxuICAgICAgICAgICAgXCJzbHVnXCI6IHNsdWdcbiAgICAgICAgICAgIFwidGl0bGVcIjogcmVzdWx0LnRpdGxlIHx8IHNsdWdcbiAgICAgICAgICAgIFwidGV4dFwiOiByZXN1bHQuc3lub3BzaXMgfHwgJydcbiAgICBpZiBoaXRzLmxlbmd0aCA+IDBcbiAgICAgIHBhZ2Uuc3RvcnkucHVzaCBoZWFkaW5nLCBoaXRzLi4uXG4gICAgICBwYWdlLnN0b3J5WzBdLnRleHQgPSAnV2UgY291bGQgbm90IGZpbmQgdGhpcyBwYWdlIGluIHRoZSBleHBlY3RlZCBjb250ZXh0LidcblxuICAgIHdpa2kuYnVpbGRQYWdlKCBwYWdlLCB1bmRlZmluZWQsICRwYWdlICkuYWRkQ2xhc3MoJ2dob3N0JylcblxuICByZWdpc3Rlck5laWdoYm9ycyA9IChkYXRhLCBzaXRlKSAtPlxuICAgIGlmIF8uaW5jbHVkZSBbJ2xvY2FsJywgJ29yaWdpbicsICd2aWV3JywgbnVsbCwgdW5kZWZpbmVkXSwgc2l0ZVxuICAgICAgbmVpZ2hib3Job29kLnJlZ2lzdGVyTmVpZ2hib3IgbG9jYXRpb24uaG9zdFxuICAgIGVsc2VcbiAgICAgIG5laWdoYm9yaG9vZC5yZWdpc3Rlck5laWdoYm9yIHNpdGVcbiAgICBmb3IgaXRlbSBpbiAoZGF0YS5zdG9yeSB8fCBbXSlcbiAgICAgIG5laWdoYm9yaG9vZC5yZWdpc3Rlck5laWdoYm9yIGl0ZW0uc2l0ZSBpZiBpdGVtLnNpdGU/XG4gICAgZm9yIGFjdGlvbiBpbiAoZGF0YS5qb3VybmFsIHx8IFtdKVxuICAgICAgbmVpZ2hib3Job29kLnJlZ2lzdGVyTmVpZ2hib3IgYWN0aW9uLnNpdGUgaWYgYWN0aW9uLnNpdGU/XG5cbiAgd2hlbkdvdHRlbiA9IChkYXRhLHNpdGVGb3VuZCkgLT5cbiAgICB3aWtpLmJ1aWxkUGFnZSggZGF0YSwgc2l0ZUZvdW5kLCAkcGFnZSApXG4gICAgcmVnaXN0ZXJOZWlnaGJvcnMoIGRhdGEsIHNpdGVGb3VuZCApXG5cbiAgcGFnZUhhbmRsZXIuZ2V0XG4gICAgd2hlbkdvdHRlbjogd2hlbkdvdHRlblxuICAgIHdoZW5Ob3RHb3R0ZW46IGNyZWF0ZUdob3N0UGFnZVxuICAgIHBhZ2VJbmZvcm1hdGlvbjogcGFnZUluZm9ybWF0aW9uXG5cbiIsInV0aWwgPSByZXF1aXJlKCcuL3V0aWwuY29mZmVlJylcbm1vZHVsZS5leHBvcnRzID0gcGx1Z2luID0ge31cblxuIyBUT0RPOiBSZW1vdmUgdGhlc2UgbWV0aG9kcyBmcm9tIHdpa2kgb2JqZWN0P1xuI1xuXG5zY3JpcHRzID0ge31cbmdldFNjcmlwdCA9IHdpa2kuZ2V0U2NyaXB0ID0gKHVybCwgY2FsbGJhY2sgPSAoKSAtPikgLT5cbiAgaWYgc2NyaXB0c1t1cmxdP1xuICAgIGNhbGxiYWNrKClcbiAgZWxzZVxuICAgICQuZ2V0U2NyaXB0KHVybClcbiAgICAgIC5kb25lIC0+XG4gICAgICAgIHNjcmlwdHNbdXJsXSA9IHRydWVcbiAgICAgICAgY2FsbGJhY2soKVxuICAgICAgLmZhaWwgLT5cbiAgICAgICAgY2FsbGJhY2soKVxuXG5wbHVnaW4uZ2V0ID0gd2lraS5nZXRQbHVnaW4gPSAobmFtZSwgY2FsbGJhY2spIC0+XG4gIHJldHVybiBjYWxsYmFjayh3aW5kb3cucGx1Z2luc1tuYW1lXSkgaWYgd2luZG93LnBsdWdpbnNbbmFtZV1cbiAgZ2V0U2NyaXB0IFwiL3BsdWdpbnMvI3tuYW1lfS8je25hbWV9LmpzXCIsICgpIC0+XG4gICAgcmV0dXJuIGNhbGxiYWNrKHdpbmRvdy5wbHVnaW5zW25hbWVdKSBpZiB3aW5kb3cucGx1Z2luc1tuYW1lXVxuICAgIGdldFNjcmlwdCBcIi9wbHVnaW5zLyN7bmFtZX0uanNcIiwgKCkgLT5cbiAgICAgIGNhbGxiYWNrKHdpbmRvdy5wbHVnaW5zW25hbWVdKVxuXG5wbHVnaW4uZG8gPSB3aWtpLmRvUGx1Z2luID0gKGRpdiwgaXRlbSwgZG9uZT0tPikgLT5cbiAgZXJyb3IgPSAoZXgpIC0+XG4gICAgZXJyb3JFbGVtZW50ID0gJChcIjxkaXYgLz5cIikuYWRkQ2xhc3MoJ2Vycm9yJylcbiAgICBlcnJvckVsZW1lbnQudGV4dChleC50b1N0cmluZygpKVxuICAgIGRpdi5hcHBlbmQoZXJyb3JFbGVtZW50KVxuXG4gIGRpdi5kYXRhICdwYWdlRWxlbWVudCcsIGRpdi5wYXJlbnRzKFwiLnBhZ2VcIilcbiAgZGl2LmRhdGEgJ2l0ZW0nLCBpdGVtXG4gIHBsdWdpbi5nZXQgaXRlbS50eXBlLCAoc2NyaXB0KSAtPlxuICAgIHRyeVxuICAgICAgdGhyb3cgVHlwZUVycm9yKFwiQ2FuJ3QgZmluZCBwbHVnaW4gZm9yICcje2l0ZW0udHlwZX0nXCIpIHVubGVzcyBzY3JpcHQ/XG4gICAgICBpZiBzY3JpcHQuZW1pdC5sZW5ndGggPiAyXG4gICAgICAgIHNjcmlwdC5lbWl0IGRpdiwgaXRlbSwgLT5cbiAgICAgICAgICBzY3JpcHQuYmluZCBkaXYsIGl0ZW1cbiAgICAgICAgICBkb25lKClcbiAgICAgIGVsc2VcbiAgICAgICAgc2NyaXB0LmVtaXQgZGl2LCBpdGVtXG4gICAgICAgIHNjcmlwdC5iaW5kIGRpdiwgaXRlbVxuICAgICAgICBkb25lKClcbiAgICBjYXRjaCBlcnJcbiAgICAgIHdpa2kubG9nICdwbHVnaW4gZXJyb3InLCBlcnJcbiAgICAgIGVycm9yKGVycilcbiAgICAgIGRvbmUoKVxuXG53aWtpLnJlZ2lzdGVyUGx1Z2luID0gKHBsdWdpbk5hbWUscGx1Z2luRm4pLT5cbiAgd2luZG93LnBsdWdpbnNbcGx1Z2luTmFtZV0gPSBwbHVnaW5GbigkKVxuXG5cbiMgUExVR0lOUyBmb3IgZWFjaCBzdG9yeSBpdGVtIHR5cGVcblxud2luZG93LnBsdWdpbnMgPVxuICBwYXJhZ3JhcGg6XG4gICAgZW1pdDogKGRpdiwgaXRlbSkgLT5cbiAgICAgIGZvciB0ZXh0IGluIGl0ZW0udGV4dC5zcGxpdCAvXFxuXFxuKy9cbiAgICAgICAgZGl2LmFwcGVuZCBcIjxwPiN7d2lraS5yZXNvbHZlTGlua3ModGV4dCl9PC9wPlwiIGlmIHRleHQubWF0Y2ggL1xcUy9cbiAgICBiaW5kOiAoZGl2LCBpdGVtKSAtPlxuICAgICAgZGl2LmRibGNsaWNrIC0+IHdpa2kudGV4dEVkaXRvciBkaXYsIGl0ZW0sIG51bGwsIHRydWVcbiAgaW1hZ2U6XG4gICAgZW1pdDogKGRpdiwgaXRlbSkgLT5cbiAgICAgIGl0ZW0udGV4dCB8fD0gaXRlbS5jYXB0aW9uXG4gICAgICBkaXYuYXBwZW5kIFwiPGltZyBjbGFzcz10aHVtYm5haWwgc3JjPVxcXCIje2l0ZW0udXJsfVxcXCI+IDxwPiN7d2lraS5yZXNvbHZlTGlua3MoaXRlbS50ZXh0KX08L3A+XCJcbiAgICBiaW5kOiAoZGl2LCBpdGVtKSAtPlxuICAgICAgZGl2LmRibGNsaWNrIC0+IHdpa2kudGV4dEVkaXRvciBkaXYsIGl0ZW1cbiAgICAgIGRpdi5maW5kKCdpbWcnKS5kYmxjbGljayAtPiB3aWtpLmRpYWxvZyBpdGVtLnRleHQsIHRoaXNcbiAgZnV0dXJlOlxuICAgIGVtaXQ6IChkaXYsIGl0ZW0pIC0+XG4gICAgICBkaXYuYXBwZW5kIFwiXCJcIiN7aXRlbS50ZXh0fTxicj48YnI+PGJ1dHRvbiBjbGFzcz1cImNyZWF0ZVwiPmNyZWF0ZTwvYnV0dG9uPiBuZXcgYmxhbmsgcGFnZVwiXCJcIlxuICAgICAgaWYgKGluZm8gPSB3aWtpLm5laWdoYm9yaG9vZFtsb2NhdGlvbi5ob3N0XSk/IGFuZCBpbmZvLnNpdGVtYXA/XG4gICAgICAgIGZvciBpdGVtIGluIGluZm8uc2l0ZW1hcFxuICAgICAgICAgIGlmIGl0ZW0uc2x1Zy5tYXRjaCAvLXRlbXBsYXRlJC9cbiAgICAgICAgICAgIGRpdi5hcHBlbmQgXCJcIlwiPGJyPjxidXR0b24gY2xhc3M9XCJjcmVhdGVcIiBkYXRhLXNsdWc9I3tpdGVtLnNsdWd9PmNyZWF0ZTwvYnV0dG9uPiBmcm9tICN7d2lraS5yZXNvbHZlTGlua3MgXCJbWyN7aXRlbS50aXRsZX1dXVwifVwiXCJcIlxuICAgIGJpbmQ6IChkaXYsIGl0ZW0pIC0+XG4iLCJhY3RpdmUgPSByZXF1aXJlKCcuL2FjdGl2ZS5jb2ZmZWUnKVxudXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5jb2ZmZWUnKVxuY3JlYXRlU2VhcmNoID0gcmVxdWlyZSgnLi9zZWFyY2guY29mZmVlJylcblxubW9kdWxlLmV4cG9ydHMgPSBuZWlnaGJvcmhvb2QgPSB7fVxuXG5cbndpa2kubmVpZ2hib3Job29kID89IHt9XG5uZXh0QXZhaWxhYmxlRmV0Y2ggPSAwXG5uZXh0RmV0Y2hJbnRlcnZhbCA9IDIwMDBcblxucG9wdWxhdGVTaXRlSW5mb0ZvciA9IChzaXRlLG5laWdoYm9ySW5mbyktPlxuICByZXR1cm4gaWYgbmVpZ2hib3JJbmZvLnNpdGVtYXBSZXF1ZXN0SW5mbGlnaHRcbiAgbmVpZ2hib3JJbmZvLnNpdGVtYXBSZXF1ZXN0SW5mbGlnaHQgPSB0cnVlXG5cbiAgdHJhbnNpdGlvbiA9IChzaXRlLCBmcm9tLCB0bykgLT5cbiAgICAkKFwiXCJcIi5uZWlnaGJvcltkYXRhLXNpdGU9XCIje3NpdGV9XCJdXCJcIlwiKVxuICAgICAgLmZpbmQoJ2RpdicpXG4gICAgICAucmVtb3ZlQ2xhc3MoZnJvbSlcbiAgICAgIC5hZGRDbGFzcyh0bylcblxuICBmZXRjaE1hcCA9IC0+XG4gICAgc2l0ZW1hcFVybCA9IFwiaHR0cDovLyN7c2l0ZX0vc3lzdGVtL3NpdGVtYXAuanNvblwiXG4gICAgdHJhbnNpdGlvbiBzaXRlLCAnd2FpdCcsICdmZXRjaCdcbiAgICByZXF1ZXN0ID0gJC5hamF4XG4gICAgICB0eXBlOiAnR0VUJ1xuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgdXJsOiBzaXRlbWFwVXJsXG4gICAgcmVxdWVzdFxuICAgICAgLmFsd2F5cyggLT4gbmVpZ2hib3JJbmZvLnNpdGVtYXBSZXF1ZXN0SW5mbGlnaHQgPSBmYWxzZSApXG4gICAgICAuZG9uZSAoZGF0YSktPlxuICAgICAgICBuZWlnaGJvckluZm8uc2l0ZW1hcCA9IGRhdGFcbiAgICAgICAgdHJhbnNpdGlvbiBzaXRlLCAnZmV0Y2gnLCAnZG9uZSdcbiAgICAgICAgJCgnYm9keScpLnRyaWdnZXIgJ25ldy1uZWlnaGJvci1kb25lJywgc2l0ZVxuICAgICAgLmZhaWwgKGRhdGEpLT5cbiAgICAgICAgdHJhbnNpdGlvbiBzaXRlLCAnZmV0Y2gnLCAnZmFpbCdcblxuICBub3cgPSBEYXRlLm5vdygpXG4gIGlmIG5vdyA+IG5leHRBdmFpbGFibGVGZXRjaFxuICAgIG5leHRBdmFpbGFibGVGZXRjaCA9IG5vdyArIG5leHRGZXRjaEludGVydmFsXG4gICAgc2V0VGltZW91dCBmZXRjaE1hcCwgMTAwXG4gIGVsc2VcbiAgICBzZXRUaW1lb3V0IGZldGNoTWFwLCBuZXh0QXZhaWxhYmxlRmV0Y2ggLSBub3dcbiAgICBuZXh0QXZhaWxhYmxlRmV0Y2ggKz0gbmV4dEZldGNoSW50ZXJ2YWxcblxuXG53aWtpLnJlZ2lzdGVyTmVpZ2hib3IgPSBuZWlnaGJvcmhvb2QucmVnaXN0ZXJOZWlnaGJvciA9IChzaXRlKS0+XG4gIHJldHVybiBpZiB3aWtpLm5laWdoYm9yaG9vZFtzaXRlXT9cbiAgbmVpZ2hib3JJbmZvID0ge31cbiAgd2lraS5uZWlnaGJvcmhvb2Rbc2l0ZV0gPSBuZWlnaGJvckluZm9cbiAgcG9wdWxhdGVTaXRlSW5mb0Zvciggc2l0ZSwgbmVpZ2hib3JJbmZvIClcbiAgJCgnYm9keScpLnRyaWdnZXIgJ25ldy1uZWlnaGJvcicsIHNpdGVcblxubmVpZ2hib3Job29kLmxpc3ROZWlnaGJvcnMgPSAoKS0+XG4gIF8ua2V5cyggd2lraS5uZWlnaGJvcmhvb2QgKVxuXG5uZWlnaGJvcmhvb2Quc2VhcmNoID0gKHNlYXJjaFF1ZXJ5KS0+XG4gIGZpbmRzID0gW11cbiAgdGFsbHkgPSB7fVxuXG4gIHRpY2sgPSAoa2V5KSAtPlxuICAgIGlmIHRhbGx5W2tleV0/IHRoZW4gdGFsbHlba2V5XSsrIGVsc2UgdGFsbHlba2V5XSA9IDFcblxuICBtYXRjaCA9IChrZXksIHRleHQpIC0+XG4gICAgaGl0ID0gdGV4dD8gYW5kIHRleHQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCBzZWFyY2hRdWVyeS50b0xvd2VyQ2FzZSgpICkgPj0gMFxuICAgIHRpY2sga2V5IGlmIGhpdFxuICAgIGhpdFxuXG4gIHN0YXJ0ID0gRGF0ZS5ub3coKVxuICBmb3Igb3duIG5laWdoYm9yU2l0ZSxuZWlnaGJvckluZm8gb2Ygd2lraS5uZWlnaGJvcmhvb2RcbiAgICBzaXRlbWFwID0gbmVpZ2hib3JJbmZvLnNpdGVtYXBcbiAgICB0aWNrICdzaXRlcycgaWYgc2l0ZW1hcD9cbiAgICBtYXRjaGluZ1BhZ2VzID0gXy5lYWNoIHNpdGVtYXAsIChwYWdlKS0+XG4gICAgICB0aWNrICdwYWdlcydcbiAgICAgIHJldHVybiB1bmxlc3MgbWF0Y2goJ3RpdGxlJywgcGFnZS50aXRsZSkgb3IgbWF0Y2goJ3RleHQnLCBwYWdlLnN5bm9wc2lzKSBvciBtYXRjaCgnc2x1ZycsIHBhZ2Uuc2x1ZylcbiAgICAgIHRpY2sgJ2ZpbmRzJ1xuICAgICAgZmluZHMucHVzaFxuICAgICAgICBwYWdlOiBwYWdlLFxuICAgICAgICBzaXRlOiBuZWlnaGJvclNpdGUsXG4gICAgICAgIHJhbms6IDEgIyBIQVJEQ09ERUQgRk9SIE5PV1xuICB0YWxseVsnbXNlYyddID0gRGF0ZS5ub3coKSAtIHN0YXJ0XG4gIHsgZmluZHMsIHRhbGx5IH1cblxuXG4kIC0+XG4gICRuZWlnaGJvcmhvb2QgPSAkKCcubmVpZ2hib3Job29kJylcblxuICBmbGFnID0gKHNpdGUpIC0+XG4gICAgIyBzdGF0dXMgY2xhc3MgcHJvZ3Jlc3Npb246IC53YWl0LCAuZmV0Y2gsIC5mYWlsIG9yIC5kb25lXG4gICAgXCJcIlwiXG4gICAgICA8c3BhbiBjbGFzcz1cIm5laWdoYm9yXCIgZGF0YS1zaXRlPVwiI3tzaXRlfVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwid2FpdFwiPlxuICAgICAgICAgIDxpbWcgc3JjPVwiaHR0cDovLyN7c2l0ZX0vZmF2aWNvbi5wbmdcIiB0aXRsZT1cIiN7c2l0ZX1cIj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L3NwYW4+XG4gICAgXCJcIlwiXG5cbiAgJCgnYm9keScpXG4gICAgLm9uICduZXctbmVpZ2hib3InLCAoZSwgc2l0ZSkgLT5cbiAgICAgICRuZWlnaGJvcmhvb2QuYXBwZW5kIGZsYWcgc2l0ZVxuICAgIC5kZWxlZ2F0ZSAnLm5laWdoYm9yIGltZycsICdjbGljaycsIChlKSAtPlxuICAgICAgd2lraS5kb0ludGVybmFsTGluayAnd2VsY29tZS12aXNpdG9ycycsIG51bGwsIEAudGl0bGVcblxuICBzZWFyY2ggPSBjcmVhdGVTZWFyY2goe25laWdoYm9yaG9vZH0pXG5cbiAgJCgnaW5wdXQuc2VhcmNoJykub24gJ2tleXByZXNzJywgKGUpLT5cbiAgICByZXR1cm4gaWYgZS5rZXlDb2RlICE9IDEzICMgMTMgPT0gcmV0dXJuXG4gICAgc2VhcmNoUXVlcnkgPSAkKHRoaXMpLnZhbCgpXG4gICAgc2VhcmNoLnBlcmZvcm1TZWFyY2goIHNlYXJjaFF1ZXJ5IClcbiAgICAkKHRoaXMpLnZhbChcIlwiKVxuIiwidXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5jb2ZmZWUnKVxuYWN0aXZlID0gcmVxdWlyZSgnLi9hY3RpdmUuY29mZmVlJylcblxuY3JlYXRlU2VhcmNoID0gKHtuZWlnaGJvcmhvb2R9KS0+XG4gIHBlcmZvcm1TZWFyY2ggPSAoc2VhcmNoUXVlcnkpLT5cbiAgICBzZWFyY2hSZXN1bHRzID0gbmVpZ2hib3Job29kLnNlYXJjaChzZWFyY2hRdWVyeSlcbiAgICB0YWxseSA9IHNlYXJjaFJlc3VsdHMudGFsbHlcblxuXG4gICAgZXhwbGFuYXRvcnlQYXJhID0ge1xuICAgICAgdHlwZTogJ3BhcmFncmFwaCdcbiAgICAgIGlkOiB1dGlsLnJhbmRvbUJ5dGVzKDgpXG4gICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgU3RyaW5nICcje3NlYXJjaFF1ZXJ5fScgZm91bmQgb24gI3t0YWxseS5maW5kc3x8J25vbmUnfSBvZiAje3RhbGx5LnBhZ2VzfHwnbm8nfSBwYWdlcyBmcm9tICN7dGFsbHkuc2l0ZXN8fCdubyd9IHNpdGVzLlxuICAgICAgICBUZXh0IG1hdGNoZWQgb24gI3t0YWxseS50aXRsZXx8J25vJ30gdGl0bGVzLCAje3RhbGx5LnRleHR8fCdubyd9IHBhcmFncmFwaHMsIGFuZCAje3RhbGx5LnNsdWd8fCdubyd9IHNsdWdzLlxuICAgICAgICBFbGFwc2VkIHRpbWUgI3t0YWxseS5tc2VjfSBtaWxsaXNlY29uZHMuXG4gICAgICBcIlwiXCJcbiAgICB9XG4gICAgc2VhcmNoUmVzdWx0UmVmZXJlbmNlcyA9IGZvciByZXN1bHQgaW4gc2VhcmNoUmVzdWx0cy5maW5kc1xuICAgICAge1xuICAgICAgICBcInR5cGVcIjogXCJyZWZlcmVuY2VcIlxuICAgICAgICBcImlkXCI6IHV0aWwucmFuZG9tQnl0ZXMoOClcbiAgICAgICAgXCJzaXRlXCI6IHJlc3VsdC5zaXRlXG4gICAgICAgIFwic2x1Z1wiOiByZXN1bHQucGFnZS5zbHVnXG4gICAgICAgIFwidGl0bGVcIjogcmVzdWx0LnBhZ2UudGl0bGVcbiAgICAgICAgXCJ0ZXh0XCI6IHJlc3VsdC5wYWdlLnN5bm9wc2lzIHx8ICcnXG4gICAgICB9XG4gICAgc2VhcmNoUmVzdWx0UGFnZURhdGEgPSB7XG4gICAgICB0aXRsZTogXCJTZWFyY2ggUmVzdWx0c1wiXG4gICAgICBzdG9yeTogW2V4cGxhbmF0b3J5UGFyYV0uY29uY2F0KHNlYXJjaFJlc3VsdFJlZmVyZW5jZXMpXG4gICAgfVxuICAgICRzZWFyY2hSZXN1bHRQYWdlID0gd2lraS5jcmVhdGVQYWdlKCdzZWFyY2gtcmVzdWx0cycpLmFkZENsYXNzKCdnaG9zdCcpXG4gICAgJHNlYXJjaFJlc3VsdFBhZ2UuYXBwZW5kVG8oJCgnLm1haW4nKSlcbiAgICB3aWtpLmJ1aWxkUGFnZSggc2VhcmNoUmVzdWx0UGFnZURhdGEsIG51bGwsICRzZWFyY2hSZXN1bHRQYWdlIClcbiAgICBhY3RpdmUuc2V0KCQoJy5wYWdlJykubGFzdCgpKVxuXG5cbiAge1xuICAgIHBlcmZvcm1TZWFyY2hcbiAgfVxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVTZWFyY2hcbiIsImFjdGl2ZSA9IHJlcXVpcmUoJy4vYWN0aXZlLmNvZmZlZScpXG5cbm1vZHVsZS5leHBvcnRzID0gc3RhdGUgPSB7fVxuXG4jIEZVTkNUSU9OUyBhbmQgSEFORExFUlMgdG8gbWFuYWdlIGxvY2F0aW9uIGJhciBhbmQgYmFjayBidXR0b25cblxuc3RhdGUucGFnZXNJbkRvbSA9IC0+XG4gICQubWFrZUFycmF5ICQoXCIucGFnZVwiKS5tYXAgKF8sIGVsKSAtPiBlbC5pZFxuXG5zdGF0ZS51cmxQYWdlcyA9IC0+XG4gIChpIGZvciBpIGluICQobG9jYXRpb24pLmF0dHIoJ3BhdGhuYW1lJykuc3BsaXQoJy8nKSBieSAyKVsxLi5dXG5cbnN0YXRlLmxvY3NJbkRvbSA9IC0+XG4gICQubWFrZUFycmF5ICQoXCIucGFnZVwiKS5tYXAgKF8sIGVsKSAtPlxuICAgICQoZWwpLmRhdGEoJ3NpdGUnKSBvciAndmlldydcblxuc3RhdGUudXJsTG9jcyA9IC0+XG4gIChqIGZvciBqIGluICQobG9jYXRpb24pLmF0dHIoJ3BhdGhuYW1lJykuc3BsaXQoJy8nKVsxLi5dIGJ5IDIpXG5cbnN0YXRlLnNldFVybCA9IC0+XG4gIGRvY3VtZW50LnRpdGxlID0gJCgnLnBhZ2U6bGFzdCcpLmRhdGEoJ2RhdGEnKT8udGl0bGVcbiAgaWYgaGlzdG9yeSBhbmQgaGlzdG9yeS5wdXNoU3RhdGVcbiAgICBsb2NzID0gc3RhdGUubG9jc0luRG9tKClcbiAgICBwYWdlcyA9IHN0YXRlLnBhZ2VzSW5Eb20oKVxuICAgIHVybCA9IChcIi8je2xvY3M/W2lkeF0gb3IgJ3ZpZXcnfS8je3BhZ2V9XCIgZm9yIHBhZ2UsIGlkeCBpbiBwYWdlcykuam9pbignJylcbiAgICB1bmxlc3MgdXJsIGlzICQobG9jYXRpb24pLmF0dHIoJ3BhdGhuYW1lJylcbiAgICAgIGhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsIHVybClcblxuc3RhdGUuc2hvdyA9IChlKSAtPlxuICBvbGRQYWdlcyA9IHN0YXRlLnBhZ2VzSW5Eb20oKVxuICBuZXdQYWdlcyA9IHN0YXRlLnVybFBhZ2VzKClcbiAgb2xkTG9jcyA9IHN0YXRlLmxvY3NJbkRvbSgpXG4gIG5ld0xvY3MgPSBzdGF0ZS51cmxMb2NzKClcblxuICByZXR1cm4gaWYgKCFsb2NhdGlvbi5wYXRobmFtZSBvciBsb2NhdGlvbi5wYXRobmFtZSBpcyAnLycpXG5cbiAgcHJldmlvdXMgPSAkKCcucGFnZScpLmVxKDApXG5cbiAgZm9yIG5hbWUsIGlkeCBpbiBuZXdQYWdlc1xuICAgIHVubGVzcyBuYW1lIGlzIG9sZFBhZ2VzW2lkeF1cbiAgICAgIG9sZCA9ICQoJy5wYWdlJykuZXEoaWR4KVxuICAgICAgb2xkLnJlbW92ZSgpIGlmIG9sZFxuICAgICAgd2lraS5jcmVhdGVQYWdlKG5hbWUsIG5ld0xvY3NbaWR4XSkuaW5zZXJ0QWZ0ZXIocHJldmlvdXMpLmVhY2ggd2lraS5yZWZyZXNoXG4gICAgcHJldmlvdXMgPSAkKCcucGFnZScpLmVxKGlkeClcblxuICBwcmV2aW91cy5uZXh0QWxsKCkucmVtb3ZlKClcblxuICBhY3RpdmUuc2V0KCQoJy5wYWdlJykubGFzdCgpKVxuICBkb2N1bWVudC50aXRsZSA9ICQoJy5wYWdlOmxhc3QnKS5kYXRhKCdkYXRhJyk/LnRpdGxlXG5cbnN0YXRlLmZpcnN0ID0gLT5cbiAgc3RhdGUuc2V0VXJsKClcbiAgZmlyc3RVcmxQYWdlcyA9IHN0YXRlLnVybFBhZ2VzKClcbiAgZmlyc3RVcmxMb2NzID0gc3RhdGUudXJsTG9jcygpXG4gIG9sZFBhZ2VzID0gc3RhdGUucGFnZXNJbkRvbSgpXG4gIGZvciB1cmxQYWdlLCBpZHggaW4gZmlyc3RVcmxQYWdlcyB3aGVuIHVybFBhZ2Ugbm90IGluIG9sZFBhZ2VzXG4gICAgd2lraS5jcmVhdGVQYWdlKHVybFBhZ2UsIGZpcnN0VXJsTG9jc1tpZHhdKS5hcHBlbmRUbygnLm1haW4nKSB1bmxlc3MgdXJsUGFnZSBpcyAnJ1xuXG4iLCJ1dGlsID0gcmVxdWlyZSAnLi91dGlsLmNvZmZlZSdcblxubW9kdWxlLmV4cG9ydHMgPSAoam91cm5hbEVsZW1lbnQsIGFjdGlvbikgLT5cbiAgcGFnZUVsZW1lbnQgPSBqb3VybmFsRWxlbWVudC5wYXJlbnRzKCcucGFnZTpmaXJzdCcpXG4gIHByZXYgPSBqb3VybmFsRWxlbWVudC5maW5kKFwiLmVkaXRbZGF0YS1pZD0je2FjdGlvbi5pZCB8fCAwfV1cIikgaWYgYWN0aW9uLnR5cGUgPT0gJ2VkaXQnXG4gIGFjdGlvblRpdGxlID0gYWN0aW9uLnR5cGVcbiAgYWN0aW9uVGl0bGUgKz0gXCIgI3t1dGlsLmZvcm1hdEVsYXBzZWRUaW1lKGFjdGlvbi5kYXRlKX1cIiBpZiBhY3Rpb24uZGF0ZT9cbiAgYWN0aW9uRWxlbWVudCA9ICQoXCJcIlwiPGEgaHJlZj1cIiNcIiAvPiBcIlwiXCIpLmFkZENsYXNzKFwiYWN0aW9uXCIpLmFkZENsYXNzKGFjdGlvbi50eXBlKVxuICAgIC50ZXh0KHV0aWwuc3ltYm9sc1thY3Rpb24udHlwZV0pXG4gICAgLmF0dHIoJ3RpdGxlJyxhY3Rpb25UaXRsZSlcbiAgICAuYXR0cignZGF0YS1pZCcsIGFjdGlvbi5pZCB8fCBcIjBcIilcbiAgICAuZGF0YSgnYWN0aW9uJywgYWN0aW9uKVxuICBjb250cm9scyA9IGpvdXJuYWxFbGVtZW50LmNoaWxkcmVuKCcuY29udHJvbC1idXR0b25zJylcbiAgaWYgY29udHJvbHMubGVuZ3RoID4gMFxuICAgIGFjdGlvbkVsZW1lbnQuaW5zZXJ0QmVmb3JlKGNvbnRyb2xzKVxuICBlbHNlXG4gICAgYWN0aW9uRWxlbWVudC5hcHBlbmRUbyhqb3VybmFsRWxlbWVudClcbiAgaWYgYWN0aW9uLnR5cGUgPT0gJ2ZvcmsnIGFuZCBhY3Rpb24uc2l0ZT9cbiAgICBhY3Rpb25FbGVtZW50XG4gICAgICAuY3NzKFwiYmFja2dyb3VuZC1pbWFnZVwiLCBcInVybCgvLyN7YWN0aW9uLnNpdGV9L2Zhdmljb24ucG5nKVwiKVxuICAgICAgLmF0dHIoXCJocmVmXCIsIFwiLy8je2FjdGlvbi5zaXRlfS8je3BhZ2VFbGVtZW50LmF0dHIoJ2lkJyl9Lmh0bWxcIilcbiAgICAgIC5kYXRhKFwic2l0ZVwiLCBhY3Rpb24uc2l0ZSlcbiAgICAgIC5kYXRhKFwic2x1Z1wiLCBwYWdlRWxlbWVudC5hdHRyKCdpZCcpKVxuXG4iXX0=
;