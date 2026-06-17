import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface Coordinate {
  latitude: number;
  longitude: number;
  speed?: number;
}

interface LeafletMapProps {
  coordinates?: Coordinate[];
  userLocation?: Coordinate | null;
  interactive?: boolean;
  mapMode?: 'follow' | 'free' | '3d';
  showHeatmap?: boolean;
  heatmapData?: Coordinate[];
  autoFitBounds?: boolean;
  extraLayers?: { coordinates: Coordinate[]; color: string }[];
}

export default function LeafletMap({
  coordinates = [],
  userLocation = null,
  interactive = true,
  mapMode = 'follow',
  showHeatmap = false,
  heatmapData = [],
  autoFitBounds = false,
  extraLayers = [],
}: LeafletMapProps) {
  const webViewRef = useRef<WebView>(null);

  // Generate the HTML code containing Leaflet and OSM
  // We initialize this once so the WebView source is stable and doesn't reload.
  const [htmlContent] = React.useState(() => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
        <style>
          html, body, #map {
            height: 100%;
            margin: 0;
            padding: 0;
            background: #E6E4E0;
          }
          .map-3d-pitch {
            transform: perspective(600px) rotateX(45deg);
            transform-origin: bottom center;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', {
            zoomControl: ${interactive},
            attributionControl: false,
            dragging: ${interactive},
            touchZoom: ${interactive},
            doubleClickZoom: ${interactive},
            scrollWheelZoom: ${interactive}
          }).setView([-6.200000, 106.816666], 15);

          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 20
          }).addTo(map);

          var routePolyline = null;
          var userMarker = null;
          var startMarker = null;
          var endMarker = null;
          var heatLayer = null;
          var currentMode = 'follow';
          var hasSetInitialView = false;
          var extraPolylines = [];

          function updateMap(routeCoords, userLoc, mode, showHeat, heatCoords, autoFit, extraLyrs) {
            currentMode = mode;
            var mapContainer = document.getElementById('map');
            
            if (mode === '3d') {
              mapContainer.classList.add('map-3d-pitch');
            } else {
              mapContainer.classList.remove('map-3d-pitch');
            }

            if (routePolyline) { map.removeLayer(routePolyline); }
            if (startMarker) { map.removeLayer(startMarker); }
            if (endMarker) { map.removeLayer(endMarker); }
            extraPolylines.forEach(function(l) { map.removeLayer(l); });
            extraPolylines = [];

            if (routeCoords && routeCoords.length > 1) {
              routePolyline = L.layerGroup().addTo(map);
              
              // Find max speed in this specific route for dynamic scaling
              var maxSpeed = 0;
              for (var j = 0; j < routeCoords.length; j++) {
                if (routeCoords[j][2] > maxSpeed) maxSpeed = routeCoords[j][2];
              }
              if (maxSpeed < 10) maxSpeed = 10; // Fallback min scale
              var step = maxSpeed / 5;

              for (var i = 0; i < routeCoords.length - 1; i++) {
                var p1 = routeCoords[i];
                var p2 = routeCoords[i+1];
                var speed = p2[2] || 0;
                
                var segmentColor = '#0A84FF';
                if (speed < step) segmentColor = '#0A84FF'; // Dark Blue (0-20%)
                else if (speed < step * 2) segmentColor = '#30D158'; // Green (20-40%)
                else if (speed < step * 3) segmentColor = '#FF9F0A'; // Orange (40-60%)
                else if (speed < step * 4) segmentColor = '#FF3B30'; // Red (60-80%)
                else segmentColor = '#AF52DE'; // Purple (80%+)
                
                L.polyline([ [p1[0], p1[1]], [p2[0], p2[1]] ], {
                  color: segmentColor,
                  weight: 6,
                  opacity: 0.9,
                  lineCap: 'round'
                }).addTo(routePolyline);
              }

              // Add Start/End Markers
              var startIcon = L.divIcon({
                html: '<div style="background-color:#30D158; width:12px; height:12px; border-radius:6px; border:2px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
                className: '', iconSize: [12, 12], iconAnchor: [6, 6]
              });
              var endIcon = L.divIcon({
                html: '<div style="background-color:#FF3B30; width:12px; height:12px; border-radius:6px; border:2px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
                className: '', iconSize: [12, 12], iconAnchor: [6, 6]
              });

              startMarker = L.marker([routeCoords[0][0], routeCoords[0][1]], {icon: startIcon}).addTo(map);
              endMarker = L.marker([routeCoords[routeCoords.length-1][0], routeCoords[routeCoords.length-1][1]], {icon: endIcon}).addTo(map);

              if (!hasSetInitialView || autoFit) {
                var bounds = L.latLngBounds(routeCoords.map(function(c) { return [c[0], c[1]]; }));
                if (userLoc) bounds.extend(userLoc); // Include user location in bounds
                
                if (bounds.isValid()) {
                  map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
                  hasSetInitialView = true;
                }
              }
            }

            if (heatLayer) { map.removeLayer(heatLayer); }
            if (showHeat && heatCoords && heatCoords.length > 0) {
               var heatPoints = heatCoords.map(function(c) { return [c[0], c[1], 1.0]; });
               heatLayer = L.heatLayer(heatPoints, {
                 radius: 20, blur: 15, maxZoom: 17,
                 gradient: {0.4: '#0A84FF', 0.6: '#30D158', 0.8: '#FF9F0A', 1.0: '#FF3B30'}
               }).addTo(map);
            }

            if (extraLyrs && extraLyrs.length > 0) {
               extraLyrs.forEach(function(layer) {
                 if (layer.coordinates && layer.coordinates.length > 1) {
                   var poly = L.polyline(layer.coordinates.map(function(c) { return [c.latitude, c.longitude]; }), {
                     color: layer.color || '#F97316',
                     weight: 5,
                     opacity: 0.8,
                     dashArray: '10, 10'
                   }).addTo(map);
                   
                   if (layer.name) {
                      var midIndex = Math.floor(layer.coordinates.length / 2);
                      var midCoord = layer.coordinates[midIndex];
                      var labelIcon = L.divIcon({
                        className: 'segment-label',
                        html: '<div style="background: rgba(249, 115, 22, 0.95); color: white; padding: 4px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; white-space: nowrap; border: 2px solid #09090F; box-shadow: 0 4px 12px rgba(0,0,0,0.5); font-family: sans-serif;">🏁 ' + layer.name + '</div>',
                        iconSize: [null, null],
                        iconAnchor: [0, 0]
                      });
                      var labelMarker = L.marker([midCoord.latitude, midCoord.longitude], {icon: labelIcon}).addTo(map);
                      extraPolylines.push(labelMarker);
                      
                      // bind popup just in case
                      poly.bindPopup('<b>Segment:</b> ' + layer.name);
                   }
                   extraPolylines.push(poly);
                 }
               });
             }

            if (userMarker) { map.removeLayer(userMarker); }
            if (userLoc && !showHeat) {
              userMarker = L.circleMarker(userLoc, {
                radius: 8, fillColor: '#0A84FF', color: '#ffffff', weight: 3, opacity: 1, fillOpacity: 0.9
              }).addTo(map);

              if ((mode === 'follow' || mode === '3d') && !autoFit) {
                if (!hasSetInitialView) {
                  map.setView(userLoc, 16);
                  hasSetInitialView = true;
                } else {
                  map.setView(userLoc, map.getZoom());
                }
              }
            }
          }
        </script>
      </body>
      </html>
    `;
  });

  const injectUpdate = () => {
    if (webViewRef.current) {
      const polylineData = JSON.stringify(coordinates.map(c => [c.latitude, c.longitude, c.speed ?? 0]));
      const userLocData = userLocation ? JSON.stringify([userLocation.latitude, userLocation.longitude]) : 'null';
      const heatDataString = showHeatmap ? JSON.stringify(heatmapData.map(c => [c.latitude, c.longitude])) : '[]';

      const extraLayersData = JSON.stringify(extraLayers);
 
       webViewRef.current.injectJavaScript(`
         if (typeof updateMap === 'function') {
           updateMap(${polylineData}, ${userLocData}, '${mapMode}', ${showHeatmap}, ${heatDataString}, ${autoFitBounds}, ${extraLayersData});
         }
         true;
       `);
    }
  };

  useEffect(() => {
    injectUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates, userLocation, mapMode, showHeatmap, heatmapData, autoFitBounds, extraLayers]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={interactive}
        onLoadEnd={injectUpdate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});
