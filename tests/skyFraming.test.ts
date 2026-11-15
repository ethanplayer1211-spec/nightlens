import {describe,it,expect} from 'vitest';
import {renderDensity,skyFirstCamera} from '../src/lib/skyView';
import {VIEWPOINTS} from '../src/lib/viewpoints';
import {MeshBuilder,buildClearPlatform} from '../src/lib/sceneMesh';
describe('sky-first framing and bounded ultra quality',()=>{
  it('tracks actual source vertices and keeps the virtual platform entirely below the eye',()=>{
    const mesh=new MeshBuilder();mesh.triangle([0,500,0],[1,700,0],[0,600,1],{color:[1,1,1]});
    mesh.triangle([0,NaN,0],[1,900,0],[0,999,1],{color:[1,1,1]});
    expect(mesh.finish(0,0).maxElevation).toBe(700);
    const eye=705,platform=buildClearPlatform(eye);expect(platform.maxElevation).toBeLessThan(eye);
    for(let i=1;i<platform.opaque.length;i+=12)expect(platform.opaque[i]).toBeLessThan(eye);
  });
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
