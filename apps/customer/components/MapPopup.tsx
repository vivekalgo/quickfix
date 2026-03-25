'use client'
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix default icon issue with Next.js/Leaflet
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

function LocationMarker({ position, setPosition }: { position: [number, number], setPosition: (p: [number, number]) => void }) {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng])
        },
    })
    return position === null ? null : <Marker position={position} icon={icon}></Marker>
}

// to recenter map when position changes from outside (e.g. search)
function Recenter({ lat, lng }: { lat: number, lng: number }) {
    const map = useMapEvents({})
    useEffect(() => {
        map.setView([lat, lng])
    }, [lat, lng, map])
    return null
}

export default function MapPopup({ position, setPosition }: { position: [number, number], setPosition: (p: [number, number]) => void }) {
    return (
        <MapContainer center={position} zoom={13} scrollWheelZoom={true} style={{ height: '250px', width: '100%', zIndex: 0 }}>
            <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
            <Recenter lat={position[0]} lng={position[1]} />
        </MapContainer>
    )
}
