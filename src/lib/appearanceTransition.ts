import type {ImmersiveSkyProps} from './skyView';

/** Only display transfer values are eased. Astronomical geometry is never blended. */
export function appearanceValues(p:ImmersiveSkyProps){
  return {light:p.lightPollution,baseline:p.compareLightPollution,city:p.cityLightPercent,cloud:p.cloudCover,
    glare:p.fixtureGlare,output:p.fixtureOutput,warmth:p.warmth,haze:p.filters.hazePercent,
    fog:p.filters.fogPercent??0,nearby:p.filters.glarePercent,opacity:p.filters.cloudOpacityPercent};
}
export type AppearanceValues=ReturnType<typeof appearanceValues>;
export interface AppearanceTransition {from:AppearanceValues;to:AppearanceValues;start:number;duration:number}
export function sampleAppearance(transition:AppearanceTransition,now:number){
  const t=transition.duration===0?1:Math.max(0,Math.min(1,(now-transition.start)/transition.duration));
  const eased=t*t*(3-2*t);
  return {values:Object.fromEntries(Object.entries(transition.to).map(([key,to])=>[key,transition.from[key as keyof AppearanceValues]+(to-transition.from[key as keyof AppearanceValues])*eased])) as AppearanceValues,active:t<1};
}
export function visualProps(p:ImmersiveSkyProps,v:AppearanceValues):ImmersiveSkyProps{
  return {...p,lightPollution:v.light,compareLightPollution:v.baseline,cityLightPercent:v.city,cloudCover:v.cloud,
    fixtureGlare:v.glare,fixtureOutput:v.output,warmth:v.warmth,
    filters:{...p.filters,hazePercent:v.haze,fogPercent:v.fog,glarePercent:v.nearby,cloudOpacityPercent:v.opacity}};
}
