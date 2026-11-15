import { illustrativeBuildings, projectFace, type Building, type WorldPoint } from './horizon';
import type { ImmersiveSkyProps } from './skyView';

const generic=illustrativeBuildings(), rad=Math.PI/180;
export function sceneBuildings(p:ImmersiveSkyProps):Building[]{return p.filters.horizon==='local'?(p.horizonData?.buildings??generic):p.filters.horizon==='rooftop'?generic:[];}

export function blockedByBuilding(altitude:number,azimuth:number,p:ImmersiveSkyProps):boolean{
  const east=Math.sin(azimuth*rad),north=Math.cos(azimuth*rad),eye=p.filters.observerHeight;
  for(const b of sceneBuildings(p))for(let i=0;i<b.ring.length;i++){
    const a=b.ring[i],c=b.ring[(i+1)%b.ring.length],dx=c.east-a.east,dz=c.north-a.north;
    const den=east*dz-north*dx;if(Math.abs(den)<1e-8)continue;
    const distance=(a.east*dz-a.north*dx)/den,t=(a.east*north-a.north*east)/den;
    if(distance>0&&t>=0&&t<=1&&Math.atan2(b.height-eye,distance)/rad>=altitude&&Math.atan2(-eye,distance)/rad<=altitude)return true;
  }
  return false;
}

/** Map-positioned extrusions; facades, windows, materials and all missing heights are illustrative. */
export function drawSurroundings(ctx:CanvasRenderingContext2D,p:ImmersiveSkyProps,w:number,h:number){
  const buildings=sceneBuildings(p),eye=p.filters.observerHeight;
  const day=Math.max(0,Math.min(1,(p.sky.sunAltitude+8)/16)),night=1-day;
  const faces:{polygon:WorldPoint[];building:Building;edge:number;distance:number;roof:boolean}[]=[];
  for(const b of buildings){
    const winding=Math.sign(b.ring.reduce((sum,a,i)=>{const c=b.ring[(i+1)%b.ring.length];return sum+a.east*c.north-c.east*a.north;},0))||1;
    for(let edge=0;edge<b.ring.length-1;edge++){
      const a=b.ring[edge],c=b.ring[(edge+1)%b.ring.length];
      const normalEast=(c.north-a.north)*winding,normalNorth=-(c.east-a.east)*winding;
      if(normalEast*-(a.east+c.east)/2+normalNorth*-(a.north+c.north)/2<=0)continue;
      faces.push({polygon:[{...a,up:-eye},{...c,up:-eye},{...c,up:b.height-eye},{...a,up:b.height-eye}],building:b,edge,distance:Math.hypot((a.east+c.east)/2,(a.north+c.north)/2),roof:false});
    }
    if(eye>b.height)faces.push({polygon:b.ring.map(v=>({...v,up:b.height-eye})),building:b,edge:0,distance:b.distance,roof:true});
  }
  faces.sort((a,b)=>b.distance-a.distance);
  const path=(vertices:ReturnType<typeof projectFace>)=>{ctx.beginPath();vertices.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();};
  for(const face of faces){
    const points=projectFace(face.polygon,p.camera,w,h);
    if(points.length<3||points.every(v=>v.x<0)||points.every(v=>v.x>w)||points.every(v=>v.y<0)||points.every(v=>v.y>h))continue;
    const {building:b,edge,distance}=face;
    const fade=Math.min(.72,distance/1500),tone=(b.style*3+edge*7)%16;
    const urban=p.cityLightPercent/100;
    const base=face.roof?11:17+tone;
    const r=Math.round(base+day*64+night*urban*3+fade*19),g=Math.round(base+4+day*68+night*urban*5+fade*21),blue=Math.round(base+10+day*71+night*urban*8+fade*30);
    const gradient=ctx.createLinearGradient(0,Math.min(...points.map(v=>v.y)),0,Math.max(...points.map(v=>v.y))+1);
    gradient.addColorStop(0,`rgb(${r+7},${g+7},${blue+8})`);gradient.addColorStop(1,`rgb(${r*.65},${g*.67},${blue*.7})`);
    path(points);ctx.fillStyle=gradient;ctx.fill();ctx.strokeStyle=`rgba(148,166,176,${.12+day*.1})`;ctx.lineWidth=.55;ctx.stroke();
    if(face.roof||distance>330)continue;
    const a=b.ring[edge],c=b.ring[(edge+1)%b.ring.length],length=Math.hypot(c.east-a.east,c.north-a.north);
    const floors=Math.min(18,Math.floor(b.height/3.1)),cols=Math.min(18,Math.floor(length/2.5));
    if(cols<1||floors<1)continue;
    ctx.save();path(points);ctx.clip();
    for(let row=0;row<floors;row++)for(let col=0;col<cols;col++){
      const hash=Math.abs((b.id*31+edge*17+row*71+col*43)%97);

      const left=(col+.27)/cols,right=Math.min(1,(col+.67)/cols),low=row*3.1+1-eye,top=Math.min(b.height-eye-.3,low+1.15);
      if(top<=low)continue;
      const pos=(t:number,up:number)=>({east:a.east+(c.east-a.east)*t,north:a.north+(c.north-a.north)*t,up});
      const window=projectFace([pos(left,low),pos(right,low),pos(right,top),pos(left,top)],p.camera,w,h);
      if(window.length<3)continue;
      path(window);ctx.fillStyle='rgba(5,12,19,.46)';ctx.fill();if(hash>36)continue;ctx.fillStyle=hash%4===0?`rgba(146,173,186,${urban*night*.31})`:`rgba(216,177,111,${urban*night*(.23+hash/100)})`;ctx.fill();
    }
    ctx.restore();
  }
  if(p.filters.horizon==='rooftop'){
    // Foreground parapet follows camera pitch through world-space geometry.
    const az=p.camera.azimuth*rad,f=[Math.sin(az),Math.cos(az)],r=[Math.cos(az),-Math.sin(az)];
    const corner=(side:number,up:number)=>({east:f[0]*7+r[0]*side,north:f[1]*7+r[1]*side,up});
    const parapet=projectFace([corner(-20,-3),corner(20,-3),corner(20,-.6),corner(-20,-.6)],p.camera,w,h);
    if(parapet.length>=3){path(parapet);ctx.fillStyle=`rgb(${27+day*35},${32+day*35},${38+day*35})`;ctx.fill();ctx.strokeStyle='#62717c88';ctx.lineWidth=2;ctx.stroke();}
  }
}
