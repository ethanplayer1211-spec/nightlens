import {describe,it,expect} from 'vitest';
import {Libration} from 'astronomy-engine';
import {calculateSky,LOCATIONS} from '../src/lib/astronomy';
import {buildCityScene,mergeCityContext,validateTerrain} from '../src/lib/cityScene';
import {VIEWPOINTS} from '../src/lib/viewpoints';
import fs from 'node:fs';
import {decodeLandmarkGLB} from '../src/lib/landmarkModel';
import {buildSceneMesh} from '../src/lib/sceneMesh';
const read=(path:string)=>JSON.parse(fs.readFileSync(path,'utf8'));

describe('finite astronomical disks and lunar attitude',()=>{
  it('uses topocentric angular size and an orthonormal IAU body frame',()=>{
    for(const date of ['2026-11-15T13:00:00Z','2026-12-01T13:00:00Z']){
      const sky=calculateSky([],LOCATIONS[0],new Date(date)),m=sky.worldToMoon;
      expect(sky.moonAngularRadius).toBeGreaterThan(.23);expect(sky.moonAngularRadius).toBeLessThan(.29);
      expect(sky.sunAngularRadius).toBeGreaterThan(.26);expect(sky.sunAngularRadius).toBeLessThan(.28);
      for(let i=0;i<3;i++)for(let j=0;j<3;j++)expect([0,1,2].reduce((sum,k)=>sum+m[i*3+k]*m[j*3+k],0)).toBeCloseTo(i===j?1:0,9);
    }
  });
  it('places the near-side texture near the independently calculated sub-Earth libration',()=>{
    const date=new Date('2026-11-15T13:00:00Z'),sky=calculateSky([],LOCATIONS[0],date),moon=sky.objects.find(o=>o.kind==='moon')!,r=Math.PI/180;
    const near=[-Math.cos(moon.altitude*r)*Math.sin(moon.azimuth*r),-Math.sin(moon.altitude*r),-Math.cos(moon.altitude*r)*Math.cos(moon.azimuth*r)];
    const p=[0,1,2].map(i=>near.reduce((sum,v,k)=>sum+v*sky.worldToMoon[i*3+k],0));
    const longitude=Math.atan2(p[1],p[0])/r,latitude=Math.asin(p[2])/r,reference=Libration(date);
    // Libration() is geocentric; a surface observer introduces up to roughly 1 degree parallax.
    expect(Math.abs(longitude-reference.elon)).toBeLessThan(2);
    expect(Math.abs(latitude-reference.elat)).toBeLessThan(2);
  });
});
describe('real city context integration',()=>{
  it('preserves detailed near geometry on duplicate IDs and adds distant sourced buildings',()=>{
    const original=read('public/data/viewpoint-kl-sky-deck.json'),context=read('public/data/context-kl-sky-deck.json');
    const map=mergeCityContext(original,context)!;
    expect(map.elements.length).toBeGreaterThan(original.elements.length+7000);
    const near=original.elements.find((e:{id:number})=>e.id===137331252);
    expect(map.elements.find(e=>e.id===137331252&&e.type==='way')).toEqual(near);
    const scene=buildCityScene(VIEWPOINTS[0],map,validateTerrain(read('public/data/terrain-kl-sky-deck.json'),'kl-sky-deck'));
    expect(scene.buildings.length).toBeGreaterThan(2000);expect(scene.buildings.length).toBeLessThanOrEqual(4500);
    expect(scene.buildings.some(b=>b.id===279944536)).toBe(false);
  });
  it('decodes the pinned attributed GLB and registers finite tower geometry at the mapped height',()=>{
    const bytes=fs.readFileSync('public/data/realism/models/petronas-nanoray.glb');
    const input=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),model=decodeLandmarkGLB(input);
    expect(model.height).toBeCloseTo(180.5,3);expect(model.primitives.length).toBe(5);expect(model.triangles).toBe(47772);
    const scene=buildCityScene(VIEWPOINTS[0],read('public/data/viewpoint-kl-sky-deck.json'),null,null,null,model),mesh=buildSceneMesh(scene);
    let min=Infinity,max=-Infinity,modelVertices=0;
    for(let i=0;i<mesh.opaque.length;i+=12)if(mesh.opaque[i+11]>=14&&mesh.opaque[i+11]<=16){min=Math.min(min,mesh.opaque[i+1]);max=Math.max(max,mesh.opaque[i+1]);modelVertices++;}
    expect(modelVertices).toBeGreaterThan(100000);expect(max-min).toBeCloseTo(452,1);
    expect(mesh.opaque.every(Number.isFinite)).toBe(true);
    expect(()=>decodeLandmarkGLB(input.slice(0,64))).toThrow();
  });
});
