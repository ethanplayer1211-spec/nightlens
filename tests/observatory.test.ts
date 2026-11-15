import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RotateVector, Rotation_EQJ_GAL, Spherical, VectorFromSphere } from 'astronomy-engine';
import { calculateSky, LOCATIONS, worldToGalactic } from '../src/lib/astronomy';
import { coordinatePlace, parseConditions, parseGeocoding } from '../src/lib/locations';
import { resolveLocalDateTime, shiftInstant, startOfLocalDay, zonedClock } from '../src/lib/observingTime';
import { DEFAULT_CAMERA, galacticView, normalizeCamera, projectPerspective } from '../src/lib/skyView';

describe('global observing instants', () => {
  it('uses the selected location timezone, including fractional offsets and midnight rollover', () => {
    const instant = new Date('2026-11-15T18:30:00Z');
    expect(zonedClock(instant,'Asia/Kuala_Lumpur')).toMatchObject({date:'2026-11-16',time:'02:30',offsetMinutes:480});
    expect(zonedClock(instant,'Asia/Kathmandu')).toMatchObject({date:'2026-11-16',time:'00:15',offsetMinutes:345});
    expect(zonedClock(instant,'America/New_York')).toMatchObject({date:'2026-11-15',time:'13:30',offsetMinutes:-300});
  });
  it('uses historical DST for the preview instant instead of a city’s current offset', () => {
    expect(resolveLocalDateTime('2026-07-01T21:00','America/New_York').date.toISOString()).toBe('2026-07-02T01:00:00.000Z');
    expect(resolveLocalDateTime('2026-12-01T21:00','America/New_York').date.toISOString()).toBe('2026-12-02T02:00:00.000Z');
    expect(resolveLocalDateTime('2026-11-15T21:00','Australia/Sydney').date.toISOString()).toBe('2026-11-15T10:00:00.000Z');
  });
  it('rejects impossible calendar dates and missing DST hours', () => {
    expect(()=>resolveLocalDateTime('2026-02-30T21:00','UTC')).toThrow();
    expect(()=>resolveLocalDateTime('2026-03-08T02:30','America/New_York')).toThrow('does not exist');
    expect(()=>resolveLocalDateTime('2026-11-15T21:00','Not/A_Timezone')).toThrow();
  });
  it('identifies an ambiguous autumn hour and explicitly chooses its first occurrence', () => {
    const result=resolveLocalDateTime('2026-11-01T01:30','America/New_York');
    expect(result.ambiguous).toBe(true);expect(result.date.toISOString()).toBe('2026-11-01T05:30:00.000Z');
  });
  it('steps an absolute hour through midnight and handles skipped local midnight', () => {
    expect(shiftInstant(new Date('2026-12-31T23:30:00Z'),60).toISOString()).toBe('2027-01-01T00:30:00.000Z');
    const start=startOfLocalDay('2026-09-06','America/Santiago');
    expect(zonedClock(start,'America/Santiago').date).toBe('2026-09-06');
  });
});

describe('location and current weather data contracts', () => {
  it('accepts zero coordinates and rejects out-of-range or nonfinite coordinates', () => {
    expect(coordinatePlace(0,0)).toMatchObject({latitude:0,longitude:0,timeZone:'UTC',elevation:0,elevationKnown:false});
    expect(()=>coordinatePlace(91,0)).toThrow();expect(()=>coordinatePlace(0,-181)).toThrow();expect(()=>coordinatePlace(NaN,0)).toThrow();
  });
  it('retains a real geocoder’s geographic metadata and rejects malformed results', () => {
    const results=parseGeocoding({results:[{id:1880252,name:'Singapore',country:'Singapore',latitude:1.28967,longitude:103.85007,elevation:23,timezone:'Asia/Singapore'},{name:'broken',latitude:999,longitude:0,timezone:'UTC'}]});
    expect(results).toHaveLength(1);expect(results[0]).toMatchObject({name:'Singapore',latitude:1.28967,elevation:23,elevationKnown:true,timeZone:'Asia/Singapore',source:'search'});
    expect(parseGeocoding({})).toEqual([]);expect(()=>parseGeocoding(null)).toThrow();
  });
  it('does not treat missing or invalid cloud cover as a clear-sky observation', () => {
    expect(()=>parseConditions({current:{time:1794713400}})).toThrow();expect(()=>parseConditions({current:{time:1794713400,cloud_cover:-999}})).toThrow();
    const value=parseConditions({timezone:'Asia/Kuala_Lumpur',current:{time:1794713400,cloud_cover:98,temperature_2m:28.1,relative_humidity_2m:85}});
    expect(value.cloudCover).toBe(98);expect(value.time.getTime()).toBe(1794713400000);expect(value.temperature).toBe(28.1);
  });
});

describe('immersive coordinate mapping', () => {
  it('places the aimed direction at the frame center and east to the right when facing north', () => {
    expect(projectPerspective(27,180,DEFAULT_CAMERA,1000,600)).toMatchObject({x:500,y:300,visible:true});
    const camera={azimuth:0,altitude:0,fieldOfView:90};
    expect(projectPerspective(0,45,camera,1000,600)!.x).toBeCloseTo(1000);
    expect(projectPerspective(0,315,camera,1000,600)!.x).toBeCloseTo(0);
    expect(projectPerspective(0,180,camera,1000,600)).toBeNull();
  });
  it('maps horizon directions to Galactic coordinates consistently with the independent EQJ rotation', () => {
    const date=new Date('2026-11-15T13:00:00Z'), location=LOCATIONS[0];
    const catalog={id:1,hip:null,name:'reference',ra:18.615649,dec:38.783689,magnitude:0,constellation:'',colorIndex:0};
    const object=calculateSky([catalog],location,date).objects.find(o=>o.id==='s1')!;
    const r=Math.PI/180,alt=object.altitude*r,az=object.azimuth*r;
    const world=[Math.cos(alt)*Math.sin(az),Math.sin(alt),Math.cos(alt)*Math.cos(az)];
    const m=worldToGalactic(location,date);
    const actual=[0,1,2].map(row=>world.reduce((sum,v,column)=>sum+m[row*3+column]*v,0));
    const expected=RotateVector(Rotation_EQJ_GAL(),VectorFromSphere(new Spherical(catalog.dec,catalog.ra*15,1),date));
    expect(actual[0]).toBeCloseTo(expected.x,9);expect(actual[1]).toBeCloseTo(expected.y,9);expect(actual[2]).toBeCloseTo(expected.z,9);
    for(let row=0;row<3;row++)expect(Math.hypot(...m.slice(row*3,row*3+3))).toBeCloseTo(1,10);
    expect(galacticView(m).altitude).toBeGreaterThan(0);
  });
  it('normalizes camera wrap and constrains safe pitch/FOV limits', () => {
    expect(normalizeCamera({azimuth:-10,altitude:100,fieldOfView:200})).toEqual({azimuth:350,altitude:85,fieldOfView:125});
    expect(()=>normalizeCamera({azimuth:NaN,altitude:30,fieldOfView:90})).toThrow();
  });
});

describe('independent NASA JPL benchmark', () => {
  it('matches the cached Horizons airless topocentric Moon azimuth/altitude within 0.05 degrees', () => {
    const benchmark=JSON.parse(fs.readFileSync('data/validation/horizons-moon-20261115.json','utf8'));
    const row=benchmark.response.result.split('$$SOE')[1].trim().split('\n')[0].split(',').map((v:string)=>v.trim());
    const moon=calculateSky([],LOCATIONS[0],new Date('2026-11-15T13:00:00Z')).objects.find(o=>o.kind==='moon')!;
    expect(Math.abs(moon.azimuth-Number(row[3]))).toBeLessThan(0.05);
    expect(Math.abs(moon.altitude-Number(row[4]))).toBeLessThan(0.05);
  });
});
