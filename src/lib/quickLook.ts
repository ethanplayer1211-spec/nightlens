import {COMBINATIONS,DEFAULT_NIGHT_LIGHTING,normalizeLighting} from './skyAppearance';
export type QuickLook='city'|'midnight'|'natural';
/** Lighting-only presets. Atmospheric conditions and astronomy belong to their own state. */
export function quickLightingLook(id:QuickLook){
  if(!['city','midnight','natural'].includes(id))throw new RangeError('Unknown lighting look');
  return {glow:id==='natural'?0:id==='midnight'?90:85,
    lighting:normalizeLighting({...DEFAULT_NIGHT_LIGHTING,...(id==='midnight'?COMBINATIONS.find(c=>c.id==='midnight')!.lighting:{})})};
}
