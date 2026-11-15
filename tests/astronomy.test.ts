import { Body, DefineStar, Equator, Horizon, Observer } from 'astronomy-engine';
import { describe, expect, it } from 'vitest';
import { calculateSky, localToUTC, LOCATIONS, project, type CatalogStar } from '../src/lib/astronomy';

describe('explicit observing time', () => {
  it('is independent of the browser and execution host timezone', () => {
    expect(localToUTC('2026-11-15', 1260, 8).toISOString()).toBe('2026-11-15T13:00:00.000Z');
    expect(localToUTC('2026-11-15', 1260, 9).toISOString()).toBe('2026-11-15T12:00:00.000Z');
    expect(localToUTC('2026-12-31', 1440, 8).toISOString()).toBe('2026-12-31T16:00:00.000Z');
    expect(localToUTC('2024-02-29', 1440, 8).toISOString()).toBe('2024-02-29T16:00:00.000Z');
  });
  it('rejects invalid dates, coordinates and times', () => {
    expect(() => localToUTC('2026-02-30', 1260, 8)).toThrow();
    expect(() => localToUTC('', 1260, 8)).toThrow();
    expect(() => localToUTC('2026-11-15', NaN, 8)).toThrow();
    expect(() => calculateSky([], { ...LOCATIONS[0], latitude: 91 }, new Date())).toThrow();
    expect(() => calculateSky([], LOCATIONS[0], new Date('invalid'))).toThrow();
  });
});

describe('astronomical projection and coordinate conversion', () => {
  it('maps zenith and cardinal horizons in the looking-up orientation', () => {
    expect(project(90, 0)).toEqual({ x: 420, y: 390 });
    expect(project(0, 0)).toEqual({ x: 420, y: 50 });
    expect(project(0, 90).x).toBeCloseTo(80);
    expect(project(0, 180).y).toBeCloseTo(730);
    expect(project(0, 270).x).toBeCloseTo(760);
  });
  it('matches the independent Equator/Horizon API for a catalog star', () => {
    const star: CatalogStar = { id: 1, hip: 91262, name: 'Vega', ra: 18.615649, dec: 38.783689, magnitude: 0.03, constellation: 'Lyr', colorIndex: 0 };
    const date = localToUTC('2026-11-15', 1200, 8);
    DefineStar(Body.Star1, star.ra, star.dec, 1000000);
    const observer = new Observer(LOCATIONS[0].latitude, LOCATIONS[0].longitude, LOCATIONS[0].elevation);
    const eq = Equator(Body.Star1, date, observer, true, false);
    const expected = Horizon(date, observer, eq.ra, eq.dec, '');
    const actual = calculateSky([star], LOCATIONS[0], date).objects.find(o => o.id === 's1');
    expect(actual).toBeDefined();
    expect(actual!.altitude).toBeCloseTo(expected.altitude, 3);
    expect(actual!.azimuth).toBeCloseTo(expected.azimuth, 3);
  });
  it('excludes objects below the geometric horizon and never lets lighting affect geometry', () => {
    const catalog: CatalogStar[] = Array.from({ length: 24 }, (_, ra) => ({ id: ra + 1, hip: null, name: '', ra, dec: 0, magnitude: 2, constellation: '', colorIndex: null }));
    const date = localToUTC('2026-11-15', 1260, 8);
    const a = calculateSky(catalog, LOCATIONS[0], date);
    expect(a.objects.every(o => o.altitude >= 0)).toBe(true);
    expect(a.objects.filter(o => o.kind === 'star').length).toBeLessThan(24);
    expect(a).toEqual(calculateSky(catalog, LOCATIONS[0], date));
    expect(calculateSky(catalog, LOCATIONS[1], date).objects).not.toEqual(a.objects);
  });
});
