import {useRef,useState,type ReactNode} from 'react';
import {BookOpen,Image,MapPin,Moon,RotateCcw,X} from 'lucide-react';
import {VIEWPOINTS} from '../lib/viewpoints';
import {PLACE_PHOTOS} from '../lib/placePhotos';
import type {SkyMoment} from '../lib/skyMoments';
import type {QuickLook} from '../lib/quickLook';
import type {SkyViewActions} from '../lib/skyView';
import '../quick-sky.css';

function Switch({label,note,checked,onChange}:{label:string;note:string;checked:boolean;onChange:(value:boolean)=>void}){
  return <label className="plain-switch"><input type="checkbox" role="switch" aria-label={label} checked={checked} onChange={e=>onChange(e.target.checked)}/><span><strong>{label}</strong><small>{note}</small></span><output>{checked?'On':'Off'}</output></label>;
}
interface Props {view:SkyViewActions;stationId?:string;onStation:(id:string)=>void;look:string;onLook:(id:QuickLook)=>void;labels:boolean;onLabels:(value:boolean)=>void;onTonight:()=>void;onNow:()=>void;clock:string;nowMode:boolean;tonightActive:boolean;daylight:boolean;cloudCover:number;onReset:()=>void;onEvidence:()=>void;advanced:ReactNode;environment:ReactNode;moments:SkyMoment[];activeMoment?:SkyMoment;onMoment:(moment:SkyMoment)=>void;visitedLooks:string[];timeZone:string;onCompare:()=>void;onClearAir:()=>void;comparison:boolean}
export default function QuickSkyControls(p:Props){
  const [answer,setAnswer]=useState<'yes'|'no'|null>(null),photoDialog=useRef<HTMLDialogElement>(null);
  const photo=PLACE_PHOTOS[p.stationId as keyof typeof PLACE_PHOTOS];
  const looks=[['city','Busy city','Urban lighting illustration.'],['natural','No artificial light','Reference view: remove artificial glow; keep the Sun, Moon and air.'],['responsible','Responsible lighting','Preview 00:05: dim, shield and warm participating nonessential fixtures.'],['future','Overlit future','Extreme hypothetical glare suppresses the stellar field.']] as const;
  return <div className="quick-sky-controls instrument-panel">
    {p.view.controlSection==='observe'&&<>
      <p className="panel-intro">Choose where and when to look. Stars and planets move with the selected place and instant.</p>
      <label className="quick-place"><MapPin size={16}/><select aria-label="Choose your place" value={p.stationId??''} onChange={e=>p.onStation(e.target.value)}>{!p.stationId&&<option value="">Custom location</option>}{VIEWPOINTS.map(site=><option key={site.id} value={site.id}>{site.city} · {site.name}</option>)}</select></label>
      <div className="quick-time"><span>{p.nowMode?'Live clock':'Time preview'}<strong>{p.clock}</strong></span><button aria-pressed={p.tonightActive} onClick={p.onTonight}>Tonight</button><button aria-pressed={p.nowMode} onClick={p.onNow}>Now</button></div>
      <label className="quick-moment-label">Featured observing dates<select aria-label="Pick a special sky" value={p.activeMoment?.id??''} onChange={e=>{const m=p.moments.find(m=>m.id===e.target.value);if(m)p.onMoment(m);}}><option value="">Choose a date…</option>{p.moments.map(m=><option key={m.id} value={m.id}>{m.instant.toLocaleDateString('en-GB',{month:'short',day:'numeric',timeZone:p.timeZone})} · {m.title}{m.archived?' · archive':''}</option>)}</select></label>
      {p.activeMoment&&<div className="quick-moment-note"><strong>{p.activeMoment.tag}</strong><p>{p.activeMoment.note}</p>{p.activeMoment.eventTime&&<small>Calculated phase: {p.activeMoment.eventTime.toISOString().slice(0,16).replace('T',' ')} UTC. Viewing preview: 21:00 local.</small>}<a href={p.activeMoment.source} target="_blank" rel="noreferrer">Observing guidance ↗</a></div>}
      {p.stationId&&<Switch label="Clear 360° platform" note={p.view.clearPlatform?`Virtual platform · ${p.view.platformElevation===undefined?'loading':Math.round(p.view.platformElevation)+' m ASL'}.`:'Named viewpoint; local structures may obstruct.'} checked={p.view.clearPlatform} onChange={p.view.onClearPlatform}/>}
      <Switch label="Show buildings" note="Keep the city in view, or hide it for sky study." checked={!p.view.skyOnly&&!p.view.moonStudy} onChange={value=>p.view.onSkyOnly(!value)}/>
      <Switch label="Star guides" note="Names and constellation lines where contrast allows." checked={p.labels} onChange={p.onLabels}/>
      <div className="quick-explore"><button onClick={p.view.onCityView}>Face the city</button>{p.view.moonAvailable&&<button aria-pressed={p.view.moonStudy} onClick={p.view.onMoonStudy}><Moon size={14}/>{p.view.moonStudy?'Return from Moon':'Study the Moon'}</button>}</div>
      {photo&&<button className="quick-photo-link" onClick={()=>photoDialog.current?.showModal()}><Image size={15}/>Historical place photograph</button>}
      <label className="immersive-quality"><span>Image quality</span><select aria-label="Image quality" value={p.view.quality} onChange={e=>p.view.onQuality(e.target.value as SkyViewActions['quality'])}><option value="balanced">Balanced</option><option value="high">High</option><option value="ultra">Ultra · up to 4K</option></select></label>
    </>}
    {p.view.controlSection==='environment'&&p.environment}
    {p.view.controlSection==='lighting'&&<>
      <p className="panel-intro">Choose a lighting scene. Compare holds the place, time, camera and atmosphere steady.</p>
      <div className="lighting-scene-list" role="group" aria-label="Lighting scenes">{looks.map(([id,title,note])=><button key={id} aria-pressed={p.look===id} onClick={()=>p.onLook(id)}><span className="scene-radio" aria-hidden="true"/><span><strong>{title}</strong><small>{note}</small></span></button>)}</div>
      <button className="panel-primary-action" onClick={p.onCompare}>Compare with busy city →</button>
      <p className="panel-footnote">Start with No artificial light for the clearest contrast. Responsible lighting is a smaller, scheduled fixture experiment. Retain essential safety lighting; proposed changes concern selected nonessential fixtures.</p>
      {(p.daylight||p.cloudCover>75)&&<p className="panel-warning">{p.daylight?'Daylight/twilight can hide the difference. Choose Tonight in Place & time.':'Clouds obscure both views. Try Environment → Clear air.'}{!p.daylight&&<button onClick={p.onClearAir}>Use clear air</button>}</p>}
      <details className="quick-advanced"><summary>Fixture schedule & detailed controls</summary>{p.advanced}</details>
      <details className="quick-learning"><summary>Night designer <small>{looks.filter(v=>p.visitedLooks.includes(v[0])).length}/4 scenes explored</small></summary><p>Does 50% fixture dimming mean 50% less skyglow?</p><div className="quick-explore"><button aria-pressed={answer==='yes'} onClick={()=>setAnswer('yes')}>Yes</button><button aria-pressed={answer==='no'} onClick={()=>setAnswer('no')}>No</button></div>{answer&&<p role="status">{answer==='no'?'Correct. ':'Try again. '}Fixture output and sky brightness differ. A six-night Tucson study fitted about −7.6% satellite response for roughly halving municipal lighting power; it does not forecast this city. <button onClick={p.onEvidence}>Read the evidence</button></p>}<a href="https://darksky.org/resources/guides-and-how-tos/lighting-principles/" target="_blank" rel="noreferrer">DarkSky + IES lighting principles ↗</a></details>
    </>}
    <div className="quick-footer"><button onClick={p.onEvidence}><BookOpen size={14}/>Sources & limits</button><button onClick={()=>{p.view.onSkyOnly(false);p.onReset();}}><RotateCcw size={13}/>Reset view</button></div>
    {photo&&<dialog className="place-photo-dialog" ref={photoDialog} aria-label="Historical place photograph" onKeyDown={e=>e.stopPropagation()}><header><div><span>HISTORICAL SOURCE PHOTOGRAPH</span><h2>{photo.place}</h2></div><button aria-label="Close photograph" onClick={()=>photoDialog.current?.close()}><X size={20}/></button></header><img src={document.getElementById(photo.embedded)?.getAttribute('src')??`/data/realism/${photo.file}`} alt={`Historical ${photo.place} photograph by ${photo.author}`}/><p>{photo.note}</p><p className="photo-fixed-note">This is a fixed photograph. Lighting controls apply to the calculated view behind it.</p><footer><a href={photo.url} target="_blank" rel="noreferrer">{photo.author}</a> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a></footer></dialog>}
  </div>;
}
