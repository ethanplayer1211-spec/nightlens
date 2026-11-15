import {describe,it,expect} from 'vitest';
import {skyMoments,momentCamera} from '../src/lib/skyMoments';
import {VIEWPOINTS,viewpointPlace} from '../src/lib/viewpoints';
import {calculateSky} from '../src/lib/astronomy';
import {zonedClock} from '../src/lib/observingTime';
describe('curated observing moments',()=>{
  const from=new Date('2026-11-15T12:00Z');
  it('separates the calculated lunar phase from a local evening preview',()=>{
    const place=viewpointPlace(VIEWPOINTS[0]),moments=skyMoments(place,from);
    const quarter=moments.find(m=>m.id==='phase-1')!;
    expect(quarter.eventTime!.toISOString().slice(0,16)).toBe('2026-11-17T11:48');
    expect(zonedClock(quarter.instant,place.timeZone).time).toBe('21:00');
    expect(quarter.instant.getTime()).not.toBe(quarter.eventTime!.getTime());
    expect(moments).toHaveLength(5);
    expect(skyMoments(place,new Date('2027-01-01Z')).find(m=>m.id==='pair-2026')!.archived).toBe(true);
  });
  it('places the paired planets above each featured horizon at its local preview',()=>{
    for(const site of VIEWPOINTS){const place=viewpointPlace(site),pair=skyMoments(place,from).find(m=>m.target==='pair')!,sky=calculateSky([],place,pair.instant),camera=momentCamera(pair,place)!;
      expect(sky.objects.some(o=>o.id==='Mars')).toBe(true);expect(sky.objects.some(o=>o.id==='Jupiter')).toBe(true);
      expect(camera.altitude).toBeGreaterThan(0);expect(zonedClock(pair.instant,place.timeZone).time).toBe('05:00');
    }
  });
  it('chooses a dark local Geminid planning hour with the approximate radiant up',()=>{
    for(const site of VIEWPOINTS){const place=viewpointPlace(site),moment=skyMoments(place,from).find(m=>m.target==='radiant')!,camera=momentCamera(moment,place)!;
      expect(calculateSky([],place,moment.instant).sunAltitude).toBeLessThan(-18);expect(camera.altitude).toBeGreaterThan(15);
      expect(Math.abs(moment.instant.getTime()-Date.parse('2026-12-14T14:00Z'))).toBeLessThan(24*3600000);
    }
  });
});
