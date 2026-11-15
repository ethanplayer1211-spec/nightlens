import {useRef} from 'react';
import {DEFAULT_FILTERS,type SkyFilters} from '../lib/skyAppearance';

function Effect({name,description,value,restore,onChange}:{name:string;description:string;value:number;restore:number;onChange:(value:number)=>void}){
  const last=useRef(restore);if(value>0)last.current=value;
  return <div className="environment-effect"><label className="environment-effect-title"><input type="checkbox" aria-label={`${name} effect`} checked={value>0} onChange={e=>onChange(e.target.checked?last.current:0)}/><strong>{name}</strong><span>{value>0?'On':'Off'}</span></label><p>{description}</p><label className="environment-range"><span>Strength</span><input type="range" min="0" max="100" value={value} aria-label={`${name} strength`} onChange={e=>onChange(Number(e.target.value))}/><output>{value}</output></label></div>;
}
export default function EnvironmentControls(p:{filters:SkyFilters;glow:number;onGlow:(v:number)=>void;onFilters:(patch:Partial<SkyFilters>)=>void;onSelectedClouds:()=>void;onReset:()=>void;cloudCover:number;daylight:boolean}){
  const air=(patch:Partial<SkyFilters>)=>{p.onSelectedClouds();p.onFilters(patch);};
  return <div className="environment-controls"><p className="panel-intro">Change the air around the same calculated sky. Each control changes the view immediately.</p>
    <div className="environment-presets" role="group" aria-label="Atmosphere examples"><button onClick={()=>air({hazePercent:0,fogPercent:0,cloudPercent:0,glarePercent:0})}>Clear air</button><button onClick={()=>air({hazePercent:90,fogPercent:0,cloudPercent:0})}>Hazy</button><button onClick={()=>air({hazePercent:20,fogPercent:90,cloudPercent:0})}>Foggy</button><button onClick={()=>air({hazePercent:20,fogPercent:0,cloudPercent:100,cloudOpacityPercent:100})}>Overcast</button></div>
    <Effect name="Artificial light" description="Brightens the background and reduces faint-star contrast." value={p.glow} restore={85} onChange={p.onGlow}/>
    <Effect name="Haze" description="Washes out the sky, strongest near the horizon." value={p.filters.hazePercent} restore={70} onChange={hazePercent=>air({hazePercent})}/>
    <Effect name="Fog" description="Veils the sky and obscures distant city structures." value={p.filters.fogPercent} restore={75} onChange={fogPercent=>air({fogPercent})}/>
    <Effect name="Clouds" description="Covers the sky. Overcast can hide the entire stellar field." value={p.cloudCover} restore={85} onChange={cloudPercent=>air({cloudPercent,cloudOpacityPercent:100})}/>
    <Effect name="Nearby glare" description="Adds local light spill; visible when artificial light is present." value={p.filters.glarePercent} restore={70} onChange={glarePercent=>air({glarePercent})}/>
    {p.daylight&&<p className="panel-warning">It is daylight or twilight here. Removing artificial light cannot remove the Sun; choose Tonight in Place & time.</p>}
    <p className="panel-footnote">Appearance is illustrative. These are selected conditions, not a weather forecast or NASA measurement. Compare can hold Before steady or show a clear-sky reference.</p>
    <button className="panel-text-action" onClick={()=>{p.onSelectedClouds();p.onFilters({hazePercent:DEFAULT_FILTERS.hazePercent,fogPercent:0,cloudPercent:0,cloudOpacityPercent:85,glarePercent:15});p.onReset();}}>Reset environment</button>
  </div>;
}
