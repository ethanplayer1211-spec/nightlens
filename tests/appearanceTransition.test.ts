import {describe,it,expect} from 'vitest';
import {appearanceValues,sampleAppearance,visualProps} from '../src/lib/appearanceTransition';
import {DEFAULT_FILTERS} from '../src/lib/skyAppearance';
import {calculateSky,LOCATIONS} from '../src/lib/astronomy';
import type {ImmersiveSkyProps} from '../src/lib/skyView';

const input={sky:calculateSky([],LOCATIONS[0],new Date('2026-11-15T13:00:00Z')),camera:{azimuth:55,altitude:8,fieldOfView:78},worldToGalactic:[1,0,0,0,1,0,0,0,1],filters:{...DEFAULT_FILTERS},lightPollution:85,compareLightPollution:85,cityLightPercent:85,cloudCover:0,fixtureGlare:1,fixtureOutput:1,warmth:0} as ImmersiveSkyProps;
describe('bounded presentation transitions',()=>{
  it('converges exactly, respects reduced motion and handles reversal without a jump',()=>{
    const from=appearanceValues(input),to={...from,light:0,warmth:1,cloud:100,fog:100};
    const first={from,to,start:100,duration:360};
    expect(sampleAppearance(first,0)).toEqual({values:from,active:true});
    expect(sampleAppearance(first,280).values.light).toBe(42.5);
    expect(sampleAppearance(first,280).values.fog).toBe(50);
    expect(sampleAppearance(first,460)).toEqual({values:to,active:false});
    expect(sampleAppearance({...first,duration:0},100)).toEqual({values:to,active:false});
    const midway=sampleAppearance(first,240).values,reversed={from:midway,to:from,start:240,duration:360};
    expect(sampleAppearance(reversed,240).values).toEqual(midway);
    expect(sampleAppearance(reversed,600).values).toEqual(from);
  });
  it('preserves the exact sky, camera, comparison and discrete selected conditions',()=>{
    const p=visualProps(input,{...appearanceValues(input),light:12,haze:4});
    expect(p.sky).toBe(input.sky);expect(p.camera).toBe(input.camera);expect(p.worldToGalactic).toBe(input.worldToGalactic);
    expect(p.comparison).toBe(input.comparison);expect(p.filters.horizon).toBe(input.filters.horizon);
    expect(p.lightPollution).toBe(12);expect(p.filters.hazePercent).toBe(4);
    expect(input.lightPollution).toBe(85);expect(input.filters.hazePercent).toBe(DEFAULT_FILTERS.hazePercent);
  });
});
