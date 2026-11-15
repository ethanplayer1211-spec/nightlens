import type { LightColorScenario } from './scenario';

export type HorizonTheme = 'local' | 'rooftop' | 'coast' | 'meadow';
export type ViewStyle = 'natural' | 'survey';
export interface SkyFilters {
  hazePercent: number;
  cloudPercent: number;
  cloudOpacityPercent: number;
  glarePercent: number;
  moonlightEnabled: boolean;
  viewStyle: ViewStyle;
  horizon: HorizonTheme;
  observerHeight: number;
}
export interface NightLighting {
  scheduleEnabled: boolean;
  /** Minutes from the observing evening's midnight: 1440 is the next 00:00. */
  scheduleStart: number;
  dimmingPercent: number;
  participatingFixturePercent: number;
  shieldingEnabled: boolean;
  lightColorScenario: LightColorScenario;
  /** Explicit uncalibrated source-mixture assumption, not a NASA measurement. */
  selectedSourceSharePercent: number;
}
export const DEFAULT_FILTERS: Readonly<SkyFilters> = Object.freeze({ hazePercent: 18, cloudPercent: 0, cloudOpacityPercent: 85, glarePercent: 15, moonlightEnabled: true, viewStyle: 'natural', horizon: 'local', observerHeight: 14 });
export const DEFAULT_NIGHT_LIGHTING: Readonly<NightLighting> = Object.freeze({ scheduleEnabled: false, scheduleStart: 1440, dimmingPercent: 50, participatingFixturePercent: 70, shieldingEnabled: false, lightColorScenario: 'cool', selectedSourceSharePercent: 35 });
const clamp = (v: number, a = 0, b = 100) => { if (!Number.isFinite(v)) throw new RangeError('Display inputs must be finite'); return Math.max(a, Math.min(b, v)); };

export function normalizeFilters(value: SkyFilters): SkyFilters {
  if (!['local','rooftop','coast','meadow'].includes(value.horizon) || !['natural','survey'].includes(value.viewStyle) || typeof value.moonlightEnabled !== 'boolean') throw new RangeError('Unknown sky environment');
  return { ...value, hazePercent:clamp(value.hazePercent),cloudPercent:clamp(value.cloudPercent),cloudOpacityPercent:clamp(value.cloudOpacityPercent),glarePercent:clamp(value.glarePercent),observerHeight:clamp(value.observerHeight,1.7,60) };
}
export function normalizeLighting(value: NightLighting): NightLighting {
  if (typeof value.scheduleEnabled !== 'boolean' || typeof value.shieldingEnabled !== 'boolean' || !['warm','cool'].includes(value.lightColorScenario)) throw new RangeError('Unknown lighting setting');
  return {...value,scheduleStart:Math.round(clamp(value.scheduleStart,1080,1680)),dimmingPercent:clamp(value.dimmingPercent),participatingFixturePercent:clamp(value.participatingFixturePercent),selectedSourceSharePercent:clamp(value.selectedSourceSharePercent)};
}

/** Recurring 18:00–06:00 observing night; the after-midnight portion belongs to its evening. */
export function deriveNightLighting(value: NightLighting, minuteOfDay: number, artificialLight: number) {
  const lighting = normalizeLighting(value), time = clamp(minuteOfDay,0,1439);
  const nightMinute = time < 1080 ? time + 1440 : time;
  const scheduleActive = lighting.scheduleEnabled && nightMinute >= lighting.scheduleStart && nightMinute < 1800;
  const output = scheduleActive ? 1-lighting.dimmingPercent/100 : 1;
  const participation = lighting.participatingFixturePercent/100;
  const fixtureOutput = 1-participation*(1-output);
  // These optical factors and source mixture are explicitly artistic assumptions.
  // Fixture output is not a percentage reduction in real sky brightness.
  const selectedTransfer = 1-participation + participation*output*(lighting.shieldingEnabled?0.55:1)*(lighting.lightColorScenario==='warm'?0.82:1);
  const remaining = 1-lighting.selectedSourceSharePercent/100*(1-selectedTransfer);
  return { scheduleActive,nightMinute,participatingOutput:output,aggregateFixtureOutput:fixtureOutput,effectiveArtificialLight:clamp(artificialLight)*remaining,fixtureGlare:fixtureOutput*(lighting.shieldingEnabled?0.22:1),warmth:lighting.lightColorScenario==='warm'?1:0 };
}

export interface ContrastContext { artificialLight: number; sunAltitude: number; moonInfluence: number; filters: SkyFilters; cloudCover: number; fixtureGlare: number }

/** Relative display signal/background, NOT a limiting-magnitude or star-detection prediction. */
export function starDisplayContrast(magnitude: number, altitude: number, context: ContrastContext): number {
  const light = clamp(context.artificialLight)/100, haze=clamp(context.filters.hazePercent)/100;
  const night = 1-clamp((context.sunAltitude+18)/15,0,1);
  // Secant airmass approximation is bounded near the horizon. Extinction is assumed,
  // with no claim of local calibration or inference from historical NASA AOD.
  const airmass = 1/Math.max(.08,Math.sin(Math.max(0,altitude)*Math.PI/180));
  const transmission = Math.pow(10,-.4*(.1+.65*haze)*Math.max(0,airmass-1));
  const signal = Math.pow(10,-.4*magnitude)*transmission;
  const background = .0018 + .32*Math.pow(light,2.6) + .05*context.moonInfluence + .20*context.filters.glarePercent/100*context.fixtureGlare*light;
  const opaqueCloud = clamp(context.cloudCover)/100*context.filters.cloudOpacityPercent/100;
  const alpha = night*(signal/(signal+background))*Math.pow(1-opaqueCloud,3)*(1-Math.pow(light,8));
  return Math.max(0,Math.min(1,alpha*(context.filters.viewStyle==='survey'?1.2:.88)));
}

export const COMBINATIONS: {id:string;name:string;description:string;glow:number;filters:Partial<SkyFilters>;lighting:Partial<NightLighting>}[] = [
  {id:'street',name:'City street',description:'Mapped surroundings, urban haze and local glare.',glow:92,filters:{...DEFAULT_FILTERS,hazePercent:35,glarePercent:60,observerHeight:1.7},lighting:{...DEFAULT_NIGHT_LIGHTING}},
  {id:'midnight',name:'After midnight',description:'Combine a schedule, shielding and warmer nonessential fixtures.',glow:90,filters:{...DEFAULT_FILTERS,hazePercent:20,glarePercent:18},lighting:{...DEFAULT_NIGHT_LIGHTING,scheduleEnabled:true,scheduleStart:1440,dimmingPercent:70,participatingFixturePercent:95,shieldingEnabled:true,lightColorScenario:'warm',selectedSourceSharePercent:75}},
  {id:'rooftop',name:'Rooftop lookout',description:'A raised, illustrative urban viewpoint.',glow:65,filters:{...DEFAULT_FILTERS,horizon:'rooftop',observerHeight:14,hazePercent:22,glarePercent:8},lighting:{...DEFAULT_NIGHT_LIGHTING}},
  {id:'coast',name:'Open coast',description:'Illustrative water, a low horizon and less local glare.',glow:30,filters:{...DEFAULT_FILTERS,horizon:'coast',observerHeight:1.7,hazePercent:12,glarePercent:0},lighting:{...DEFAULT_NIGHT_LIGHTING}},
  {id:'field',name:'Dark-sky field',description:'Illustrative landscape with no artificial contribution.',glow:0,filters:{...DEFAULT_FILTERS,horizon:'meadow',observerHeight:1.7,hazePercent:5,glarePercent:0},lighting:{...DEFAULT_NIGHT_LIGHTING}},
  {id:'overcast',name:'Overcast city',description:'An opaque cloud layer hides the celestial field.',glow:92,filters:{...DEFAULT_FILTERS,hazePercent:55,glarePercent:35,cloudPercent:100,cloudOpacityPercent:100},lighting:{...DEFAULT_NIGHT_LIGHTING}},
];

export const LIGHTING_THEMES = [
  {id:'city',title:'Busy city',subtitle:'Stronger artificial skyglow',value:85},
  {id:'suburb',title:'Quiet neighbourhood',subtitle:'A softer lighting scenario',value:48},
  {id:'rural',title:'Rural night',subtitle:'Less artificial contribution',value:18},
  {id:'natural',title:'No artificial light',subtitle:'Sun and Moon stay in the sky',value:0},
];
