window.plugins.map =
  bind: (div, item) ->
  emit: (div, item) ->
    wiki.getScript "http://open.mapquestapi.com/sdk/js/v7.0.s/mqa.toolkit.js", ->
        div.css 'height', '300px'
        options = 
          elt: div[0]
          zoom: 13
          latLng: {lat:40.735383, lng:-73.984655}
          mtype: 'osm'
          bestFitMargin: 0,
          zoomOnDoubleClick: 0
        
        map = new MQA.TileMap options
        
        MQA.withModule 'largezoom','viewoptions','geolocationcontrol','mousewheel',  ->
           map.addControl(new MQA.LargeZoom, new MQA.MapCornerPlacement(MQA.MapCorner.TOP_LEFT, new MQA.Size(5,5)))
           map.addControl(new MQA.GeolocationControl, new MQA.MapCornerPlacement(MQA.MapCorner.TOP_RIGHT, new MQA.Size(10,10)))
           
        spot = new MQA.Poi({lat:40.735383, lng:-73.984655})
        map.addShape spot
           