import {describe,it,expect} from 'vitest';
import {renderDensity,skyFirstCamera} from '../src/lib/skyView';
import {VIEWPOINTS} from '../src/lib/viewpoints';
describe('sky-first framing and bounded ultra quality',()=>{
  it('looks higher without changing azimuth or mutating a geographic station',()=>{
    for(const station of VIEWPOINTS){
      const original={...station.camera},framed=skyFirstCamera(station.camera);
      expect(framed.altitude).toBeGreaterThanOrEqual(28);expect(framed.azimuth).toBe(original.azimuth);
      expect(station.camera).toEqual(original);expect(framed.fieldOfView).toBeGreaterThanOrEqual(original.fieldOfView);
    }
  });
  it('supersamples low-density displays and caps large capture buffers',()=>{
    expect(renderDensity(1280,720,1,'ultra')).toBe(2);
    expect(renderDensity(1920,1080,2,'ultra')).toBe(2);
    for(const [w,h,dpr] of [[3840,2160,3],[12000,4000,2],[390,844,3]]){
      const scale=renderDensity(w,h,dpr,'ultra');
      expect(w*h*scale*scale).toBeLessThanOrEqual(8294400.01);
      expect(Math.max(w,h)*scale).toBeLessThanOrEqual(4096.01);
    }
    expect(renderDensity(1280,720,1,'balanced')).toBe(1);
  });
});
