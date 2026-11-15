import type { ObservingPlace } from './locations';
import type { SkyCamera } from './skyView';

export interface GroundPoint { east: number; north: number }
export interface Building { id:number;ring:GroundPoint[];height:number;heightSource:'tagged'|'levels'|'assumed';distance:number;style:number }
export interface LocalHorizon { buildings:Building[];sourceUrl:string;retrievedAt:string;radius:number;sourceCount:number;omittedContaining:number;inferredHeights:number;attribution:string }
const radians = Math.PI/180;
export function containsOrigin(ring: GroundPoint[]): boolean {
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j];
    if((a.north>0)!==(b.north>0) && 0<(b.east-a.east)*(-a.north)/(b.north-a.north)+a.east) inside=!inside;
  }
  return inside;
}
export function buildingHeight(tags: Record<string,string>): {height:number;source:Building['heightSource']} {
  const raw=tags.height?.trim();
  if(raw && /^\d+(\.\d+)?\s*(m|ft|'|metres|meters)?$/i.test(raw)){
    const height=parseFloat(raw)*(/ft|'/i.test(raw)?0.3048:1);
    if(height>1&&height<1000)return {height,source:'tagged'};
  }
  const levels=Number(tags['building:levels']);
  if(Number.isFinite(levels)&&levels>0&&levels<150)return{height:levels*3.1+1.2,source:'levels'};
  return {height:['apartments','hotel','commercial','office'].includes(tags.building)?18:['industrial','warehouse','school'].includes(tags.building)?10:8,source:'assumed'};
}
export function parseLocalHorizon(value: unknown,place: Pick<ObservingPlace,'latitude'|'longitude'>):LocalHorizon {
  if(!value||typeof value!=='object'||!Array.isArray((value as {elements?:unknown}).elements))throw new Error('Building map response is unavailable');
  const data=value as {elements:unknown[];source?:{sourceUrl?:string;retrievedAt?:string};radiusMeters?:number};
  let omittedContaining=0,inferredHeights=0;
  const all=data.elements.flatMap(item=>{
    const element=item as {type?:string;id?:number;tags?:Record<string,string>;geometry?:{lat:number;lon:number}[]};
    if(element.type!=='way'||!Number.isFinite(element.id)||!Array.isArray(element.geometry)||element.geometry.length<4||!element.tags?.building)return[];
    if(element.geometry.some(p=>!Number.isFinite(p.lat)||!Number.isFinite(p.lon)))return[];
    const ring=element.geometry.map(p=>({east:(p.lon-place.longitude)*111320*Math.cos(place.latitude*radians),north:(p.lat-place.latitude)*111320}));
    if(containsOrigin(ring)){omittedContaining++;return[];}
    const distance=Math.min(...ring.map(p=>Math.hypot(p.east,p.north)));
    if(distance<3||distance>1000)return[];
    const height=buildingHeight(element.tags);
    if(height.source!=='tagged')inferredHeights++;
    return [{id:element.id!,ring,height:height.height,heightSource:height.source,distance,style:element.id!%7}];
  });
  // Bound interactive face/window cost; map radius and incomplete coverage stay visible.
  const buildings=all.sort((a,b)=>a.distance-b.distance).slice(0,180);
  return{buildings,sourceUrl:data.source?.sourceUrl??'https://overpass-api.de/',retrievedAt:data.source?.retrievedAt??new Date().toISOString(),radius:data.radiusMeters??450,sourceCount:all.length,omittedContaining,inferredHeights,attribution:'© OpenStreetMap contributors · ODbL'};
}
export async function fetchLocalHorizon(place: ObservingPlace,signal:AbortSignal):Promise<LocalHorizon>{
  const query=`[out:json][timeout:18];way["building"](around:450,${place.latitude.toFixed(5)},${place.longitude.toFixed(5)});out tags geom;`;
  const response=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:new URLSearchParams({data:query}),signal});
  if(!response.ok)throw new Error(`Building map unavailable (${response.status})`);
  return parseLocalHorizon(await response.json(),place);
}

export interface WorldPoint extends GroundPoint { up:number }
/** Camera-space near-plane clipping preserves facades crossing the view's edge. */
export function projectFace(points:WorldPoint[],camera:SkyCamera,width:number,height:number):{x:number;y:number}[]{
  const az=camera.azimuth*radians,alt=camera.altitude*radians;
  const f=[Math.cos(alt)*Math.sin(az),Math.sin(alt),Math.cos(alt)*Math.cos(az)],r=[Math.cos(az),0,-Math.sin(az)],u=[-Math.sin(alt)*Math.sin(az),Math.cos(alt),-Math.sin(alt)*Math.cos(az)];
  const coords=points.map(p=>{const v=[p.east,p.up,p.north];return{x:v.reduce((s,v,i)=>s+v*r[i],0),y:v.reduce((s,v,i)=>s+v*u[i],0),z:v.reduce((s,v,i)=>s+v*f[i],0)};});
  const clipped:typeof coords=[];
  for(let i=0;i<coords.length;i++){
    const a=coords[i],b=coords[(i+1)%coords.length],aIn=a.z>.5,bIn=b.z>.5;
    if(aIn)clipped.push(a);
    if(aIn!==bIn){const t=(.5-a.z)/(b.z-a.z);clipped.push({x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y),z:.5});}
  }
  const tangent=Math.tan(camera.fieldOfView*radians/2);
  return clipped.map(p=>({x:width/2*(1+p.x/(p.z*tangent)),y:height/2-width/2*p.y/(p.z*tangent)}));
}

/** Explicitly illustrative fallback/rooftop skyline, fixed to compass bearings. */
export function illustrativeBuildings():Building[]{
  return Array.from({length:64},(_,i)=>{
    const az=i*2*Math.PI/64,distance=170+(i*37%140),side=14+(i*13%24),height=12+(i*47%90);
    const east=Math.sin(az)*distance,north=Math.cos(az)*distance;
    return{id:-i-1,ring:[{east:east-side,north:north-side},{east:east+side,north:north-side},{east:east+side,north:north+side},{east:east-side,north:north+side}],height,heightSource:'assumed',distance,style:i%7};
  });
}
