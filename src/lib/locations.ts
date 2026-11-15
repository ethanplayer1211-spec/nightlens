import type { Location } from './astronomy';
import { validTimeZone } from './observingTime';

export interface ObservingPlace extends Location { timeZone: string; source: 'preset' | 'search' | 'coordinates' | 'device'; elevationKnown: boolean }

export const OBSERVING_PLACES: ObservingPlace[] = [
  { id: 'penang', name: 'Penang, Malaysia', latitude: 5.4141, longitude: 100.3354, elevation: 10, elevationKnown: false, utcOffset: 8, timeZone: 'Asia/Kuala_Lumpur', source: 'preset' },
  { id: 'seoul', name: 'Seoul, South Korea', latitude: 37.5665, longitude: 126.978, elevation: 38, elevationKnown: false, utcOffset: 9, timeZone: 'Asia/Seoul', source: 'preset' },
  { id: 'kuala-lumpur', name: 'Kuala Lumpur, Malaysia', latitude: 3.139, longitude: 101.6869, elevation: 0, elevationKnown: false, utcOffset: 8, timeZone: 'Asia/Kuala_Lumpur', source: 'preset' },
  { id: 'sydney', name: 'Sydney, Australia', latitude: -33.8688, longitude: 151.2093, elevation: 0, elevationKnown: false, utcOffset: 10, timeZone: 'Australia/Sydney', source: 'preset' },
  { id: 'london', name: 'London, United Kingdom', latitude: 51.5074, longitude: -0.1278, elevation: 0, elevationKnown: false, utcOffset: 0, timeZone: 'Europe/London', source: 'preset' },
  { id: 'new-york', name: 'New York, United States', latitude: 40.7128, longitude: -74.006, elevation: 0, elevationKnown: false, utcOffset: -5, timeZone: 'America/New_York', source: 'preset' },
  { id: 'atacama', name: 'San Pedro de Atacama, Chile', latitude: -22.9111, longitude: -68.2011, elevation: 0, elevationKnown: false, utcOffset: -4, timeZone: 'America/Santiago', source: 'preset' },
];

export function coordinatePlace(latitude: number, longitude: number, timeZone = 'UTC', source: 'coordinates' | 'device' = 'coordinates'): ObservingPlace {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new RangeError('Latitude must be −90 to 90, longitude −180 to 180.');
  if (!validTimeZone(timeZone)) throw new RangeError('Enter a valid IANA timezone, such as Asia/Kuala_Lumpur or UTC.');
  return { id: `coordinates-${latitude.toFixed(5)}-${longitude.toFixed(5)}`, name: source === 'device' ? 'Your device coordinates' : `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`, latitude, longitude, elevation: 0, elevationKnown: false, timeZone, utcOffset: 0, source };
}

export function parseGeocoding(value: unknown): ObservingPlace[] {
  if (!value || typeof value !== 'object') throw new Error('Location service returned an invalid response');
  const results = (value as { results?: unknown[] }).results;
  if (results === undefined) return [];
  if (!Array.isArray(results)) throw new Error('Location service returned an invalid result list');
  return results.flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const r = item as Record<string, unknown>;
    if (typeof r.latitude !== 'number' || typeof r.longitude !== 'number' || Math.abs(r.latitude) > 90 || Math.abs(r.longitude) > 180 || !Number.isFinite(r.latitude) || !Number.isFinite(r.longitude) || typeof r.name !== 'string' || typeof r.timezone !== 'string' || !validTimeZone(r.timezone)) return [];
    const elevationKnown = typeof r.elevation === 'number' && Number.isFinite(r.elevation);
    return [{ id: `geonames-${String(r.id ?? `${r.latitude},${r.longitude}`)}`, name: [r.name, r.admin1, r.country].filter((v, i, a) => typeof v === 'string' && v && a.indexOf(v) === i).join(', '), latitude: r.latitude, longitude: r.longitude, elevation: elevationKnown ? r.elevation as number : 0, elevationKnown, timeZone: r.timezone, utcOffset: 0, source: 'search' as const }];
  });
}

export async function searchPlaces(query: string, signal: AbortSignal): Promise<ObservingPlace[]> {
  const name = query.trim();
  if (name.length < 2 || name.length > 160) throw new RangeError('Enter a city name with 2–160 characters.');
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.search = new URLSearchParams({ name, count: '6', language: 'en', format: 'json' }).toString();
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Location search unavailable (${response.status}). Use coordinates or a saved place.`);
  return parseGeocoding(await response.json());
}

export interface CurrentConditions { time: Date; retrievedAt: Date; cloudCover: number; temperature: number | null; humidity: number | null; timeZone: string }

export function parseConditions(value: unknown, retrievedAt = new Date()): CurrentConditions {
  if (!value || typeof value !== 'object') throw new Error('Weather response unavailable');
  const data = value as { current?: Record<string, unknown>; timezone?: string };
  const current = data.current;
  if (!current || typeof current.time !== 'number' || !Number.isFinite(current.time) || typeof current.cloud_cover !== 'number' || !Number.isFinite(current.cloud_cover) || current.cloud_cover < 0 || current.cloud_cover > 100) throw new Error('Current cloud data unavailable');
  return { time: new Date(current.time * 1000), retrievedAt, cloudCover: current.cloud_cover, temperature: typeof current.temperature_2m === 'number' && Number.isFinite(current.temperature_2m) ? current.temperature_2m : null, humidity: typeof current.relative_humidity_2m === 'number' && Number.isFinite(current.relative_humidity_2m) ? current.relative_humidity_2m : null, timeZone: data.timezone && validTimeZone(data.timezone) ? data.timezone : 'UTC' };
}

export async function fetchConditions(place: ObservingPlace, signal: AbortSignal): Promise<CurrentConditions> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({ latitude: String(place.latitude), longitude: String(place.longitude), current: 'cloud_cover,temperature_2m,relative_humidity_2m', timezone: 'auto', timeformat: 'unixtime', forecast_days: '1' }).toString();
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Current conditions unavailable (${response.status}); astronomy still works.`);
  return parseConditions(await response.json());
}
