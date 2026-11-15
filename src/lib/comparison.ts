import type {ImmersiveSkyProps} from './skyView';
export type ComparisonMode='changes'|'clean';
export type AppearanceSnapshot=Pick<ImmersiveSkyProps,'filters'|'cloudCover'|'lightPollution'|'fixtureGlare'|'fixtureOutput'|'warmth'|'cityLightPercent'>;
export function captureAppearance(p:ImmersiveSkyProps):AppearanceSnapshot{return{filters:{...p.filters},cloudCover:p.cloudCover,lightPollution:p.lightPollution,fixtureGlare:p.fixtureGlare,fixtureOutput:p.fixtureOutput,warmth:p.warmth,cityLightPercent:p.cityLightPercent};}
export function cleanReference(p:ImmersiveSkyProps):AppearanceSnapshot{return{...captureAppearance(p),filters:{...p.filters,hazePercent:0,fogPercent:0,cloudPercent:0,glarePercent:0,moonlightEnabled:true},cloudCover:0,lightPollution:0,fixtureGlare:0,fixtureOutput:0,warmth:0,cityLightPercent:0};}
export function comparisonSides(p:ImmersiveSkyProps){
  const current=captureAppearance(p);
  const apply=(snapshot:AppearanceSnapshot):ImmersiveSkyProps=>({...p,...snapshot,filters:{...snapshot.filters,horizon:p.filters.horizon,observerHeight:p.filters.observerHeight},comparison:false});
  return{before:apply(p.comparisonMode==='changes'?(p.comparisonBefore??current):current),after:apply(p.comparisonMode==='changes'?current:cleanReference(p))};
}
