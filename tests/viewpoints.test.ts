import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {VIEWPOINTS,curatedForPlace,viewpointPlace} from '../src/lib/viewpoints';
import {buildCityScene,validateTerrain,terrainElevation,localPoint,sceneGround,geographicPoint,sceneBlocks,sceneDescription,type ViewpointMap} from '../src/lib/cityScene';
import {buildSceneMesh} from '../src/lib/sceneMesh';
import {coordinatePlace,OBSERVING_PLACES} from '../src/lib/locations';

const read=(path:string)=>JSON.parse(fs.readFileSync(path,'utf8'));
describe('named city viewpoint assets',()=>{
  it('loads every cached scene with sourced terrain and a separate eye/deck height',()=>{
    expect(new Set(VIEWPOINTS.map(s=>s.id)).size).toBe(7);
    for(const site of VIEWPOINTS){
      const assetId=site.assetId??site.id;
      const terrain=validateTerrain(read(`public/data/terrain-${assetId}.json`),assetId);
      const far=validateTerrain(read(`public/data/terrain-far-${assetId}.json`),assetId);
      const scene=buildCityScene(site,read(`public/data/viewpoint-${assetId}.json`) as ViewpointMap,terrain,far);
      expect(scene.eyeElevation).toBeCloseTo(scene.groundElevation+site.deckHeight+site.eyeHeight,9);
      expect(scene.terrain?.source.dataset).toContain('SRTM');
      expect(Number.isFinite(scene.eyeElevation)).toBe(true);
      expect(far.size).toBe(21);expect(far.spacingMeters).toBe(2000);
    }
  });
  it('uses distant sourced terrain outside the near grid and labels missing map context',()=>{
    const site=VIEWPOINTS[0],far=validateTerrain(read('public/data/terrain-far-kl-sky-deck.json'),site.id);
    const near=validateTerrain(read('public/data/terrain-kl-sky-deck.json'),site.id),scene=buildCityScene(site,null,near,far);
    const p=geographicPoint(10000,4000,site),expected=terrainElevation(far,p.latitude,p.longitude,-999)-116000000/12742000;
    expect(sceneGround(scene,10000,4000)).toBeCloseTo(expected,6);
    expect(sceneDescription(scene)).toContain('map unavailable');
    expect(sceneDescription(scene)).toContain('±20 km');
    expect(Math.min(...far.heights.flat() as number[])).toBeLessThan(0); // Retain source artefacts, not inferred bathymetry.
  });
  it('occludes a low ray with a mapped building while leaving a high ray clear',()=>{
    const site={...VIEWPOINTS[0],deckHeight:0,groundElevation:0};
    const coords=[[-20,100],[20,100],[20,120],[-20,120],[-20,100]].map(([east,north])=>{const p=geographicPoint(east,north,site);return{lat:p.latitude,lon:p.longitude};});
    const scene=buildCityScene(site,{id:site.id,source:{},elements:[{type:'way',id:1,tags:{building:'yes',height:'20'},geometry:coords}]},null);
    expect(sceneBlocks(scene,3,0)).toBe(true);expect(sceneBlocks(scene,45,0)).toBe(false);
  });
  it('keeps the Namsan eye above the rendered terrain at the final mapped camera coordinate',()=>{
    const site=VIEWPOINTS[2],assetId=site.assetId??site.id,scene=buildCityScene(site,null,validateTerrain(read(`public/data/terrain-${assetId}.json`),assetId),validateTerrain(read(`public/data/terrain-far-${assetId}.json`),assetId));
    const mesh=buildSceneMesh(scene),v=mesh.opaque,heights:number[]=[];
    for(let i=0;i<v.length;i+=36){
      if(v[i+11]!==6)continue;
      const x=v[i],z=v[i+2],x2=v[i+12],z2=v[i+14],x3=v[i+24],z3=v[i+26],den=(z2-z3)*(x-x3)+(x3-x2)*(z-z3);
      if(Math.abs(den)<1e-8)continue;
      const a=((z2-z3)*(-x3)+(x3-x2)*(-z3))/den,b=((z3-z)*(-x3)+(x-x3)*(-z3))/den,c=1-a-b;
      if(Math.min(a,b,c)>=-1e-6)heights.push(a*v[i+1]+b*v[i+13]+c*v[i+25]);
    }
    expect(heights.length).toBeGreaterThan(0);
    expect(Math.max(...heights)).toBeCloseTo(scene.groundElevation,3);
    expect(Math.max(...heights)).toBeLessThan(scene.eyeElevation-1.6);
  });
  it('anchors a featured city while preserving exact-coordinate and device selections',()=>{
    expect(curatedForPlace(OBSERVING_PLACES[2])?.id).toBe('kl-sky-deck');
    expect(curatedForPlace(coordinatePlace(3.14,101.69))).toBeUndefined();
    expect(curatedForPlace(coordinatePlace(3.14,101.69,'UTC','device'))).toBeUndefined();
    const p=viewpointPlace(VIEWPOINTS[0]);expect(p.viewpointId).toBe('kl-sky-deck');expect(p.elevation).toBeCloseTo(388.7);
  });
  it('bilinearly interpolates south-to-north terrain and rejects invalid grids',()=>{
    const grid=validateTerrain({...read('public/data/terrain-kl-sky-deck.json'),size:2,heights:[[0,10],[20,30]],spacingMeters:100},'kl-sky-deck');
    expect(terrainElevation(grid,grid.center.latitude,grid.center.longitude,-1)).toBeCloseTo(15);
    expect(terrainElevation(grid,0,0,-1)).toBe(-1);
    expect(()=>validateTerrain({...grid,heights:[[NaN,1],[1,2]]},'kl-sky-deck')).toThrow();
    expect(localPoint(grid.center.latitude,grid.center.longitude,grid.center)).toEqual({east:0,north:0});
  });
  it('retains Petronas mapped tiers and builds finite, bounded real 3D geometry',()=>{
    const site=VIEWPOINTS[0],scene=buildCityScene(site,read('public/data/viewpoint-kl-sky-deck.json'),validateTerrain(read('public/data/terrain-kl-sky-deck.json'),site.id));
    expect(scene.buildings.some(b=>b.id===137331252&&b.part&&b.source==='tagged'&&b.top===240)).toBe(true);
    expect(scene.buildings.some(b=>b.id===137396373&&b.part&&b.top===452)).toBe(true);
    expect(scene.buildings.some(b=>b.id===279944536)).toBe(false);
    const mesh=buildSceneMesh(scene);
    expect(mesh.opaque.length%36).toBe(0);expect(mesh.glass.length%36).toBe(0);
    expect(mesh.triangles).toBeGreaterThan(5000);expect(mesh.triangles).toBeLessThan(500000);
    expect(mesh.opaque.every(Number.isFinite)).toBe(true);expect(mesh.glass.every(Number.isFinite)).toBe(true);
  });
});
