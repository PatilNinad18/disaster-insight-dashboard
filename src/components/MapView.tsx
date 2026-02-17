import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapViewProps {
  center: [number, number];
  zoom: number;
  riskOverlay?: {
    lat: number;
    lng: number;
    type: "flood" | "earthquake";
    intensity: number; // 0-1
  } | null;
}

const MapView = ({ center, zoom, riskOverlay }: MapViewProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update center/zoom
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom]);

  // Update risk overlay
  useEffect(() => {
    if (!mapRef.current) return;

    if (overlayRef.current) {
      overlayRef.current.remove();
      overlayRef.current = null;
    }

    if (riskOverlay) {
      const color = riskOverlay.type === "flood" ? "#3b82f6" : "#f97316";
      const radius = 15000 + riskOverlay.intensity * 35000;

      overlayRef.current = L.circle([riskOverlay.lat, riskOverlay.lng], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.15 + riskOverlay.intensity * 0.25,
        weight: 2,
        opacity: 0.6,
      }).addTo(mapRef.current);

      // Add inner circle for intensity
      const inner = L.circle([riskOverlay.lat, riskOverlay.lng], {
        radius: radius * 0.4,
        color,
        fillColor: color,
        fillOpacity: 0.3 + riskOverlay.intensity * 0.3,
        weight: 1,
        opacity: 0.8,
      }).addTo(mapRef.current);

      const origRemove = overlayRef.current.remove.bind(overlayRef.current);
      overlayRef.current.remove = () => {
        inner.remove();
        return origRemove();
      };
    }
  }, [riskOverlay]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-lg border border-border overflow-hidden"
    />
  );
};

export default MapView;
