import {COMBINATIONS,DEFAULT_NIGHT_LIGHTING,normalizeLighting} from './skyAppearance';
export type QuickLook='city'|'future'|'responsible'|'midnight'|'natural';
/** Lighting-only presets. Atmospheric conditions and astronomy belong to their own state. */
export function quickLightingLook(id:QuickLook){
  if(!['city','future','responsible','midnight','natural'].includes(id))throw new RangeError('Unknown lighting look');
  return {glow:id==='natural'?0:id==='future'?100:id==='midnight'||id==='responsible'?90:85,
    lighting:normalizeLighting({...DEFAULT_NIGHT_LIGHTING,...(id==='midnight'||id==='responsible'?COMBINATIONS.find(c=>c.id==='midnight')!.lighting:{})})};
}
