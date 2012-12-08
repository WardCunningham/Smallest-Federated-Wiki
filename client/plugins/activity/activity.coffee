window.plugins.activity =
  emit: ($item, item) ->
  bind: ($item, item) ->

    display = (pages) ->
      now = (new Date).getTime();
      sections = [
        {date: now-1000*60*60*24*365, period: 'Years'}
        {date: now-1000*60*60*24*91, period: 'a Year'}
        {date: now-1000*60*60*24*31, period: 'a Season'}
        {date: now-1000*60*60*24*7, period: 'a Month'}
        {date: now-1000*60*60*24, period: 'a Week'}
        {date: now-1000*60*60, period: 'a Day'}
        {date: now-1000*60, period: 'an Hour'}
        {date: now-1000, period: 'a Minute'}
        {date: now, period: 'Seconds'}
      ]
      $item.empty()
      bigger = now
      for sites in pages
        smaller = sites[0].page.date
        for section in sections
          if section.date > smaller and section.date < bigger
            $item.append """
              <h3> Within #{section.period} </h3>
            """
            break
        bigger = smaller
        for each, i in sites
          joint = if sites[i+1]?.page.date == each.page.date then "" else "&nbsp"
          $item.append """
            <img class="remote"
              title="#{each.site}\n#{wiki.util.formatElapsedTime each.page.date}"
              src="http://#{each.site}/favicon.png"
              data-site="#{each.site}"
              data-slug="#{each.page.slug}">#{joint}
          """
        context = if sites[0].site == location.host then "view" else "view => #{sites[0].site}"
        $item.append """
          <a class="internal"
            href="/#{sites[0].page.slug}"
            data-page-name="#{sites[0].page.slug}"
            title="#{context}">
            #{sites[0].page.title || sites[0].page.slug}
          </a><br>
        """

    
    merge = (neighborhood) ->
      pages = {}
      for site, map of neighborhood
        continue if map.sitemapRequestInflight or !(map.sitemap?)
        for each in map.sitemap
          sites = pages[each.slug]
          pages[each.slug] = sites = [] unless sites?
          sites.push {site: site, page: each}
      for slug, sites of pages
        sites.sort (a, b) ->
          (b.page.date || 0) - (a.page.date || 0)
      pages = (sites for slug, sites of pages)
      pages.sort (a, b) ->
          (b[0].page.date || 0) - (a[0].page.date || 0)
      pages

    display merge wiki.neighborhood

    $('body').on 'new-neighbor-done', (e, site) ->
      display merge wiki.neighborhood
