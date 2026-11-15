import {Body,Equator,Horizon,Observer,SearchMoonQuarter,NextMoonQuarter} from 'astronomy-engine';
import type {ObservingPlace} from './locations';
import type {SkyCamera} from './skyView';
import {resolveLocalDateTime,zonedClock} from './observingTime';

export interface SkyMoment {id:string;title:string;tag:string;instant:Date;eventTime?:Date;note:string;source:string;target:'moon'|'pair'|'radiant'|'sky';archived?:boolean}
const nasaNovember='https://science.nasa.gov/solar-system/skywatching/whats-up-november-2026-skywatching-tips-from-nasa/';
const moonGuide='https://science.nasa.gov/moon/viewing-tips/';
function horizontal(body:Body,date:Date,place:ObservingPlace){const observer=new Observer(place.latitude,place.longitude,place.elevation),eq=Equator(body,date,observer,true,true);return Horizon(date,observer,eq.ra,eq.dec,'');}
function radiant(date:Date,place:ObservingPlace){return Horizon(date,new Observer(place.latitude,place.longitude,place.elevation),112/15,33,'');}
/** Real observing instants, separate from exact phase times. No visibility or meteor-rate forecast. */
export function skyMoments(place:ObservingPlace,from:Date):SkyMoment[]{
  const result:SkyMoment[]=[];
  const phases=new Set([0,1,2]);let quarter=SearchMoonQuarter(from);
  for(let i=0;i<8&&phases.size;i++,quarter=NextMoonQuarter(quarter)){
    if(!phases.has(quarter.quarter))continue;phases.delete(quarter.quarter);
    const phase=quarter.quarter,local=zonedClock(quarter.time.date,place.timeZone);
    result.push({id:`phase-${phase}`,title:phase===0?'Moonless evening':phase===1?'First-quarter Moon':'Full Moon',tag:phase===0?'LOW MOONLIGHT':phase===1?'LUNAR DETAIL':'BRIGHT MOON',instant:resolveLocalDateTime(`${local.date}T21:00`,place.timeZone).date,eventTime:quarter.time.date,target:phase===0?'sky':'moon',source:moonGuide,note:phase===0?'21:00 near the calculated New Moon. Clouds and artificial light still matter.':phase===1?'21:00 on the local phase date. Explore relief near the lunar terminator if the Moon is up.':'21:00 on the local phase date. Strong moonlight can reduce faint-sky contrast.'});
  }
  const pairTime=resolveLocalDateTime('2026-11-16T05:00',place.timeZone).date;
  result.push({id:'pair-2026',title:'Mars meets Jupiter',tag:'CLOSE PAIR · 2026',instant:pairTime,target:'pair',archived:from>new Date('2026-11-17T12:00Z'),source:nasaNovember,note:'NASA highlights the November 15–16 morning pairing. Preview 05:00 local; calculated positions and local twilight apply.'});
  const peak=Date.parse('2026-12-14T14:00Z');
  const candidates=[14,15].flatMap(day=>[0,1,2,3,4,5].map(hour=>resolveLocalDateTime(`2026-12-${day}T0${hour}:00`,place.timeZone).date));
  const scored=candidates.map(date=>{const sun=horizontal(Body.Sun,date,place),moon=horizontal(Body.Moon,date,place),r=radiant(date,place);return{date,score:r.altitude-(sun.altitude>-18?150:0)-(moon.altitude>0?30:0)-Math.abs(date.getTime()-peak)/3600000*1.5};}).sort((a,b)=>b.score-a.score);
  result.push({id:'geminids-2026',title:'Geminid watch',tag:'METEOR PLANNING · 2026',instant:scored[0].date,target:'radiant',archived:from>new Date('2026-12-16T12:00Z'),source:'https://www.imo.net/files/meteor-shower/cal2026.pdf',note:'A local pre-dawn planning time near the broad December 14 maximum (about 14:00 UTC). Approximate radiant RA 112°, Dec +33°. No meteor streaks, rates or weather forecast are simulated.'});
  return result;
}

export function momentCamera(moment:SkyMoment,place:ObservingPlace):SkyCamera|null{
  if(moment.target==='sky')return null;
  if(moment.target==='radiant'){const h=radiant(moment.instant,place);return{azimuth:h.azimuth,altitude:Math.max(15,h.altitude),fieldOfView:100};}
  if(moment.target==='moon'){const h=horizontal(Body.Moon,moment.instant,place);return h.altitude>0?{azimuth:h.azimuth,altitude:h.altitude,fieldOfView:25}:null;}
  const a=horizontal(Body.Mars,moment.instant,place),b=horizontal(Body.Jupiter,moment.instant,place),rad=Math.PI/180;
  if(a.altitude<0||b.altitude<0)return null;
  const vector=(h:typeof a)=>[Math.cos(h.altitude*rad)*Math.sin(h.azimuth*rad),Math.sin(h.altitude*rad),Math.cos(h.altitude*rad)*Math.cos(h.azimuth*rad)];
  const av=vector(a),bv=vector(b),v=av.map((x,i)=>x+bv[i]);
  return{azimuth:(Math.atan2(v[0],v[2])/rad+360)%360,altitude:Math.asin(v[1]/Math.hypot(...v))/rad,fieldOfView:30};
}
