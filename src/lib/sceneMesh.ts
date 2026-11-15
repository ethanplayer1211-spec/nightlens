import earcut from 'earcut';
import { localPoint,sceneGround,type CityScene } from './cityScene';
import type { GroundPoint } from './horizon';

export type Vec3=[number,number,number];
export type Color=[number,number,number];
export interface Material {color:Color;emission?:number;kind?:number;alpha?:number}
export interface SceneMesh {opaque:Float32Array;glass:Float32Array;triangles:number;buildingCount:number;mappedPartCount:number}
const stone:Material={color:[.32,.35,.37]},metal:Material={color:[.43,.49,.54],kind:2},glass:Material={color:[.3,.48,.57],alpha:.13,kind:2};
const sub=(a:Vec3,b:Vec3):Vec3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=(v:Vec3):Vec3=>{const n=Math.hypot(...v)||1;return[v[0]/n,v[1]/n,v[2]/n];};
const scale=(v:Vec3,s:number):Vec3=>[v[0]*s,v[1]*s,v[2]*s];
const add=(a:Vec3,b:Vec3):Vec3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
export class MeshBuilder {
  opaque:number[]=[];glass:number[]=[];
  triangle(a:Vec3,b:Vec3,c:Vec3,m:Material,normal?:Vec3|[Vec3,Vec3,Vec3]){
    if([...a,...b,...c].some(v=>!Number.isFinite(v)))return;
    const normals=normal&&Array.isArray(normal[0])?normal as [Vec3,Vec3,Vec3]:null,n=normals?normals[0]:normal as Vec3|undefined??unit(cross(sub(b,a),sub(c,a))),out=(m.alpha??1)<1?this.glass:this.opaque;
    if(Math.hypot(...cross(sub(b,a),sub(c,a)))<1e-8)return;
    for(const [i,p] of [a,b,c].entries())out.push(...p,...(normals?.[i]??n),...m.color,m.alpha??1,m.emission??0,m.kind??0);
  }
  quad(a:Vec3,b:Vec3,c:Vec3,d:Vec3,m:Material,normal?:Vec3){this.triangle(a,b,c,m,normal);this.triangle(a,c,d,m,normal);}
  polygon(ring:GroundPoint[],height:(p:GroundPoint)=>number,m:Material){
    const flat=ring.flatMap(p=>[p.east,p.north]),indices=earcut(flat);
    const point=(i:number):Vec3=>[ring[i].east,height(ring[i]),ring[i].north];
    for(let i=0;i<indices.length;i+=3)this.triangle(point(indices[i]),point(indices[i+1]),point(indices[i+2]),m,[0,1,0]);
  }
  box(center:Vec3,width:number,height:number,depth:number,m:Material,bearing=0){
    const a=bearing*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    const p=(x:number,y:number,z:number):Vec3=>[center[0]+x*c+z*s,center[1]+y,center[2]-x*s+z*c];
    const x=width/2,z=depth/2;
    this.quad(p(-x,0,-z),p(x,0,-z),p(x,height,-z),p(-x,height,-z),m);
    this.quad(p(x,0,z),p(-x,0,z),p(-x,height,z),p(x,height,z),m);
    this.quad(p(-x,0,z),p(-x,0,-z),p(-x,height,-z),p(-x,height,z),m);
    this.quad(p(x,0,-z),p(x,0,z),p(x,height,z),p(x,height,-z),m);
    this.quad(p(-x,height,-z),p(x,height,-z),p(x,height,z),p(-x,height,z),m,[0,1,0]);
  }
  beam(a:Vec3,b:Vec3,width:number,m:Material,sides=6){
    const axis=unit(sub(b,a)),right=unit(cross(axis,Math.abs(axis[1])>.95?[1,0,0]:[0,1,0])),up=unit(cross(axis,right));
    for(let i=0;i<sides;i++){
      const pos=(end:Vec3,t:number)=>add(end,add(scale(right,Math.cos(t)*width/2),scale(up,Math.sin(t)*width/2)));
      const t=i*2*Math.PI/sides,t2=(i+1)*2*Math.PI/sides;
      this.quad(pos(a,t),pos(a,t2),pos(b,t2),pos(b,t),m);
    }
  }
  cylinder(center:Vec3,radius:number,height:number,m:Material,sides=32,topRadius=radius){
    const point=(i:number,top:boolean):Vec3=>[center[0]+Math.sin(i*2*Math.PI/sides)*(top?topRadius:radius),center[1]+(top?height:0),center[2]+Math.cos(i*2*Math.PI/sides)*(top?topRadius:radius)];
    for(let i=0;i<sides;i++){this.quad(point(i,false),point(i+1,false),point(i+1,true),point(i,true),m);if(topRadius>0)this.triangle([center[0],center[1]+height,center[2]],point(i,true),point(i+1,true),m,[0,1,0]);}
  }
  ring(center:Vec3,inner:number,outer:number,m:Material,segments=64){
    const p=(i:number,r:number):Vec3=>[center[0]+Math.sin(i*2*Math.PI/segments)*r,center[1],center[2]+Math.cos(i*2*Math.PI/segments)*r];
    for(let i=0;i<segments;i++)this.quad(p(i,inner),p(i,outer),p(i+1,outer),p(i+1,inner),m,[0,1,0]);
  }
  finish(buildingCount:number,mappedPartCount:number):SceneMesh{return{opaque:new Float32Array(this.opaque),glass:new Float32Array(this.glass),triangles:(this.opaque.length+this.glass.length)/36,buildingCount,mappedPartCount};}
}

const mean=(ring:GroundPoint[])=>({east:ring.reduce((s,p)=>s+p.east,0)/ring.length,north:ring.reduce((s,p)=>s+p.north,0)/ring.length});
function terrainMesh(mesh:MeshBuilder,scene:CityScene){
  for(const grid of [scene.terrainFar,scene.terrain]){
  if(!grid)continue;
  const half=(grid.size-1)/2;
  const p=(x:number,y:number):Vec3=>{const center=localPoint(grid.center.latitude,grid.center.longitude,scene.site),east=center.east+(x-half)*grid.spacingMeters,north=center.north+(y-half)*grid.spacingMeters;return[east,sceneGround(scene,east,north),north];};
  // Subdivide the same bilinear field, without claiming additional measured resolution.
  // Include the exact eye's ground point so a coarse diagonal cannot put the observer underground.
  const step=grid===scene.terrain?.25:1,center=localPoint(grid.center.latitude,grid.center.longitude,scene.site);
  const axis=(offset:number)=>[...new Set([...Array(Math.round((grid.size-1)/step)+1)].map((_,i)=>i*step).concat(grid===scene.terrain?[Math.max(0,Math.min(grid.size-1,half-offset/grid.spacingMeters))]:[]))].sort((a,b)=>a-b);
  const xs=axis(center.east),ys=axis(center.north);
  for(let yi=0;yi<ys.length-1;yi++)for(let xi=0;xi<xs.length-1;xi++){
    const x=xs[xi],y=ys[yi],a=p(x,y),b=p(xs[xi+1],y),c=p(xs[xi+1],ys[yi+1]),d=p(x,ys[yi+1]),height=(a[1]+b[1]+c[1]+d[1])/4;
    if(grid===scene.terrainFar&&scene.terrain){
      const near=scene.terrain,center=localPoint(near.center.latitude,near.center.longitude,scene.site),extent=(near.size-1)*near.spacingMeters/2;
      if([a,b,c,d].every(v=>Math.abs(v[0]-center.east)<=extent+.01&&Math.abs(v[2]-center.north)<=extent+.01))continue;
    }
    const desert=scene.site.groundKind==='cliff',park=scene.id==='london-primrose'||scene.id==='seoul-namsan';
    const shade=Math.max(0,Math.min(.06,height/12000));
    const color:Color=desert?[.43+shade,.32+shade,.22+shade]:park?[.22+shade,.29+shade,.19+shade]:[.27+shade,.29+shade,.28+shade];
    // These are material approximations over the actual sampled terrain, not a landcover product.
    const m={color,kind:desert?4:6};
    const normal=(v:Vec3):Vec3=>unit([-(sceneGround(scene,v[0]+50,v[2])-sceneGround(scene,v[0]-50,v[2]))/100,1,-(sceneGround(scene,v[0],v[2]+50)-sceneGround(scene,v[0],v[2]-50))/100]);
    const na=normal(a),nb=normal(b),nc=normal(c),nd=normal(d);
    mesh.triangle(a,d,c,m,[na,nd,nc]);mesh.triangle(a,c,b,m,[na,nc,nb]);
    if(height<.5&&scene.site.groundKind==='promenade')mesh.quad([a[0],0,a[2]],[b[0],0,b[2]],[c[0],0,c[2]],[d[0],0,d[2]],{color:[.055,.15,.20],kind:3},[0,1,0]);
  }
  }
}
function lineSurface(mesh:MeshBuilder,ring:GroundPoint[],scene:CityScene,width:number,m:Material,offset=.15){
  for(let i=1;i<ring.length;i++){
    const a=ring[i-1],b=ring[i],length=Math.hypot(b.east-a.east,b.north-a.north);if(length<.1)continue;
    const dx=-(b.north-a.north)/length*width/2,dz=(b.east-a.east)/length*width/2;
    const p=(point:GroundPoint,s:number):Vec3=>{const e=point.east+dx*s,n=point.north+dz*s;return[e,sceneGround(scene,e,n)+offset,n];};
    mesh.quad(p(a,-1),p(b,-1),p(b,1),p(a,1),m,[0,1,0]);
  }
}
function mapSurfaces(mesh:MeshBuilder,scene:CityScene){
  for(const e of scene.map?.elements??[]){
    if(e.type!=='way'||!e.geometry||e.geometry.length<2)continue;
    const tags=e.tags,ring=e.geometry.map(p=>localPoint(p.lat,p.lon,scene.site));
    const closed=e.geometry[0].lat===e.geometry[e.geometry.length-1].lat&&e.geometry[0].lon===e.geometry[e.geometry.length-1].lon;
    if(tags.natural==='water'||tags.waterway==='riverbank'){
      if(closed)mesh.polygon(ring,()=>.3,{color:[.045,.14,.19],kind:3});continue;
    }
    if(closed&&(tags.leisure==='park'&&tags.surface==='grass'||tags.landuse==='grass'||tags.natural==='wood'||tags.landuse==='forest'||tags.natural==='sand')){
      mesh.polygon(ring,p=>sceneGround(scene,p.east,p.north)+.2,{color:tags.natural==='sand'?[.57,.45,.31]:[.17,.29,.17],kind:tags.natural==='sand'?4:0});
    }
    if(tags.highway&&tags.area!=='yes'){
      const foot=['footway','path','pedestrian','steps'].includes(tags.highway),major=['trunk','primary','secondary','motorway'].includes(tags.highway);
      const width=Math.min(35,parseFloat(tags.width??'')||(foot?2.8:major?15:7));
      const bridge=tags.bridge&&tags.bridge!=='no';
      // Named bridge meshes have sourced deck clearances; generic mapped bridges remain approximate.
      if(bridge&&['new-york-pier1','sydney-macquaries'].includes(scene.id))continue;
      lineSurface(mesh,ring,scene,width,{color:foot?[.48,.45,.40]:[.17,.19,.21]},bridge?6:.25);
      if(major&&width>8)lineSurface(mesh,ring,scene,.2,{color:[.68,.62,.42],emission:.08},.30);
    }
  }
}
function mappedBuildings(mesh:MeshBuilder,scene:CityScene){
  const area=(ring:GroundPoint[])=>Math.abs(ring.reduce((sum,p,i)=>{const n=ring[(i+1)%ring.length];return sum+p.east*n.north-n.east*p.north;},0)/2);
  const accents=scene.buildings.filter(b=>b.accent).map(b=>({b,center:mean(b.ring),area:area(b.ring)}));
  for(const b of scene.buildings){
    const ring=b.ring,wall=b.tags['building:material']==='glass'||b.accent;
    const tint=(Math.abs(b.id)%9)/100;
    const m:Material={color:b.accent?[.39,.48,.53]:wall?[.25+tint,.34+tint,.40+tint]:[.36+tint,.36+tint,.35+tint],kind:wall?7:8};
    const base=b.base+b.bottom,top=b.base+b.top;
    const center=mean(ring),footArea=area(ring);
    const exposed=b.accent?Math.max(b.bottom,...accents.filter(a=>a.b.top<b.top-.5&&a.area>footArea*1.08&&Math.hypot(a.center.east-center.east,a.center.north-center.north)<20).map(a=>a.b.top)):b.bottom;
    for(let i=1;i<ring.length;i++){
      const a=ring[i-1],c=ring[i],length=Math.hypot(c.east-a.east,c.north-a.north);if(length<.25)continue;
      mesh.quad([a.east,base,a.north],[c.east,base,c.north],[c.east,top,c.north],[a.east,top,a.north],m);
      const inset=(distance:number)=>({east:distance*(a.east+c.east)/2+(1-distance)*mean(ring).east,north:distance*(a.north+c.north)/2+(1-distance)*mean(ring).north});
      // Facade rhythm and window operation are illustrative; mapped tier outlines stay unchanged.
      if(b.accent&&b.distance<2200&&length>.8&&b.top-exposed>2){
        const floors=Math.min(b.accent?100:35,Math.floor((b.top-exposed)/4.1));
        for(let f=1;f<=floors;f++){
          const up=b.base+exposed+f*4.1;if(up>top-.3)break;
          const near=inset(1.002),emission=b.accent?.65:((b.id+f*17+i*13)%11<3?.3:.02);
          if(b.accent)mesh.beam([a.east,up,a.north],[c.east,up,c.north],.24,{color:[.58,.66,.70],kind:2,emission},4);
          else if(length>4){
            const cols=Math.min(12,Math.floor(length/3.2));
            for(let col=0;col<cols;col++){
              if(Math.abs((b.id+f*31+col*19+i*7)%13)>4)continue;
              const p=(t:number,y:number):Vec3=>[a.east+(c.east-a.east)*t+(near.east-(a.east+c.east)/2),y,a.north+(c.north-a.north)*t+(near.north-(a.north+c.north)/2)];
              mesh.quad(p((col+.22)/cols,up-2),p((col+.7)/cols,up-2),p((col+.7)/cols,up-.55),p((col+.22)/cols,up-.55),{color:[.29,.35,.38],emission,kind:1});
            }
          }
        }
      }
    }
    mesh.polygon(ring,()=>top,{color:b.accent?[.47,.53,.57]:[.30,.32,.33],kind:wall?7:8});
  }
}
function furniture(mesh:MeshBuilder,scene:CityScene){
  let renderedTrees=0;
  for(const e of scene.map?.elements??[]){
    if(e.type!=='node'||!Number.isFinite(e.lat)||!Number.isFinite(e.lon))continue;
    const p=localPoint(e.lat!,e.lon!,scene.site),distance=Math.hypot(p.east,p.north),base=sceneGround(scene,p.east,p.north);
    if(e.tags.natural==='tree'&&distance<1500&&renderedTrees++<500){
      const height=Math.min(24,parseFloat(e.tags.height??'')||7+(e.id%5));
      mesh.cylinder([p.east,base,p.north],.22,height*.6,{color:[.21,.16,.11]},6);
      mesh.cylinder([p.east,base+height*.32,p.north],height*.24,height*.45,{color:[.15,.25,.14]},9,height*.19);
      mesh.cylinder([p.east,base+height*.62,p.north],height*.22,height*.38,{color:[.20,.30,.17]},9,0);
    }else if(e.tags.amenity==='bench'&&distance<170){
      mesh.box([p.east,base+.45,p.north],1.7,.10,.55,{color:[.36,.25,.15]});mesh.box([p.east,base+.55,p.north+.23],1.7,.48,.07,{color:[.36,.25,.15]});
      for(const x of [-.6,.6])mesh.box([p.east+x,base,p.north],.09,.5,.5,metal);
    }else if(e.tags.highway==='street_lamp'&&distance<500){
      mesh.cylinder([p.east,base,p.north],.07,5,metal,6);mesh.box([p.east,base+5,p.north],.40,.12,.3,{color:[.8,.72,.52],emission:1,kind:5});
    }
  }
}

function rail(mesh:MeshBuilder,a:Vec3,b:Vec3,height=1.1,transparent=false){
  mesh.beam(add(a,[0,height,0]),add(b,[0,height,0]),.065,metal,6);
  const length=Math.hypot(...sub(b,a)),steps=Math.max(1,Math.ceil(length/1.7));
  for(let i=0;i<=steps;i++){const p=add(a,scale(sub(b,a),i/steps));mesh.beam(p,add(p,[0,height,0]),.075,metal,6);}
  if(transparent)mesh.quad(a,b,add(b,[0,height-.08,0]),add(a,[0,height-.08,0]),glass);
  else mesh.beam(add(a,[0,.45,0]),add(b,[0,.45,0]),.035,metal,5);
}
function foreground(mesh:MeshBuilder,scene:CityScene){
  const site=scene.site,floor=scene.eyeElevation-site.eyeHeight;
  if(site.groundKind==='deck'){
    const c=localPoint(3.152859,101.7037604,site),center:Vec3=[c.east,floor,c.north];
    mesh.ring(center,8.2,20,{color:[.52,.53,.53]},96);
    for(let i=0;i<96;i++){
      const p=(t:number):Vec3=>[c.east+Math.sin(t)*20,floor,c.north+Math.cos(t)*20];
      rail(mesh,p(i*2*Math.PI/96),p((i+1)*2*Math.PI/96),1.12,true);
      if(i%2===0)mesh.beam([c.east+Math.sin(i*Math.PI/48)*8.3,floor+.015,c.north+Math.cos(i*Math.PI/48)*8.3],p(i*Math.PI/48),.018,{color:[.25,.27,.28]},3);
    }
    for(let r=9;r<20;r+=.8)mesh.ring([c.east,floor+.02,c.north],r,r+.014,{color:[.26,.28,.29]},96);
    mesh.cylinder([c.east,scene.groundElevation,c.north],7.4,270,{color:[.62,.64,.64]},48,6);
    mesh.cylinder([c.east,scene.groundElevation+270,c.north],18,30,{color:[.32,.40,.44],kind:2},64,20);
    mesh.cylinder([c.east,floor,c.north],7.5,27,{color:[.63,.67,.67],kind:2},48,4.2);
    mesh.cylinder([c.east,scene.groundElevation+327,c.north],2.6,94,{color:[.59,.57,.51],kind:2},16,.25);
    return;
  }
  const az=site.camera.azimuth*Math.PI/180,f=[Math.sin(az),Math.cos(az)],r=[Math.cos(az),-Math.sin(az)];
  const p=(right:number,forward:number,up=0):Vec3=>[r[0]*right+f[0]*forward,floor+up,r[1]*right+f[1]*forward];
  const groundMat:Material={color:site.groundKind==='park'?[.48,.46,.40]:site.groundKind==='cliff'?[.51,.37,.23]:[.44,.45,.44]};
  // Foreground dimensions/materials are reference-informed approximations, not surveyed pavement.
  for(let x=-8;x<8;x+=1)for(let z=-6;z<5;z+=1){
    const a=p(x,z),b=p(x+.97,z),c=p(x+.97,z+.97),d=p(x,z+.97);mesh.quad(a,b,c,d,groundMat,[0,1,0]);
  }
  if(site.groundKind==='promenade'||site.groundKind==='cliff')rail(mesh,p(-12,5),p(12,5),site.groundKind==='cliff'?1.1:.95);
  if(site.groundKind==='park')mesh.box(p(0,5),3,.65,.8,stone,site.camera.azimuth);
}

export function buildSceneMesh(scene:CityScene):SceneMesh{
  const mesh=new MeshBuilder();terrainMesh(mesh,scene);mapSurfaces(mesh,scene);mappedBuildings(mesh,scene);furniture(mesh,scene);foreground(mesh,scene);
  for(const polygon of scene.water?.polygons??[]){
    const rings=[polygon.outer,...polygon.holes],points=rings.flatMap(r=>r.map(v=>localPoint(v.lat,v.lon,scene.site)));
    const holes:number[]=[];let count=rings[0].length;for(const hole of rings.slice(1)){holes.push(count);count+=hole.length;}
    const indices=earcut(points.flatMap(p=>[p.east,p.north]),holes),point=(i:number):Vec3=>[points[i].east,-(points[i].east**2+points[i].north**2)/12742000,points[i].north];
    for(let i=0;i<indices.length;i+=3)mesh.triangle(point(indices[i]),point(indices[i+1]),point(indices[i+2]),{color:[.055,.15,.20],kind:3},[0,1,0]);
  }
  addLandmarkModels(mesh,scene);
  return mesh.finish(scene.buildings.length,scene.buildings.filter(b=>b.part).length);
}

// Additional architecture follows published headline dimensions and map positions.
// Detailed OSM building parts, when present, take precedence over an invented replacement.
function addLandmarkModels(mesh:MeshBuilder,scene:CityScene){
  const point=(lat:number,lon:number,height=0):Vec3=>{const p=localPoint(lat,lon,scene.site);return[p.east,sceneGround(scene,p.east,p.north)+height,p.north];};
  if(scene.id==='kl-sky-deck'){
    // Petronas tier floorplates come from mapped OSM parts. The additional skybridge
    // uses published span/height constraints; its fine facade/truss detailing is illustrative.
    const a=point(3.1576104,101.7114256),b=point(3.1582379,101.7121562),center=scale(add(a,b),.5);
    const dir=unit(sub(b,a)),span=58.4,start=add(center,scale(dir,-span/2)),end=add(center,scale(dir,span/2));
    const base=(a[1]+b[1])/2+170;start[1]=base;end[1]=base;
    mesh.beam(start,end,5,{color:[.48,.56,.61],kind:2,emission:.12},8);
    for(const anchor of [a,b])mesh.beam(add(anchor,[0,150,0]),add(center,[0,170,0]),.65,metal,6);
    const m=point(3.1417,101.7005),height=678.9;
    taperedTower(mesh,m,height-135,29,{color:[.28,.43,.49],kind:2,emission:.03},4,45);mesh.cylinder(add(m,[0,height-135,0]),1.8,135,{color:[.56,.64,.68],kind:2},8,.12);
  }
  if(scene.id==='seoul-namsan'){
    const a=point(37.551216,126.988166);a[1]=270;
    mesh.cylinder(a,5.5,120,{color:[.72,.71,.65]},32,4);
    mesh.cylinder(add(a,[0,110,0]),13,20,{color:[.32,.43,.48],kind:2,emission:.12},40,11);
    mesh.cylinder(add(a,[0,130,0]),6,5.7,metal,32,3);
    mesh.cylinder(add(a,[0,135.7,0]),2,101,{color:[.68,.42,.38]},12,.18);
  }
  if(scene.id==='london-primrose'){
    const bt=point(51.5215,-.1387);mesh.cylinder(bt,7,145,{color:[.46,.53,.56],kind:2},24,6);
    mesh.cylinder(add(bt,[0,145,0]),10.5,32,{color:[.40,.52,.57],kind:2,emission:.12},32,8);mesh.cylinder(add(bt,[0,177,0]),.6,12,metal,6,.2);
    taperedTower(mesh,point(51.5045,-.0865),309.6,24,{color:[.38,.52,.58],kind:2,emission:.04},8,20);
  }
  if(scene.id==='sydney-macquaries'){
    operaHouse(mesh,point(-33.85678,151.2153));harbourBridge(mesh,point(-33.8523,151.2108));
  }
  if(scene.id==='new-york-pier1'){
    const wtc=point(40.71275,-74.0134);oneWorldTradeCenter(mesh,wtc);mesh.cylinder(add(wtc,[0,416.9,0]),1.6,124.4,metal,12,.12);
    brooklynBridge(mesh,point(40.7069,-73.9992));
  }
}
function taperedTower(mesh:MeshBuilder,base:Vec3,height:number,radius:number,m:Material,sides:number,angle=0){
  const a=angle*Math.PI/180;
  const p=(i:number,y:number,r:number):Vec3=>[base[0]+Math.sin(a+i*2*Math.PI/sides)*r,base[1]+y,base[2]+Math.cos(a+i*2*Math.PI/sides)*r];
  for(let i=0;i<sides;i++){mesh.quad(p(i,0,radius),p(i+1,0,radius),p(i+1,height,radius*.12),p(i,height,radius*.12),m);mesh.beam(p(i,0,radius),p(i,height,radius*.12),.42,{color:[.56,.65,.70],kind:2});}
}
function operaHouse(mesh:MeshBuilder,base:Vec3){
  base[1]=0;const az=10*Math.PI/180,c=Math.cos(az),s=Math.sin(az);
  const p=(x:number,y:number,z:number):Vec3=>[base[0]+x*c+z*s,Math.max(0,base[1])+y,base[2]-x*s+z*c];
  mesh.box(p(0,0,0),110,12,170,{color:[.54,.43,.31]},10);
  for(const [x,z,scaleValue] of [[-24,-30,1],[24,-17,.85],[-24,30,.70],[24,40,.63],[-24,65,.40]]){
    for(const side of [-1,1])for(let i=0;i<20;i++)for(let j=0;j<8;j++){
      const shell=(u:number,v:number)=>p(x+side*Math.sin(u*Math.PI/2)*25*scaleValue*Math.sin(v*Math.PI),12+55*scaleValue*Math.sin(u*Math.PI/2)*Math.sin(v*Math.PI*.8+.2),z+(v-.5)*68*scaleValue+u*18*scaleValue);
      mesh.quad(shell(i/20,j/8),shell((i+1)/20,j/8),shell((i+1)/20,(j+1)/8),shell(i/20,(j+1)/8),{color:[.81,.79,.68],kind:2,emission:.03});
    }
  }
}
function harbourBridge(mesh:MeshBuilder,base:Vec3){
  base[1]=0;const az=8*Math.PI/180;
  const p=(along:number,side:number,up:number):Vec3=>[base[0]+Math.sin(az)*along+Math.cos(az)*side,up,base[2]+Math.cos(az)*along-Math.sin(az)*side];
  mesh.box([base[0],49,base[2]],49,4,1149,{color:[.25,.28,.29]},8);
  for(const side of [-24,24]){
    const arch=(t:number)=>p(t*503/2,side,51+83*(1-t*t));
    for(let i=0;i<44;i++){const t=-1+i/22,t2=t+1/22;mesh.beam(arch(t),arch(t2),2.4,metal,5);mesh.beam(p(t*503/2,side,49),arch(t),.45,metal,4);if(i%2===0)mesh.beam(arch(t),p(t2*503/2,side,51+72*(1-t2*t2)),.65,metal,4);}
  }
  for(const along of [-280,280])for(const side of [-31,31])mesh.box(p(along,side,0),18,89,28,{color:[.55,.49,.41]},8);
}
function brooklynBridge(mesh:MeshBuilder,base:Vec3){
  base[1]=0;const az=305*Math.PI/180,span=486.3,half=span/2;
  const p=(along:number,side:number,up:number):Vec3=>[base[0]+Math.sin(az)*along+Math.cos(az)*side,up,base[2]+Math.cos(az)*along-Math.sin(az)*side];
  mesh.box(p(0,0,41.15),26,3,1050,{color:[.33,.34,.34]},305);
  for(const along of [-half,half]){
    for(const side of [-16,0,16])mesh.box(p(along,side,0),7,84.3,17,{color:[.55,.48,.39]},305);
    mesh.box(p(along,0,70),39,14.3,17,{color:[.56,.49,.40]},305);
  }
  for(const side of [-13,13])for(let i=0;i<64;i++){
    const t=-1+i/32,t2=t+1/32,curve=(v:number)=>p(v*half,side,45+39.3*v*v);
    mesh.beam(curve(t),curve(t2),.38,metal,5);mesh.beam(p(t*half,side,44),curve(t),.11,metal,4);
  }
}

function oneWorldTradeCenter(mesh:MeshBuilder,base:Vec3){
  // SOM square base -> eight faces -> 150 ft square parapet rotated 45 degrees.
  // Headline dimensions constrain this simplified massing, not a facade survey.
  const b=30.5,t=45.72/Math.sqrt(2),roof=416.9,plinth=55;
  const lower=[[-b,-b],[0,-b],[b,-b],[b,0],[b,b],[0,b],[-b,b],[-b,0]];
  const upper=[[0,-t],[0,-t],[t,0],[t,0],[0,t],[0,t],[-t,0],[-t,0]];
  const p=(v:number[],height:number):Vec3=>[base[0]+v[0],base[1]+height,base[2]+v[1]];
  const m:Material={color:[.35,.49,.56],kind:7,emission:.015};
  mesh.box(base,61,plinth,61,{color:[.30,.39,.45],kind:7});
  for(let i=0;i<8;i++)mesh.quad(p(lower[i],plinth),p(lower[(i+1)%8],plinth),p(upper[(i+1)%8],roof),p(upper[i],roof),m);
}
