export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** 2地点間の大円距離（km）。数十kmの範囲なら誤差は無視できる */
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

/** 座標が入っている美術館だけを、現在地から近い順に並べる */
export function sortByDistance<T extends { lat: number | null; lng: number | null }>(
  items: T[],
  from: LatLng
): (T & { distanceKm: number })[] {
  return items
    .filter((m): m is T & LatLng => m.lat !== null && m.lng !== null)
    .map((m) => ({ ...m, distanceKm: distanceKm(from, { lat: m.lat, lng: m.lng }) }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
