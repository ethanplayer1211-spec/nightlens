import type { GroundPoint } from './horizon';
import { buildingHeight,containsOrigin } from './horizon';
import {decodeLandmarkGLB,type LandmarkModel} from './landmarkModel';
import type { NamedViewpoint } from './viewpoints';

export interface TerrainGrid {id:string;center:{latitude:number;longitude:number};size:number;spacingMeters:number;heights:(number|null)[][];source:{dataset:string;verticalDatum:string;nativeResolution:string;url:string;nasaSource?:string;limitations?:string[]};sampledAt:string}
export interface MapElement {id:number;type:'way'|'node';tags:Record<string,string>;geometry?:{lat:number;lon:number}[];lat?:number;lon?:number}
export interface ViewpointMap {id:string;elements:MapElement[];source:{sourceUrl?:string;url?:string;retrievedAt?:string;license?:string;boundingBox?:number[]};relations?:unknown[]}
export interface WaterGeometry {id:string;polygons:{outer:{lat:number;lon:number}[];holes:{lat:number;lon:number}[][]}[];source:Record<string,unknown>}
export interface CityBuilding {id:number;ring:GroundPoint[];top:number;bottom:number;base:number;source:'tagged'|'levels'|'assumed';tags:Record<string,string>;part:boolean;distance:number;accent:boolean}
export interface CityScene {landmarkModel?:LandmarkModel|null;id:string;site:NamedViewpoint;terrain:TerrainGrid|null;terrainFar:TerrainGrid|null;water:WaterGeometry|null;map:ViewpointMap|null;groundElevation:number;eyeElevation:number;buildings:CityBuilding[];mapStatus:string;taggedHeights:number;inferredHeights:number;omitted:number}
const DEG=Math.PI/180;
export function localPoint(latitude:number,longitude:number,origin:{latitude:number;longitude:number}):GroundPoint{return{east:(longitude-origin.longitude)*111320*Math.cos(origin.latitude*DEG),north:(latitude-origin.latitude)*111320};}
export function geographicPoint(east:number,north:number,origin:{latitude:number;longitude:number}){return{latitude:origin.latitude+north/111320,longitude:origin.longitude+east/(111320*Math.cos(origin.latitude*DEG))};}
export function terrainElevation(grid:TerrainGrid|null,latitude:number,longitude:number,fallback:number):number{
  if(!grid)return fallback;
  const p=localPoint(latitude,longitude,grid.center),half=(grid.size-1)/2;
  const x=p.east/grid.spacingMeters+half,y=p.north/grid.spacingMeters+half;
  if(x<0||y<0||x>grid.size-1||y>grid.size-1)return fallback;
  const x0=Math.min(grid.size-2,Math.floor(x)),y0=Math.min(grid.size-2,Math.floor(y)),fx=x-x0,fy=y-y0;
  const v=[grid.heights[y0]?.[x0],grid.heights[y0]?.[x0+1],grid.heights[y0+1]?.[x0],grid.heights[y0+1]?.[x0+1]];
  if(v.some(n=>typeof n!=='number'||!Number.isFinite(n)))return fallback;
  return(v[0]!*(1-fx)+v[1]!*fx)*(1-fy)+(v[2]!*(1-fx)+v[3]!*fx)*fy;
}
export function sceneGround(scene:CityScene,east:number,north:number):number{
  const p=geographicPoint(east,north,scene.site);
  // Terrain is historical radar surface context, not a current foundation survey.
  const fallback=['london-primrose','new-york-pier1','sydney-macquaries','penang-esplanade','penang-neighbourhood'].includes(scene.id)?0:scene.groundElevation;
  return terrainElevation(scene.terrain,p.latitude,p.longitude,terrainElevation(scene.terrainFar,p.latitude,p.longitude,fallback))-(east*east+north*north)/12742000;
}
const metric=(value?:string)=>value&&/^\d+(\.\d+)?\s*(m|ft|'|metres|meters)?$/i.test(value.trim())?parseFloat(value)*(/ft|'/i.test(value)?0.3048:1):undefined;
export function validateTerrain(value:unknown,id:string):TerrainGrid{
  const g=value as TerrainGrid;
  if(!g||g.id!==id||!Number.isInteger(g.size)||g.size<2||g.size>80||!Number.isFinite(g.spacingMeters)||g.spacingMeters<20||!g.center||!Number.isFinite(g.center.latitude)||!Number.isFinite(g.center.longitude)||!Array.isArray(g.heights)||g.heights.length!==g.size||g.heights.some(row=>!Array.isArray(row)||row.length!==g.size||row.some(v=>v!==null&&!Number.isFinite(v))))throw new Error('Terrain grid is invalid');
  return g;
}
export function buildCityScene(site:NamedViewpoint,map:ViewpointMap|null,terrain:TerrainGrid|null,terrainFar:TerrainGrid|null=null,water:WaterGeometry|null=null,landmarkModel:LandmarkModel|null=null):CityScene{
  if(map){if(!Array.isArray(map.elements))throw new Error('Mapped scene geometry is invalid');map={...map,elements:map.elements.map(e=>({...e,tags:e.tags??{}}))};}
  let groundElevation=terrainElevation(terrain,site.latitude,site.longitude,site.groundElevation);
  if(site.id==='london-primrose')groundElevation=site.groundElevation; // Published approximate summit height.
  const scene:CityScene={id:site.id,site,map,terrain,terrainFar,water,landmarkModel,groundElevation,eyeElevation:groundElevation+site.deckHeight+site.eyeHeight,buildings:[],mapStatus:map?'Cached mapped geometry':'Map unavailable; only sourced terrain and landmark approximations',taggedHeights:0,inferredHeights:0,omitted:0};
  const candidates=(map?.elements??[]).flatMap(e=>{
    if(e.type!=='way'||(!e.tags.building&&!e.tags['building:part'])||!e.geometry||e.geometry.length<4)return[];
    const ring=e.geometry.map(p=>localPoint(p.lat,p.lon,site));
    if(ring.some(p=>!Number.isFinite(p.east)||!Number.isFinite(p.north)))return[];
    const c={east:ring.reduce((s,p)=>s+p.east,0)/ring.length,north:ring.reduce((s,p)=>s+p.north,0)/ring.length};
    const distance=Math.hypot(c.east,c.north);
    if(distance>6000)return[];
    if(containsOrigin(ring)||site.id==='kl-sky-deck'&&distance<45){scene.omitted++;return[];}
    const height=buildingHeight({...e.tags,building:e.tags.building??e.tags['building:part']});
    const top=Math.min(1000,height.height),bottom=Math.min(top-.2,metric(e.tags.min_height)??Math.max(0,Number(e.tags['building:min_level']??0))*3.1);
    const accent=site.id==='kl-sky-deck'&&top>80&&[[3.1576104,101.7114256],[3.1582379,101.7121562]].some(([lat,lon])=>{const tower=localPoint(lat,lon,site);return Math.hypot(c.east-tower.east,c.north-tower.north)<38;});
    return[{id:e.id,ring,top,bottom,base:sceneGround(scene,c.east,c.north),source:height.source,tags:e.tags,part:!!e.tags['building:part'],distance,accent} satisfies CityBuilding];
  });
  const parts=candidates.filter(b=>b.part),partBuckets=new Map<string,CityBuilding[]>();
  for(const part of parts){const p=part.ring[0],key=`${Math.floor(p.east/200)},${Math.floor(p.north/200)}`;partBuckets.set(key,[...(partBuckets.get(key)??[]),part]);}
  scene.buildings=candidates.filter(b=>{
    if(b.part)return true;
    // Simple3D container outlines must not turn stepped mapped parts into a solid box.
    const east=b.ring.map(p=>p.east),north=b.ring.map(p=>p.north);
    for(let x=Math.floor(Math.min(...east)/200);x<=Math.floor(Math.max(...east)/200);x++)for(let y=Math.floor(Math.min(...north)/200);y<=Math.floor(Math.max(...north)/200);y++)for(const part of partBuckets.get(`${x},${y}`)??[]){
      const point=part.ring[0];if(containsOrigin(b.ring.map(v=>({east:v.east-point.east,north:v.north-point.north}))))return false;
    }
    return true;
  }).sort((a,b)=>Number(b.accent)-Number(a.accent)||Number(b.source==='tagged')-Number(a.source==='tagged')||a.distance-b.distance).slice(0,4500);
  scene.taggedHeights=scene.buildings.filter(b=>b.source==='tagged').length;
  scene.inferredHeights=scene.buildings.length-scene.taggedHeights;
  return scene;
}
export function sceneDescription(scene:CityScene):string{
  const map=scene.map?'Cached mapped city geometry':'City map unavailable; landmark approximations only';
  const terrain=scene.terrain&&scene.terrainFar?'NASA/USGS terrain to ±20 km':scene.terrain?'NASA/USGS terrain to ±4 km':scene.terrainFar?'Coarse NASA/USGS terrain only':'terrain unavailable; assumed ground';
  return `${map} · ${terrain}.${scene.site.cityId==='penang'?' Coastal water mask unavailable; shoreline appearance is incomplete.':''} Fine architectural detail is approximate.${scene.landmarkModel?' Petronas model: NanoRay · CC BY 4.0.':''}`;
}
export function mergeCityContext(map:ViewpointMap|null,context:ViewpointMap|null):ViewpointMap|null{
  if(!context)return map;if(!map)return context;
  const entries=new Map(context.elements.map(e=>[`${e.type}-${e.id}`,e]));
  for(const e of map.elements)entries.set(`${e.type}-${e.id}`,e);
  return {...map,elements:[...entries.values()]};
}
export async function loadCityScene(site:NamedViewpoint,signal:AbortSignal):Promise<CityScene>{
  const assetId=site.assetId??site.id;
  const modelData=document.getElementById('nightlens-landmark-model')?.textContent;
  const embeddedModel=()=>{if(!modelData||site.id!=='kl-sky-deck')return null;try{const bytes=Uint8Array.from(atob(JSON.parse(modelData).glb),c=>c.charCodeAt(0));return decodeLandmarkGLB(bytes.buffer);}catch{return null;}};
  const embedded=document.getElementById('nightlens-viewpoint-data')?.textContent;
  if(embedded){const bundle=JSON.parse(embedded) as Record<string,{map:ViewpointMap|null;terrain:unknown;terrainFar?:unknown;water?:WaterGeometry;context?:ViewpointMap;residential?:ViewpointMap}>;const entry=bundle[assetId];if(!entry)throw new Error('Named viewpoint is not embedded');return buildCityScene(site,mergeCityContext(mergeCityContext(entry.map,entry.context??null),entry.residential??null),entry.terrain?validateTerrain(entry.terrain,assetId):null,entry.terrainFar?validateTerrain(entry.terrainFar,assetId):null,entry.water??null,embeddedModel());}
  const read=async(path:string)=>{const r=await fetch(path,{signal});if(!r.ok)throw new Error(`Scene asset unavailable (${r.status})`);return r.json();};
  const [map,terrain,far,water,context,residential,landmark]=await Promise.allSettled([read(`/data/viewpoint-${assetId}.json`),read(`/data/terrain-${assetId}.json`),read(`/data/terrain-far-${assetId}.json`),['sydney-macquaries','new-york-pier1','penang-esplanade'].includes(assetId)?read(`/data/viewpoint-water-${assetId}.json`):Promise.resolve(null),read(`/data/context-${assetId}.json`),site.cityId==='penang'?read('/data/horizon-penang.json'):Promise.resolve(null),site.id==='kl-sky-deck'?fetch('/data/realism/models/petronas-nanoray.glb',{signal}).then(r=>{if(!r.ok)throw new Error('Landmark model unavailable');return r.arrayBuffer();}).then(decodeLandmarkGLB):Promise.resolve(null)]);
  if(signal.aborted)throw new DOMException('Scene load cancelled','AbortError');
  if(map.status==='rejected'&&terrain.status==='rejected')throw new Error('The cached viewpoint assets could not be loaded');
  return buildCityScene(site,mergeCityContext(mergeCityContext(map.status==='fulfilled'?map.value as ViewpointMap:null,context.status==='fulfilled'?context.value as ViewpointMap:null),residential.status==='fulfilled'?residential.value as ViewpointMap:null),terrain.status==='fulfilled'?validateTerrain(terrain.value,assetId):null,far.status==='fulfilled'?validateTerrain(far.value,assetId):null,water.status==='fulfilled'?water.value as WaterGeometry:null,landmark.status==='fulfilled'?landmark.value:null);
}

export function sceneBlocks(scene:CityScene,altitude:number,azimuth:number):boolean{
  const angle=azimuth*DEG,east=Math.sin(angle),north=Math.cos(angle),slope=Math.tan(altitude*DEG);
  for(let distance=100;distance<=20000;distance+=distance<4000?200:1000){if(sceneGround(scene,east*distance,north*distance)>scene.eyeElevation+slope*distance)return true;}
  for(const b of scene.buildings)for(let i=1;i<b.ring.length;i++){
    const a=b.ring[i-1],c=b.ring[i],dx=c.east-a.east,dz=c.north-a.north,den=east*dz-north*dx;
    if(Math.abs(den)<1e-8)continue;
    const distance=(a.east*dz-a.north*dx)/den,t=(a.east*north-a.north*east)/den;
    const up=scene.eyeElevation+slope*distance;
    if(distance>.5&&t>=0&&t<=1&&up<=b.base+b.top&&up>=b.base+b.bottom)return true;
  }
  return false;
}
