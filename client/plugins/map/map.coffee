window.plugins.map =
  bind: (div, item) ->
  emit: (div, item) ->
    wiki.getScript "http://open.mapquestapi.com/sdk/js/v7.0.s/mqa.toolkit.js", ->
      div.css 'height', '300px'
      options = 
        elt: div[0]
        zoom: item.zoom || 13
        latLng: item.latlng || {lat:40.735383, lng:-73.984655}
        mtype: 'osm'
        bestFitMargin: 0,
        zoomOnDoubleClick: true
      
      map = new MQA.TileMap options
      
      MQA.withModule 'largezoom','viewoptions','geolocationcontrol','mousewheel',  ->
         map.addControl(new MQA.LargeZoom, new MQA.MapCornerPlacement(MQA.MapCorner.TOP_LEFT, new MQA.Size(5,5)))
         map.addControl(new MQA.GeolocationControl, new MQA.MapCornerPlacement(MQA.MapCorner.TOP_RIGHT, new MQA.Size(10,10)))
         
      spot = new MQA.Poi({lat:40.735383, lng:-73.984655})
      map.addShape spot
         
      MQA.EventManager.addListener map, 'dragend', (e) ->
        center = map.getCenter()
        item.latlng = { lat: center.lat, lng: center.lng }
        plugins.map.save(div, item)
      
      MQA.EventManager.addListener map, 'zoomend', (e) ->
        item.zoom = e.zoom
        plugins.map.save(div, item)
        
  save: (div, item) ->
    wiki.pageHandler.put div.parents('.page:first'),
      type: 'edit',
      id: item.id,
      item: item