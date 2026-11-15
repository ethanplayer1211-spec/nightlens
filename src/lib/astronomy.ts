import {
  Body, Equator, Horizon, HorizonFromVector, Illumination, Observer,
  RotateVector, Rotation_EQJ_HOR, Rotation_HOR_EQJ, Rotation_EQJ_GAL, CombineRotation, MakeTime, Vector, SearchRiseSet, SearchAltitude, Spherical, VectorFromSphere,
  RotationAxis,
} from 'astronomy-engine';

export interface Location { id: string; name: string; latitude: number; longitude: number; utcOffset: number; elevation: number }
export const LOCATIONS: Location[] = [
  { id: 'penang', name: 'Penang, Malaysia', latitude: 5.4141, longitude: 100.3354, utcOffset: 8, elevation: 10 },
  { id: 'seoul', name: 'Seoul, South Korea', latitude: 37.5665, longitude: 126.978, utcOffset: 9, elevation: 38 },
];
export interface CatalogStar { id: number; hip: number | null; name: string; ra: number; dec: number; magnitude: number; constellation: string; colorIndex: number | null }
export interface SkyObject { id: string; name: string; altitude: number; azimuth: number; magnitude: number; kind: 'star' | 'planet' | 'moon'; x: number; y: number; hip?: number | null; constellation?: string; colorIndex?: number | null }

export function localToUTC(day: string, minutes: number, utcOffset: number): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(minutes) || minutes < 0 || minutes > 1440 || !Number.isFinite(utcOffset) || Math.abs(utcOffset) > 14) throw new RangeError('Invalid local date/time');
  const base = new Date(`${day}T00:00:00.000Z`);
  if (!Number.isFinite(base.getTime()) || base.toISOString().slice(0, 10) !== day) throw new RangeError('Invalid calendar date');
  return new Date(base.getTime() + (minutes - utcOffset * 60) * 60000);
}

/** All-sky azimuthal equidistant projection: north up, east left, looking upward. */
export function project(altitude: number, azimuth: number) {
  const radius = (90 - altitude) / 90 * 340;
  const angle = azimuth * Math.PI / 180;
  return { x: 420 - radius * Math.sin(angle), y: 390 - radius * Math.cos(angle) };
}

export function calculateSky(catalog: CatalogStar[], location: Location, date: Date) {
  if (!Number.isFinite(date.getTime()) || !Number.isFinite(location.latitude) || Math.abs(location.latitude) > 90 || !Number.isFinite(location.longitude) || Math.abs(location.longitude) > 180 || !Number.isFinite(location.elevation)) throw new RangeError('Invalid observing coordinates/date');
  const observer = new Observer(location.latitude, location.longitude, location.elevation);
  const rotation = Rotation_EQJ_HOR(date, observer);
  const objects: SkyObject[] = [];
  for (const star of catalog) {
    const vector = VectorFromSphere(new Spherical(star.dec, star.ra * 15, 1), date);
    const horizontal = HorizonFromVector(RotateVector(rotation, vector), '');
    if (horizontal.lat < 0) continue;
    objects.push({ id: `s${star.id}`, name: star.name, magnitude: star.magnitude, kind: 'star', altitude: horizontal.lat, azimuth: horizontal.lon, hip: star.hip, constellation: star.constellation, colorIndex: star.colorIndex, ...project(horizontal.lat, horizontal.lon) });
  }
  const planetBodies = [Body.Mercury, Body.Venus, Body.Mars, Body.Jupiter, Body.Saturn, Body.Uranus, Body.Neptune];
  let moonAltitude = 0;
  let sunAltitude = 0;
  let sunAzimuth = 0;
  let moonAngularRadius = .25, sunAngularRadius = .2666;
  for (const body of [...planetBodies, Body.Moon, Body.Sun]) {
    const eq = Equator(body, date, observer, true, true);
    const horizontal = Horizon(date, observer, eq.ra, eq.dec, '');
    if (body === Body.Sun) { sunAltitude = horizontal.altitude; sunAzimuth = horizontal.azimuth; sunAngularRadius=Math.asin(695700/(eq.dist*149597870.7))*180/Math.PI;continue; }
    if (body === Body.Moon) {moonAltitude = horizontal.altitude;moonAngularRadius=Math.asin(1737.4/(eq.dist*149597870.7))*180/Math.PI;}
    if (horizontal.altitude < 0) continue;
    objects.push({ id: body, name: body, magnitude: Illumination(body, date).mag, kind: body === Body.Moon ? 'moon' : 'planet', altitude: horizontal.altitude, azimuth: horizontal.azimuth, ...project(horizontal.altitude, horizontal.azimuth) });
  }
  const moon = Illumination(Body.Moon, date);
  const axis=RotationAxis(Body.Moon,date),a=axis.ra*Math.PI/12,d=axis.dec*Math.PI/180,w=axis.spin*Math.PI/180;
  // IAU body-fixed prime-meridian axes in J2000, then into east/up/north.
  const lunarAxes=[[-Math.sin(a)*Math.cos(w)-Math.cos(a)*Math.sin(d)*Math.sin(w),Math.cos(a)*Math.cos(w)-Math.sin(a)*Math.sin(d)*Math.sin(w),Math.cos(d)*Math.sin(w)],
    [Math.sin(a)*Math.sin(w)-Math.cos(a)*Math.sin(d)*Math.cos(w),-Math.cos(a)*Math.sin(w)-Math.sin(a)*Math.sin(d)*Math.cos(w),Math.cos(d)*Math.cos(w)],
    [Math.cos(a)*Math.cos(d),Math.sin(a)*Math.cos(d),Math.sin(d)]];
  const worldToMoon=lunarAxes.flatMap(v=>{const h=RotateVector(rotation,new Vector(v[0],v[1],v[2],MakeTime(date)));return[-h.y,h.z,h.x];});
  return { objects, moonAltitude, moonIllumination: moon.phase_fraction, moonPhaseAngle: moon.phase_angle, moonAngularRadius,sunAngularRadius,worldToMoon,sunAltitude, sunAzimuth, date };
}

/** Columns generated from basis vectors avoid assuming the library's matrix storage order. */
export function worldToGalactic(location: Location, date: Date): number[] {
  const observer = new Observer(location.latitude, location.longitude, location.elevation);
  const rotation = CombineRotation(Rotation_HOR_EQJ(date, observer), Rotation_EQJ_GAL());
  // Library HOR is north / west / zenith; renderer world is east / up / north.
  const time = MakeTime(date);
  const east = RotateVector(rotation, new Vector(0, -1, 0, time));
  const up = RotateVector(rotation, new Vector(0, 0, 1, time));
  const north = RotateVector(rotation, new Vector(1, 0, 0, time));
  return [east.x, up.x, north.x, east.y, up.y, north.y, east.z, up.z, north.z];
}

export function eveningEvents(location: Location, startUTC: Date) {
  const observer = new Observer(location.latitude, location.longitude, location.elevation);
  return {
    sunset: SearchRiseSet(Body.Sun, observer, -1, startUTC, 1.1)?.date ?? null,
    astronomicalDusk: SearchAltitude(Body.Sun, observer, -1, startUTC, 1.1, -18)?.date ?? null,
  };
}

export type SkyCalculation = ReturnType<typeof calculateSky>;

// Familiar asterisms, drawn only when both catalog endpoints are above the horizon.
export const ASTERISMS: { name: string; hips: number[] }[] = [
  { name: 'Cassiopeia', hips: [8886, 6686, 4427, 3179, 746] },
  { name: 'Cygnus', hips: [102098, 100453, 95947] },
  { name: 'Cygnus', hips: [104732, 100453, 98110] },
  { name: 'Lyra', hips: [91262, 91971, 92420, 93194, 92791, 91971] },
  { name: 'Aquila', hips: [98036, 97649, 97278] },
  { name: 'Pegasus', hips: [113963, 113881, 1067, 677, 113963] },
  { name: 'Orion', hips: [27989, 26727, 26311, 25930, 25336] },
  { name: 'Orion', hips: [27989, 24436, 25930, 27366, 27989] },
  { name: 'Ursa Major', hips: [67301, 65378, 62956, 59774, 58001, 53910, 54061, 59774] },
  { name: 'Scorpius', hips: [78820, 78401, 78265, 80763, 81266, 82396, 82514, 82729, 84143, 86228, 87073, 86670, 85927] },
  { name: 'Andromeda', hips: [677, 3092, 5447, 9640] },
  { name: 'Crux', hips: [61084, 60718] },
  { name: 'Crux', hips: [62434, 59747] },
];

export function cardinal(azimuth: number): string {
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(azimuth / 45) % 8];
}
