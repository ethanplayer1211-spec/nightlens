import {describe,it,expect} from 'vitest';
import {quickLightingLook} from '../src/lib/quickLook';
import {deriveNightLighting,DEFAULT_NIGHT_LIGHTING} from '../src/lib/skyAppearance';
describe('guided lighting looks',()=>{
  it('resets the original lighting and removes only the artificial source',()=>{
    const city=quickLightingLook('city'),natural=quickLightingLook('natural');
    expect(city).toEqual({glow:85,lighting:{...DEFAULT_NIGHT_LIGHTING}});
    expect(natural.glow).toBe(0);expect(natural.lighting).toEqual(DEFAULT_NIGHT_LIGHTING);
    expect(Object.keys(natural).sort()).toEqual(['glow','lighting']);
    city.lighting.dimmingPercent=1;expect(quickLightingLook('city').lighting.dimmingPercent).toBe(50);
  });
  it('activates the dimming preview at midnight and rejects unknown choices',()=>{
    const next=quickLightingLook('midnight');
    expect(deriveNightLighting(next.lighting,1435,next.glow).scheduleActive).toBe(false);
    expect(deriveNightLighting(next.lighting,5,next.glow).scheduleActive).toBe(true);
    expect(deriveNightLighting(next.lighting,360,next.glow).scheduleActive).toBe(false);
    expect(()=>quickLightingLook('other' as 'city')).toThrow();
  });
});
