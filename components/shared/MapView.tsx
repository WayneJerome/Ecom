'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';

interface MapViewProps {
  center: [number, number];
  zoom?: number;
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    label?: string;
    type?: 'store' | 'rider' | 'destination';
  }>;
  routePoints?: Array<[number, number]>;
  height?: string;
  className?: string;
}

// Core map rendering — only loaded client-side
function MapInner({
  center,
  zoom = 14,
  markers = [],
  routePoints = [],
  height = '400px',
  className = '',
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<import('leaflet').Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then((L) => {
      // Patch default icon
      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });
      L.Marker.prototype.options.icon = DefaultIcon;

      const map = L.map(mapRef.current!, { zoomControl: false })
        .setView(center, zoom);

      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '© OpenStreetMap contributors', maxZoom: 19 }
      ).addTo(map);

      // Zoom control top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Add markers
      markers.forEach((m) => {
        const color = m.type === 'rider' ? '#0ea5e9' : m.type === 'destination' ? '#10b981' : '#8b5cf6';
        const icon = L.divIcon({
          html: `<div style="
            width:36px;height:36px;border-radius:50% 50% 50% 0;
            background:${color};border:3px solid white;
            box-shadow:0 4px 12px rgba(0,0,0,0.25);
            transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;
          "></div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          className: '',
        });
        const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
        if (m.label) marker.bindPopup(`<b>${m.label}</b>`);
      });

      // Draw route if points provided
      if (routePoints.length > 1) {
        L.polyline(routePoints, {
          color: '#0ea5e9',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 4',
        }).addTo(map);
      }

      leafletMapRef.current = map;
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center/markers when props change
  useEffect(() => {
    if (!leafletMapRef.current) return;
    leafletMapRef.current.setView(center, zoom, { animate: true });
  }, [center, zoom]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%', borderRadius: '20px', overflow: 'hidden' }}
      className={className}
    />
  );
}

// Export with dynamic to disable SSR
export const MapView = dynamic(() => Promise.resolve(MapInner), { ssr: false });
