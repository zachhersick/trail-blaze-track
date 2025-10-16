import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface ActivityMapProps {
  center?: [number, number];
  trackPoints?: Array<{ latitude: number; longitude: number }>;
  className?: string;
}

const ActivityMap = ({ center, trackPoints = [], className = '' }: ActivityMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const userMarker = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize MapLibre with OpenStreetMap tiles
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: center || [0, 0],
      zoom: center ? 15 : 2,
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Add scale control
    map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    // Cleanup
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update center when position changes
  useEffect(() => {
    if (!map.current || !center) return;

    map.current.setCenter(center);

    // Update or create user marker
    if (userMarker.current) {
      userMarker.current.setLngLat(center);
    } else {
      userMarker.current = new maplibregl.Marker({ color: '#FF6B6B' })
        .setLngLat(center)
        .addTo(map.current);
    }
  }, [center]);

  // Update track line when trackPoints change
  useEffect(() => {
    if (!map.current || trackPoints.length < 2) return;

    const coordinates = trackPoints.map(point => [point.longitude, point.latitude]);

    if (map.current.getSource('route')) {
      (map.current.getSource('route') as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates,
        },
      });
    } else {
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        },
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#4F46E5',
          'line-width': 4,
        },
      });
    }

    // Fit bounds to show entire route
    if (coordinates.length > 1) {
      const bounds = coordinates.reduce(
        (bounds, coord) => bounds.extend(coord as [number, number]),
        new maplibregl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number])
      );
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [trackPoints]);

  return <div ref={mapContainer} className={`w-full h-full ${className}`} />;
};

export default ActivityMap;
