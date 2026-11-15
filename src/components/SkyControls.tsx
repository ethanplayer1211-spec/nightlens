import type {CSSProperties} from 'react';
import { BookOpen, Check, Cloud, Columns2 } from 'lucide-react';
import { LIGHTING_THEMES, type SkyFilters, type NightLighting } from '../lib/skyAppearance';
import type { CurrentConditions } from '../lib/locations';
import { zonedClock } from '../lib/observingTime';


function Range({label,value,onChange,note}:{label:string;value:number;onChange:(n:number)=>void;note?:string}){
  return <label className="live-glow-control"><span>{label}<output>{value}<small>/ 100</small></output></span><input style={{'--range-progress':`${value}%`} as CSSProperties} type="range" aria-label={label} min="0" max="100" value={value} onChange={e=>onChange(Number(e.target.value))}/>{note&&<small>{note}</small>}</label>;
}
function Toggle({label,checked,onChange,disabled=false}:{label:string;checked:boolean;onChange:(value:boolean)=>void;disabled?:boolean}){
  return <label className={`sky-toggle-row ${disabled?'is-disabled':''}`}><input type="checkbox" role="switch" aria-label={label} checked={checked} disabled={disabled} onChange={e=>onChange(e.target.checked)}/><span className="sky-toggle-track" aria-hidden="true"/><span className="sky-toggle-label">{label}</span><span className="sky-toggle-state" aria-hidden="true">{checked?'On':'Off'}</span></label>;
}
export default function SkyControls(p:{
  activeTab:string;onTab:(tab:string)=>void;glow:number;theme:string;onGlow:(v:number)=>void;onTheme:(id:string)=>void;
  filters:SkyFilters;onFilters:(patch:Partial<SkyFilters>)=>void;
  lighting:NightLighting;onLighting:(patch:Partial<NightLighting>)=>void;
  scheduleActive:boolean;fixtureOutput:number;onMidnightPreview:(after:boolean)=>void;
  comparison:boolean;onCompare:()=>void;labels:boolean;onLabels:(value:boolean)=>void;asterisms:boolean;onAsterisms:(value:boolean)=>void;
  conditions:CurrentConditions|null;weatherStatus:string;weatherFresh:boolean;timeZone:string;nowMode:boolean;useClouds:boolean;onUseClouds:(v:boolean)=>void;onRefresh:()=>void;
  onReset:()=>void;onEvidence:()=>void;
}){
  const tab=p.activeTab,setTab=p.onTab;
  const tabs=[['light','Lighting'],['air','Atmosphere'],['experiment','Experiment']];
  const startLabel=p.lighting.scheduleStart>=1440?`${String(Math.floor((p.lighting.scheduleStart-1440)/60)).padStart(2,'0')}:00`:`${Math.floor(p.lighting.scheduleStart/60)}:00`;
  return <aside className="observatory-controls" aria-label="Sky appearance controls"><span className="eyebrow">THE LIGHT BETWEEN US</span><h2>Imagine<br/><em>a darker sky.</em></h2><p className="lighting-caption">Combine light, atmosphere and responsible lighting choices. Positions stay calculated.</p>
    <div className="sky-control-tabs" role="tablist" aria-label="Sky control groups">{tabs.map(([id,label],index)=><button tabIndex={tab===id?0:-1} onKeyDown={e=>{const next=e.key==='ArrowRight'?(index+1)%tabs.length:e.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:e.key==='Home'?0:e.key==='End'?tabs.length-1:null;if(next!==null){e.preventDefault();setTab(tabs[next][0]);document.getElementById(`sky-tab-${tabs[next][0]}`)?.focus();}}} key={id} id={`sky-tab-${id}`} role="tab" aria-selected={tab===id} aria-controls={`sky-panel-${id}`} onClick={()=>setTab(id)}>{label}</button>)}</div>
    <section id="sky-panel-light" role="tabpanel" aria-labelledby="sky-tab-light" hidden={tab!=='light'}>
      <div className="sky-themes" role="group" aria-label="Lighting themes">{LIGHTING_THEMES.map(t=><button key={t.id} onClick={()=>p.onTheme(t.id)} aria-pressed={p.theme===t.id}><span className={`theme-mark theme-${t.id}`} aria-hidden="true"/><span>{t.title}<small>{t.subtitle}</small></span>{p.theme===t.id?<Check size={14}/>:<span className="theme-open-circle"/>}</button>)}</div>
      <Range label="Artificial light illustration" value={p.glow} onChange={p.onGlow} note={p.glow===100?'Severe undimmed glare. Active fixture changes still apply.':'Display intensity, not measured sky brightness.'}/>
      <Range label="Nearby glare" value={p.filters.glarePercent} onChange={glarePercent=>p.onFilters({glarePercent})} note="Illustrates nearby luminaires and lost dark adaptation."/>
      <label className="sky-select"><span>Visual treatment</span><select aria-label="Visual treatment" value={p.filters.viewStyle} onChange={e=>p.onFilters({viewStyle:e.target.value as SkyFilters['viewStyle']})}><option value="natural">Natural impression</option><option value="survey">Enhanced survey detail</option></select></label>
    </section>
    <section id="sky-panel-air" role="tabpanel" aria-labelledby="sky-tab-air" hidden={tab!=='air'}>
      <p className="sky-filter-note">These are selected conditions, not a weather reconstruction. Current model cloud coverage can be applied below.</p>
      <Range label="Haze illustration" value={p.filters.hazePercent} onChange={hazePercent=>p.onFilters({hazePercent})} note="More haze reduces transparency and strengthens urban glow."/>
      <Range label="Cloud coverage illustration" value={p.filters.cloudPercent} onChange={cloudPercent=>{p.onUseClouds(false);p.onFilters({cloudPercent});}}/>
      <Range label="Cloud opacity illustration" value={p.filters.cloudOpacityPercent} onChange={cloudOpacityPercent=>p.onFilters({cloudOpacityPercent})} note="100% coverage and opacity form an opaque overcast layer."/>
      <Toggle label="Illustrate Moon’s light" checked={p.filters.moonlightEnabled} onChange={moonlightEnabled=>p.onFilters({moonlightEnabled})}/><p className="sky-filter-note">The Moon’s position and phase remain calculated. Appearance is uncalibrated.</p>
    </section>
    <section id="sky-panel-experiment" role="tabpanel" aria-labelledby="sky-tab-experiment" hidden={tab!=='experiment'}>
      <Toggle label="Schedule nonessential fixture dimming" checked={p.lighting.scheduleEnabled} onChange={scheduleEnabled=>p.onLighting({scheduleEnabled})}/>
      <label className="sky-select"><span>Schedule begins</span><select aria-label="Night dimming begins" value={p.lighting.scheduleStart} onChange={e=>p.onLighting({scheduleStart:Number(e.target.value)})}>{[1080,1200,1320,1440,1500,1560,1680].map(m=><option key={m} value={m}>{String(Math.floor(m/60)%24).padStart(2,'0')}:00{m>=1440?' · next day':''}</option>)}</select></label>
      <Range label="Scheduled fixture brightness" value={100-p.lighting.dimmingPercent} onChange={v=>p.onLighting({dimmingPercent:100-v})} note="Participating nonessential fixtures only; no energy estimate."/>
      <Range label="Participating fixtures" value={p.lighting.participatingFixturePercent} onChange={participatingFixturePercent=>p.onLighting({participatingFixturePercent})}/>
      <Toggle label="Shield participating fixtures" checked={p.lighting.shieldingEnabled} onChange={shieldingEnabled=>p.onLighting({shieldingEnabled})}/>
      <label className="sky-select"><span>Outdoor light colour</span><select aria-label="Outdoor light colour" value={p.lighting.lightColorScenario} onChange={e=>p.onLighting({lightColorScenario:e.target.value as NightLighting['lightColorScenario']})}><option value="cool">Cooler</option><option value="warm">Warmer</option></select></label>
      <details className="source-mixture"><summary>Source mixture assumption</summary><Range label="Selected source share" value={p.lighting.selectedSourceSharePercent} onChange={selectedSourceSharePercent=>p.onLighting({selectedSourceSharePercent})} note="Assumed share of the artificial contribution in this illustration. Not measured for the selected city; not the Tucson satellite estimate."/></details>
      <div className="night-schedule-status" role="status"><strong>{p.lighting.scheduleEnabled?p.scheduleActive?'Dimming active':`Waiting for ${startLabel}`:'Schedule off'}</strong><span>{p.lighting.scheduleEnabled?`Selected output ${p.scheduleActive?(100-p.lighting.dimmingPercent).toFixed(0):100}% · ends 06:00 local`:'Enable the schedule, then compare either side of midnight.'}</span></div>
      <div className="midnight-preview-actions"><button onClick={()=>p.onMidnightPreview(false)}>Before · 23:55</button><button onClick={()=>p.onMidnightPreview(true)}>After · 00:05</button></div><p className="sky-filter-note">Dimming alone may make a modest difference. Other sources, clouds and Moon light remain. Keep essential safety lighting.</p>
    </section>
    <button className={`observatory-compare ${p.comparison?'is-on':''}`} aria-pressed={p.comparison} onClick={p.onCompare}><Columns2 size={15}/><span>Compare lighting</span><span className="compare-state-label">{p.comparison?'On':'Off'}</span><span className="compare-toggle"/></button>
    <div className="observatory-layer-options"><Toggle label="Object labels" checked={p.labels} onChange={p.onLabels}/><Toggle label="Asterism lines" checked={p.asterisms} onChange={p.onAsterisms}/></div>
    <details className="observatory-weather"><summary>Current model conditions <span>{p.nowMode?'Optional coverage':'Excluded in preview'}</span></summary><div><Cloud size={15}/><span>CURRENT MODEL CONDITIONS</span><button aria-label="Refresh current conditions" onClick={p.onRefresh}>Refresh</button></div>{p.conditions?<><p><strong>{p.conditions.cloudCover.toFixed(0)}%</strong> cloud cover{p.conditions.temperature!==null&&<span>{p.conditions.temperature.toFixed(0)}°C</span>}</p><small><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · {zonedClock(p.conditions.time,p.timeZone).time}{!p.weatherFresh?' · stale':''}</small><Toggle label="Use current model cloud coverage" checked={p.useClouds} disabled={!p.nowMode||!p.weatherFresh} onChange={p.onUseClouds}/><p className="weather-caveat">{!p.nowMode?'Current weather is excluded from this time preview.':'Coverage is model data; cloud shape and opacity are illustrative.'}</p></>:<p className="weather-caveat" role="status">{p.weatherStatus}</p>}</details>
    <div className="observatory-panel-footer"><button onClick={p.onReset}>Reset lighting & view</button><button onClick={p.onEvidence}><BookOpen size={13}/> Evidence</button></div>
  </aside>;
}
