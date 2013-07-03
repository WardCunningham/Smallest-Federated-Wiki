(function() {
  window.plugins.activity = {
    emit: function($item, item) {},
    bind: function($item, item) {
      var display, merge;
      display = function(pages) {
        var bigger, context, each, i, joint, now, section, sections, sites, smaller, _i, _j, _k, _len, _len1, _len2, _ref, _results;
        now = (new Date).getTime();
        sections = [
          {
            date: now - 1000 * 60 * 60 * 24 * 365,
            period: 'Years'
          }, {
            date: now - 1000 * 60 * 60 * 24 * 91,
            period: 'a Year'
          }, {
            date: now - 1000 * 60 * 60 * 24 * 31,
            period: 'a Season'
          }, {
            date: now - 1000 * 60 * 60 * 24 * 7,
            period: 'a Month'
          }, {
            date: now - 1000 * 60 * 60 * 24,
            period: 'a Week'
          }, {
            date: now - 1000 * 60 * 60,
            period: 'a Day'
          }, {
            date: now - 1000 * 60,
            period: 'an Hour'
          }, {
            date: now - 1000,
            period: 'a Minute'
          }, {
            date: now,
            period: 'Seconds'
          }
        ];
        $item.empty();
        bigger = now;
        _results = [];
        for (_i = 0, _len = pages.length; _i < _len; _i++) {
          sites = pages[_i];
          smaller = sites[0].page.date;
          for (_j = 0, _len1 = sections.length; _j < _len1; _j++) {
            section = sections[_j];
            if (section.date > smaller && section.date < bigger) {
              $item.append("<h3> Within " + section.period + " </h3>");
              break;
            }
          }
          bigger = smaller;
          for (i = _k = 0, _len2 = sites.length; _k < _len2; i = ++_k) {
            each = sites[i];
            joint = ((_ref = sites[i + 1]) != null ? _ref.page.date : void 0) === each.page.date ? "" : "&nbsp";
            $item.append("<img class=\"remote\"\n  title=\"" + each.site + "\n" + (wiki.util.formatElapsedTime(each.page.date)) + "\"\n  src=\"http://" + each.site + "/favicon.png\"\n  data-site=\"" + each.site + "\"\n  data-slug=\"" + each.page.slug + "\">" + joint);
          }
          context = sites[0].site === location.host ? "view" : "view => " + sites[0].site;
          _results.push($item.append("<a class=\"internal\"\n  href=\"/" + sites[0].page.slug + "\"\n  data-page-name=\"" + sites[0].page.slug + "\"\n  title=\"" + context + "\">\n  " + (sites[0].page.title || sites[0].page.slug) + "\n</a><br>"));
        }
        return _results;
      };
      merge = function(neighborhood) {
        var each, map, pages, site, sites, slug, _i, _len, _ref;
        pages = {};
        for (site in neighborhood) {
          map = neighborhood[site];
          if (map.sitemapRequestInflight || !(map.sitemap != null)) {
            continue;
          }
          _ref = map.sitemap;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            each = _ref[_i];
            sites = pages[each.slug];
            if (sites == null) {
              pages[each.slug] = sites = [];
            }
            sites.push({
              site: site,
              page: each
            });
          }
        }
        for (slug in pages) {
          sites = pages[slug];
          sites.sort(function(a, b) {
            return (b.page.date || 0) - (a.page.date || 0);
          });
        }
        pages = (function() {
          var _results;
          _results = [];
          for (slug in pages) {
            sites = pages[slug];
            _results.push(sites);
          }
          return _results;
        })();
        pages.sort(function(a, b) {
          return (b[0].page.date || 0) - (a[0].page.date || 0);
        });
        return pages;
      };
      display(merge(wiki.neighborhood));
      return $('body').on('new-neighbor-done', function(e, site) {
        return display(merge(wiki.neighborhood));
      });
    }
  };

}).call(this);
