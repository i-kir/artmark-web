import { useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import type { Museum } from '../types';
import type { LatLng } from '../lib/geo';
import { distanceKm, formatDistance } from '../lib/geo';

// Leaflet の既定マーカーは画像パスがバンドラーで壊れるため、DOM 要素で描く
const pinIcon = (label: string) =>
  L.divIcon({
    className: '',
    html: `<div style="background:#d4a574;color:#1a1a2e;border:2px solid #1a1a2e;border-radius:9999px;width:28px;height:28px;display:grid;place-items:center;font-size:13px;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,.4)">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

const meIcon = L.divIcon({
  className: '',
  html: '<div style="background:#2563eb;border:3px solid #fff;border-radius:9999px;width:18px;height:18px;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

type MuseumMapProps = {
  museums: Museum[];
  center?: LatLng;
  zoom?: number;
  myPosition?: LatLng | null;
  className?: string;
};

/** 日本全体がおおよそ収まる位置 */
const DEFAULT_CENTER: LatLng = { lat: 35.4, lng: 137.0 };

export default function MuseumMap({
  museums,
  center,
  zoom = 5,
  myPosition,
  className = 'h-[60vh] min-h-[320px] w-full rounded-xl overflow-hidden',
}: MuseumMapProps) {
  const located = useMemo(
    () => museums.filter((m): m is Museum & LatLng => m.lat !== null && m.lng !== null),
    [museums]
  );

  const mapCenter = center ?? myPosition ?? (located[0] ? { lat: located[0].lat, lng: located[0].lng } : DEFAULT_CENTER);

  return (
    <div className={className}>
      <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={zoom} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {myPosition && <Marker position={[myPosition.lat, myPosition.lng]} icon={meIcon} />}

        {located.map((museum) => (
          <Marker
            key={museum.id}
            position={[museum.lat, museum.lng]}
            icon={pinIcon(museum.name.slice(0, 1))}
          >
            <Popup>
              <p className="font-bold">{museum.name}</p>
              <p className="text-xs text-gray-600">{museum.address}</p>
              {myPosition && (
                <p className="mt-1 text-xs text-gray-600">
                  現在地から {formatDistance(distanceKm(myPosition, { lat: museum.lat, lng: museum.lng }))}
                </p>
              )}
              <Link to={`/museum/${museum.id}`} className="mt-1 inline-block text-navy-accent underline">
                詳細を見る
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
