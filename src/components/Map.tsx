"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Destination } from "@/types/destination";
import { getCategoryInfo } from "@/data/categories";

// Fix default marker icons in Leaflet + webpack
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface MapProps {
  destinations: Destination[];
  selectedId?: string | null;
  onSelectDestination?: (id: string) => void;
}

function FitBounds({ destinations }: { destinations: Destination[] }) {
  const map = useMap();

  useEffect(() => {
    if (destinations.length === 0) return;

    if (destinations.length === 1) {
      map.setView(
        [destinations[0].coordinates.lat, destinations[0].coordinates.lng],
        10
      );
      return;
    }

    const bounds = L.latLngBounds(
      destinations.map((d) => [d.coordinates.lat, d.coordinates.lng])
    );
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [destinations, map]);

  return null;
}

export default function Map({
  destinations,
  selectedId,
  onSelectDestination,
}: MapProps) {
  return (
    <MapContainer
      center={[62.0, 15.0]}
      zoom={5}
      className="w-full h-full min-h-[400px] rounded-xl z-0"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds destinations={destinations} />
      {destinations.map((dest) => {
        const cat = getCategoryInfo(dest.category);
        return (
          <Marker
            key={dest.id}
            position={[dest.coordinates.lat, dest.coordinates.lng]}
            eventHandlers={{
              click: () => onSelectDestination?.(dest.id),
            }}
            opacity={selectedId && selectedId !== dest.id ? 0.5 : 1}
          >
            <Popup>
              <div className="text-sm">
                <strong>{dest.name}</strong>
                {cat && (
                  <span
                    className={`ml-2 text-xs px-1.5 py-0.5 rounded ${cat.bgColor} ${cat.color}`}
                  >
                    {cat.name}
                  </span>
                )}
                <p className="text-gray-500 mt-1">{dest.city}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
