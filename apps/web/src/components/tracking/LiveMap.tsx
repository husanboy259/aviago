'use client';

import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Props {
  droneLocation: { lat: number; lng: number } | null;
  destination?: { latitude: number; longitude: number; street?: string };
}

export default function LiveMap({ droneLocation, destination }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const droneMarker = useRef<mapboxgl.Marker | null>(null);
  const destMarker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const center: [number, number] = droneLocation
      ? [droneLocation.lng, droneLocation.lat]
      : destination
      ? [destination.longitude, destination.latitude]
      : [69.2401, 41.2995];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center,
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Destination marker
    if (destination) {
      const el = document.createElement('div');
      el.innerHTML = '📍';
      el.style.fontSize = '28px';
      destMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([destination.longitude, destination.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`<p style="color:#000">${destination.street || 'Your location'}</p>`))
        .addTo(map.current);
    }
  }, []);

  useEffect(() => {
    if (!map.current || !droneLocation) return;

    const lngLat: [number, number] = [droneLocation.lng, droneLocation.lat];

    if (!droneMarker.current) {
      const el = document.createElement('div');
      el.innerHTML = '🚁';
      el.style.fontSize = '32px';
      el.className = 'animate-drone-hover';
      droneMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat(lngLat)
        .addTo(map.current!);

      const pulse = document.createElement('div');
      pulse.className = 'w-12 h-12 rounded-full border-2 border-brand-500 animate-pulse-ring absolute -translate-x-1/2 -translate-y-1/2';
    } else {
      droneMarker.current.setLngLat(lngLat);
    }

    map.current.flyTo({ center: lngLat, zoom: 14, speed: 0.5 });
  }, [droneLocation]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
