import { describe,expect,it } from 'vitest';
import fs from 'node:fs';
import { DEFAULT_FILTERS,DEFAULT_NIGHT_LIGHTING,deriveNightLighting,normalizeFilters,normalizeLighting,starDisplayContrast } from '../src/lib/skyAppearance';
import { buildingHeight,containsOrigin,parseLocalHorizon,projectFace } from '../src/lib/horizon';
import { blockedByBuilding } from '../src/lib/horizonRenderer';
import { studyContrast,interventionStudy } from '../src/lib/intervention';
import { calculateSky,LOCATIONS } from '../src/lib/astronomy';
import { DEFAULT_CAMERA,type ImmersiveSkyProps } from '../src/lib/skyView';

describe('recurring observing-night schedule',()=>{
  const scheduled={...DEFAULT_NIGHT_LIGHTING,scheduleEnabled:true};
  it('switches exactly at midnight and stays active until 06:00',()=>{
    expect(deriveNightLighting(scheduled,1439,90).scheduleActive).toBe(false);
    expect(deriveNightLighting(scheduled,0,90).scheduleActive).toBe(true);
    expect(deriveNightLighting(scheduled,359,90).scheduleActive).toBe(true);
    expect(deriveNightLighting(scheduled,360,90).scheduleActive).toBe(false);
    expect(deriveNightLighting(scheduled,1000,90).scheduleActive).toBe(false);
    expect(deriveNightLighting(scheduled,1080,90).scheduleActive).toBe(false);
  });
  it('handles an evening start, a later next-day start and backward scrubbing',()=>{
    expect(deriveNightLighting({...scheduled,scheduleStart:1200},1199,85).scheduleActive).toBe(false);
    expect(deriveNightLighting({...scheduled,scheduleStart:1200},1200,85).scheduleActive).toBe(true);
    expect(deriveNightLighting({...scheduled,scheduleStart:1500},59,85).scheduleActive).toBe(false);
    expect(deriveNightLighting({...scheduled,scheduleStart:1500},60,85).scheduleActive).toBe(true);
    expect(deriveNightLighting(scheduled,1439,85).participatingOutput).toBe(1);
  });
  it('keeps output, participation and uncalibrated appearance distinct',()=>{
    const view=deriveNightLighting(scheduled,0,85);
    expect(view.participatingOutput).toBe(.5);
    expect(view.aggregateFixtureOutput).toBeCloseTo(.65);
    expect(view.effectiveArtificialLight).not.toBe(85*.5);
    expect(deriveNightLighting({...scheduled,participatingFixturePercent:0},0,85).effectiveArtificialLight).toBe(85);
    expect(deriveNightLighting({...scheduled,selectedSourceSharePercent:0},0,85).effectiveArtificialLight).toBe(85);
    expect(deriveNightLighting(scheduled,0,0).effectiveArtificialLight).toBe(0);
  });
  it('returns independent defaults and deterministic normalized state',()=>{
    const changed={...DEFAULT_NIGHT_LIGHTING,dimmingPercent:200};
    expect(normalizeLighting(changed).dimmingPercent).toBe(100);
    expect(DEFAULT_NIGHT_LIGHTING.dimmingPercent).toBe(50);
    expect(deriveNightLighting(scheduled,5,85)).toEqual(deriveNightLighting(scheduled,5,85));
    expect(()=>normalizeFilters({...DEFAULT_FILTERS,hazePercent:NaN})).toThrow();
  });
});

describe('coherent relative display contrast',()=>{
  const context={artificialLight:0,sunAltitude:-30,moonInfluence:0,filters:{...DEFAULT_FILTERS,glarePercent:0},cloudCover:0,fixtureGlare:1};
  it('suppresses the stellar field at maximum glare in both visual treatments',()=>{
    for(const viewStyle of ['natural','survey'] as const)for(const magnitude of [-4,0,3,5.8])expect(starDisplayContrast(magnitude,40,{...context,artificialLight:100,filters:{...context.filters,viewStyle}})).toBe(0);
  });
  it('does not reveal night stars in daylight or through an opaque overcast layer',()=>{
    expect(starDisplayContrast(0,45,{...context,sunAltitude:30})).toBe(0);
    expect(starDisplayContrast(0,45,{...context,cloudCover:100,filters:{...context.filters,cloudOpacityPercent:100}})).toBe(0);
  });
  it('gives fainter, lower, hazier and moonlit stars less display contrast',()=>{
    const alpha=starDisplayContrast(3,45,context);
    expect(starDisplayContrast(5,45,context)).toBeLessThan(alpha);
    expect(starDisplayContrast(3,4,context)).toBeLessThan(alpha);
    expect(starDisplayContrast(3,45,{...context,filters:{...context.filters,hazePercent:90}})).toBeLessThan(alpha);
    expect(starDisplayContrast(3,45,{...context,moonInfluence:.8})).toBeLessThan(alpha);
  });
});

describe('mapped horizon geometry',()=>{
  it('distinguishes tagged, floor-count and assumed heights including feet',()=>{
    expect(buildingHeight({height:'20 m'})).toEqual({height:20,source:'tagged'});
    expect(buildingHeight({height:'100 FT'}).height).toBeCloseTo(30.48);
    expect(buildingHeight({'building:levels':'3'})).toEqual({height:10.5,source:'levels'});
    expect(buildingHeight({building:'house'}).source).toBe('assumed');
  });
  it('omits an observer-containing footprint and retains attributed actual nearby shapes',()=>{
    expect(containsOrigin([{east:-1,north:-1},{east:1,north:-1},{east:1,north:1},{east:-1,north:1}])).toBe(true);
    const raw=JSON.parse(fs.readFileSync('public/data/horizon-penang.json','utf8'));
    const horizon=parseLocalHorizon(raw,LOCATIONS[0]);
    expect(horizon.omittedContaining).toBeGreaterThan(0);
    expect(horizon.buildings.length).toBe(180);
    expect(horizon.buildings.some(b=>b.id===268841496)).toBe(false);
    expect(horizon.buildings.every(b=>b.heightSource!=='tagged')).toBe(true);
    expect(horizon.sourceUrl).toContain('overpass');
  });
  it('projects a front facade and clips one crossing the camera near plane',()=>{
    const camera={azimuth:0,altitude:0,fieldOfView:90};
    const face=projectFace([{east:-10,north:100,up:0},{east:10,north:100,up:0},{east:10,north:100,up:10},{east:-10,north:100,up:10}],camera,1000,600);
    expect(face[0].x).toBeCloseTo(450);expect(face[2].y).toBeCloseTo(250);
    expect(projectFace([{east:-1,north:-1,up:0},{east:1,north:10,up:0},{east:1,north:10,up:4}],camera,1000,600).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))).toBe(true);
    expect(projectFace([{east:-1,north:-2,up:0},{east:1,north:-2,up:0},{east:0,north:-2,up:2}],camera,1000,600)).toEqual([]);
  });
  it('blocks objects behind a footprint while leaving higher and opposite bearings clear',()=>{
    const b={id:1,ring:[{east:-10,north:100},{east:10,north:100},{east:10,north:110},{east:-10,north:110}],height:20,heightSource:'tagged' as const,distance:100,style:0};
    const props={sky:calculateSky([],LOCATIONS[0],new Date('2026-11-15T13:00Z')),worldToGalactic:[],camera:DEFAULT_CAMERA,onCameraChange:()=>{},lightPollution:85,compareLightPollution:85,comparison:false,split:50,onSplitChange:()=>{},showLabels:true,showConstellations:true,selectedId:null,onSelect:()=>{},cloudCover:0,filters:{...DEFAULT_FILTERS,observerHeight:1.7},fixtureGlare:1,fixtureOutput:1,warmth:0,cityLightPercent:85,horizonData:{buildings:[b],sourceUrl:'',retrievedAt:'',radius:450,sourceCount:1,omittedContaining:0,inferredHeights:0,attribution:''},baselineLabel:''} satisfies ImmersiveSkyProps;
    expect(blockedByBuilding(5,0,props)).toBe(true);expect(blockedByBuilding(30,0,props)).toBe(false);expect(blockedByBuilding(5,180,props)).toBe(false);
  });
});

describe('bounded empirical intervention replay',()=>{
  it('reproduces the independently processed reference contrast',()=>{
    const replay=studyContrast(.70);
    expect(replay.percent).toBeCloseTo(interventionStudy.analysis.corrected.contrast.percentChange,9);
    expect(replay.ci95[0]).toBeCloseTo(interventionStudy.analysis.corrected.contrast.percentChangeCI95[0],9);
    expect(studyContrast(1.38).ci95).toEqual([0,0]);
  });
  it('rejects extrapolation and retains correction sensitivity',()=>{
    expect(()=>studyContrast(.5)).toThrow();expect(()=>studyContrast(NaN)).toThrow();
    expect(studyContrast(.70,false).percent).not.toBeCloseTo(studyContrast(.70,true).percent);
    expect(interventionStudy.analysis.corrected.permutation.permutations).toBe(720);
  });
});
