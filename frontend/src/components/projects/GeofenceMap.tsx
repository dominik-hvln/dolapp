'use client';

import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Fix for Leaflet icons in Next.js
const createCustomIcon = () => new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface GeofenceMapProps {
    center: [number, number];
    radius: number;
    onCenterChange: (latlng: L.LatLng) => void;
}

// Komponent pomocniczy do obsługi kliknięć na mapie
function MapEventsHandler({ onCenterChange }: { onCenterChange: (latlng: L.LatLng) => void }) {
    useMapEvents({
        click(e: L.LeafletMouseEvent) {
            onCenterChange(e.latlng);
        },
    });
    return null;
}

export function GeofenceMap({ center, radius, onCenterChange }: GeofenceMapProps) {
    const [icon, setIcon] = useState<L.Icon | null>(null);

    useEffect(() => {
        // Inicjalizacja ikony tylko po stronie klienta
        setIcon(createCustomIcon());
    }, []);

    if (!icon) return null; // Lub jakiś placeholder

    return (
        <MapContainer center={center} zoom={15} style={{ height: '400px', width: '100%' }} className="rounded-md z-0">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker
                position={center}
                draggable={true}
                icon={icon}
                eventHandlers={{ dragend: (e: L.DragEndEvent) => onCenterChange(e.target.getLatLng()) }}
            />
            <Circle center={center} radius={radius} pathOptions={{ color: 'blue' }} />
            <MapEventsHandler onCenterChange={onCenterChange} />
        </MapContainer>
    );
}