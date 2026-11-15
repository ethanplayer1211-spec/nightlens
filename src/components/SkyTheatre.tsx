import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Columns2, Maximize2, Minus, Plus, RotateCcw } from 'lucide-react';
import { ASTERISMS, cardinal } from '../lib/astronomy';
import { starDisplayContrast } from '../lib/skyAppearance';
import { blockedByBuilding, drawSurroundings } from '../lib/horizonRenderer';
import { createSkyGPU, type SkyGPU } from '../lib/skyShader';
import { DEFAULT_CAMERA, normalizeCamera, projectPerspective, type ImmersiveSkyProps } from '../lib/skyView';
import '../sky-theatre.css';

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
function color(index?: number | null) { return index !== null && index !== undefined && index > 1 ? '#f1cda2' : index !== null && index !== undefined && index < 0 ? '#bbd6ff' : '#edf1f2'; }

export default function SkyTheatre(props: ImmersiveSkyProps) {
  const frame = useRef<HTMLDivElement>(null), background = useRef<HTMLCanvasElement>(null), foreground = useRef<HTMLCanvasElement>(null);
  const current = useRef(props); current.current = props;
  const gpu = useRef<SkyGPU | null>(null);
  const dimensions = useRef({ width: 1, height: 1, dpr: 1 });
  const [fallback, setFallback] = useState(false), [imageFailed, setImageFailed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false), [fullscreenError, setFullscreenError] = useState('');
  const projected = useRef<{ id: string; x: number; y: number; name: string }[]>([]);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ x: 0, y: 0, az: 0, alt: 0, moved: false, pinch: 0, fov: 0 });

  const render = useCallback(() => {
    const p = current.current, { width: w, height: h, dpr } = dimensions.current;
    const canvas = foreground.current, ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    gpu.current?.draw(p, Math.round(w * dpr), Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const daylight = clamp((p.sky.sunAltitude + 12) / 16);
    const darkness = 1 - clamp((p.sky.sunAltitude + 16) / 13);
    const naturalMoon = (p.filters.moonlightEnabled ? 1 : 0) * Math.max(0, Math.sin(p.sky.moonAltitude * Math.PI / 180)) * p.sky.moonIllumination;
    if (!gpu.current) {
      for (let side = 0; side < (p.comparison ? 2 : 1); side++) {
        const x = side === 0 ? 0 : w * p.split / 100, width = p.comparison ? side === 0 ? w * p.split / 100 : w - x : w;
        const glow = (p.comparison && side === 0 ? p.compareLightPollution : p.lightPollution) / 100;
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, `rgb(${Math.round(4 + daylight * 42 + glow * 16)},${Math.round(8 + daylight * 81 + glow * 10)},${Math.round(17 + daylight * 132)})`);
        gradient.addColorStop(1, `rgb(${Math.round(10 + daylight * 95 + glow * 70)},${Math.round(16 + daylight * 120 + glow * 42)},${Math.round(23 + daylight * 135 + glow * 20)})`);
        ctx.fillStyle = gradient; ctx.fillRect(x, 0, width, h);
      }
    }
    const points = p.sky.objects.map(object => ({ ...object, projected: projectPerspective(object.altitude, object.azimuth, p.camera, w, h) })).filter(object => object.projected?.visible);
    const contrastFor = (o: typeof points[number]) => o.kind === 'moon' ? Math.pow(1-p.cloudCover/100*p.filters.cloudOpacityPercent/100,3) : starDisplayContrast(o.magnitude,o.altitude,{artificialLight:p.comparison && o.projected!.x < w*p.split/100 ? p.compareLightPollution : p.lightPollution,sunAltitude:p.sky.sunAltitude,moonInfluence:naturalMoon,filters:p.filters,cloudCover:p.cloudCover,fixtureGlare:p.comparison && o.projected!.x < w*p.split/100 ? 1 : p.fixtureGlare});
    const contrasts = new Map(points.map(o=>[o.id,contrastFor(o)]));
    projected.current = points.filter(o => o.name && (contrasts.get(o.id)??0)>.12 && !blockedByBuilding(o.altitude,o.azimuth,p)).map(o => ({ id: o.id, x: o.projected!.x, y: o.projected!.y, name: o.name }));
    const hips = new Map(points.filter(o => o.hip && (contrasts.get(o.id)??0)>.16).map(o => [o.hip, o]));
    if (p.showConstellations) {
      ctx.strokeStyle = `rgba(150,184,197,${0.19 * (1 - daylight)})`; ctx.lineWidth = 0.65;
      for (const pattern of ASTERISMS) for (let i = 1; i < pattern.hips.length; i++) {
        const a = hips.get(pattern.hips[i - 1])?.projected, b = hips.get(pattern.hips[i])?.projected;
        if (a && b && Math.hypot(a.x - b.x, a.y - b.y) < w * 0.5) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
    }
    for (const o of points) {
      const { x, y } = o.projected!;
      const contrast = contrasts.get(o.id)??0;
      if(contrast<.008)continue;
      if (o.kind === 'moon') {
        const radius = 7.5;
        ctx.save(); ctx.globalAlpha=contrast; ctx.translate(x, y);
        const rad = Math.PI / 180;
        const vector = (alt: number, az: number) => [Math.cos(alt*rad)*Math.sin(az*rad),Math.sin(alt*rad),Math.cos(alt*rad)*Math.cos(az*rad)];
        const m = vector(o.altitude,o.azimuth), s = vector(p.sky.sunAltitude,p.sky.sunAzimuth);
        const dot = m.reduce((sum,v,i)=>sum+v*s[i],0);
        const near = m.map((v,i)=>v+0.001*(s[i]-dot*v));
        const length = Math.hypot(...near);
        const sunward = projectPerspective(Math.asin(near[1]/length)/rad,Math.atan2(near[0],near[2])/rad,p.camera,w,h);
        if (sunward) ctx.rotate(Math.atan2(sunward.y-y,sunward.x-x));
        ctx.fillStyle = '#17212e'; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
        ctx.shadowColor = '#d6e4e9'; ctx.shadowBlur = p.sky.moonIllumination * (1 - daylight) * 17;
        ctx.fillStyle = '#e7e9df'; ctx.beginPath();
        for (let i = 0; i <= 40; i++) { const a = -Math.PI / 2 + i / 40 * Math.PI; const xx = Math.cos(a) * radius, yy = Math.sin(a) * radius; if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
        const k = 2 * p.sky.moonIllumination - 1;
        for (let i = 40; i >= 0; i--) { const a = -Math.PI / 2 + i / 40 * Math.PI; ctx.lineTo(-k * Math.cos(a) * radius, Math.sin(a) * radius); }
        ctx.closePath(); ctx.fill(); ctx.restore(); continue;
      }
      if (contrast < 0.008) continue;
      const radius = o.kind === 'planet' ? Math.max(1.2, 2.15 - o.magnitude * 0.17) : Math.max(0.36, 1.75 - o.magnitude * 0.22);
      ctx.globalAlpha = clamp(contrast * (1.1 - Math.max(0, o.magnitude) * 0.07));
      ctx.fillStyle = o.kind === 'planet' ? '#f0dec4' : color(o.colorIndex);
      if (o.magnitude < 1) { ctx.shadowBlur = 5 + Math.max(0, 1 - o.magnitude) * 1.5; ctx.shadowColor = ctx.fillStyle; }
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      if (o.magnitude < 0) { ctx.globalAlpha *= 0.45; ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x - radius * 3, y); ctx.lineTo(x + radius * 3, y); ctx.moveTo(x, y - radius * 3); ctx.lineTo(x, y + radius * 3); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    const sun = projectPerspective(p.sky.sunAltitude, p.sky.sunAzimuth, p.camera, w, h);
    if (sun?.visible && p.sky.sunAltitude >= 0) {
      ctx.save();ctx.globalAlpha=Math.pow(1-p.cloudCover/100*p.filters.cloudOpacityPercent/100,2);
      const glow = ctx.createRadialGradient(sun.x, sun.y, 1, sun.x, sun.y, 70); glow.addColorStop(0, '#fff8de'); glow.addColorStop(0.09, '#fff2c5ee'); glow.addColorStop(0.25, '#ffefbd55'); glow.addColorStop(1, '#fff0b000'); ctx.fillStyle = glow; ctx.fillRect(sun.x - 70, sun.y - 70, 140, 140);ctx.restore();
    }
    if (p.showLabels) {
      const occupied: { x: number; y: number; w: number }[] = [];
      const labels = points.filter(o => o.name && (contrasts.get(o.id)??0)>.16 && !blockedByBuilding(o.altitude,o.azimuth,p) && (o.kind !== 'star' || o.magnitude < 2.1) && (darkness > 0.08 || o.kind === 'moon')).sort((a, b) => a.magnitude - b.magnitude).slice(0, 18);
      ctx.font = '10px "DM Sans",Arial,sans-serif'; ctx.textBaseline = 'middle';
      for (const object of labels) {
        const x = object.projected!.x + 10, y = object.projected!.y - 10, width = ctx.measureText(object.name).width;
        if (x + width > w - 18 || y < 50 || y > h - 75 || occupied.some(r => Math.abs(r.y - y) < 18 && x < r.x + r.w + 8 && x + width + 8 > r.x)) continue;
        occupied.push({ x, y, w: width }); ctx.fillStyle = object.kind === 'star' ? 'rgba(196,212,224,.72)' : '#dfc699'; ctx.shadowColor = '#04080f'; ctx.shadowBlur = 4; ctx.fillText(object.name, x, y); ctx.shadowBlur = 0;
      }
    }
    const selected = points.find(o => o.id === p.selectedId && (contrasts.get(o.id)??0)>.1 && !blockedByBuilding(o.altitude,o.azimuth,p));
    if (selected) { const { x, y } = selected.projected!; ctx.strokeStyle = '#d5b783'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.moveTo(x - 19, y); ctx.lineTo(x - 9, y); ctx.moveTo(x + 9, y); ctx.lineTo(x + 19, y); ctx.moveTo(x, y - 19); ctx.lineTo(x, y - 9); ctx.moveTo(x, y + 9); ctx.lineTo(x, y + 19); ctx.stroke(); }
    if(p.comparison){
      const divider=w*p.split/100;
      ctx.save();ctx.beginPath();ctx.rect(0,0,divider,h);ctx.clip();drawSurroundings(ctx,{...p,cityLightPercent:p.compareLightPollution},w,h);ctx.restore();
      ctx.save();ctx.beginPath();ctx.rect(divider,0,w-divider,h);ctx.clip();drawSurroundings(ctx,p,w,h);ctx.restore();
    }else drawSurroundings(ctx,p,w,h);
    // Compass labels follow the projected geometric horizon, including camera pitch.
    ctx.font = '9px "DM Mono",monospace'; ctx.textAlign = 'center';
    for (let az = 0; az < 360; az += 15) {
      const horizon = projectPerspective(0,az,p.camera,w,h);
      if (!horizon?.visible || horizon.y < 60 || horizon.y > h - 55) continue;
      ctx.strokeStyle = '#6b849188'; ctx.beginPath(); ctx.moveTo(horizon.x,horizon.y);ctx.lineTo(horizon.x,horizon.y+(az%45===0?8:4));ctx.stroke();
      if (az % 45 === 0) { ctx.fillStyle = az % 90 === 0 ? '#c8b28e' : '#7c929f'; ctx.fillText(cardinal(az),horizon.x,horizon.y+20); }
    }
    ctx.textAlign = 'left';
  }, []);

  useEffect(() => {
    const element = frame.current, bg = background.current, fg = foreground.current;
    if (!element || !bg || !fg) return;
    gpu.current = createSkyGPU(bg, render, () => { setImageFailed(true); render(); });
    setFallback(!gpu.current);
    const resize = () => { const bounds = element.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1); dimensions.current = { width: bounds.width, height: bounds.height, dpr }; bg.width = fg.width = Math.round(bounds.width * dpr); bg.height = fg.height = Math.round(bounds.height * dpr); render(); };
    const observer = new ResizeObserver(resize); observer.observe(element); resize();
    const onLost = (event: Event) => { event.preventDefault(); gpu.current?.destroy(); gpu.current = null; setFallback(true); render(); };
    bg.addEventListener('webglcontextlost', onLost);
    const onFullscreen = () => setFullscreen(document.fullscreenElement === element);
    document.addEventListener('fullscreenchange', onFullscreen);
    const wheel = (event: WheelEvent) => { event.preventDefault(); const p = current.current; p.onCameraChange(normalizeCamera({ ...p.camera, fieldOfView: p.camera.fieldOfView + Math.sign(event.deltaY) * 5 })); };
    fg.addEventListener('wheel', wheel, { passive: false });
    return () => { observer.disconnect(); gpu.current?.destroy(); gpu.current = null; fg.removeEventListener('wheel', wheel); bg.removeEventListener('webglcontextlost', onLost); document.removeEventListener('fullscreenchange', onFullscreen); };
  }, [render]);
  useEffect(render, [props, render]);

  const pan = (az: number, alt: number) => props.onCameraChange(normalizeCamera({ ...props.camera, azimuth: props.camera.azimuth + az, altitude: props.camera.altitude + alt }));
  const zoom = (amount: number) => props.onCameraChange(normalizeCamera({ ...props.camera, fieldOfView: props.camera.fieldOfView + amount }));
  const splitPointer = (event: React.PointerEvent<HTMLDivElement>) => { const bounds = frame.current?.getBoundingClientRect(); if (bounds) props.onSplitChange(Math.round(clamp((event.clientX - bounds.left) / bounds.width, 0.04, 0.96) * 100)); };
  const mode = props.sky.sunAltitude >= 0 ? 'DAYLIGHT' : props.sky.sunAltitude > -18 ? 'TWILIGHT' : 'ASTRONOMICAL NIGHT';

  return <div className="theatre-frame" ref={frame} data-testid="sky-theatre" data-sun-altitude={props.sky.sunAltitude.toFixed(4)}>
    <canvas ref={background} className="theatre-background" aria-hidden="true" />
    <canvas ref={foreground} className="theatre-canvas" tabIndex={0} role="img" aria-label="Perspective sky. Drag to look around, use arrow keys to pan, and plus or minus to zoom. Astronomical positions are calculated, appearance is simulated."
      onKeyDown={event => { const keys: Record<string, () => void> = { ArrowLeft: () => pan(-10, 0), ArrowRight: () => pan(10, 0), ArrowUp: () => pan(0, 7), ArrowDown: () => pan(0, -7), '+': () => zoom(-10), '=': () => zoom(-10), '-': () => zoom(10), Home: () => props.onCameraChange(DEFAULT_CAMERA) }; if (keys[event.key]) { event.preventDefault(); keys[event.key](); } }}
      onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY }); if (pointers.current.size === 1) gesture.current = { x: event.clientX, y: event.clientY, az: props.camera.azimuth, alt: props.camera.altitude, moved: false, pinch: 0, fov: props.camera.fieldOfView }; if (pointers.current.size === 2) { const [a,b] = [...pointers.current.values()]; gesture.current.pinch = Math.hypot(a.x-b.x,a.y-b.y); gesture.current.fov = props.camera.fieldOfView; gesture.current.moved = true; } }}
      onPointerMove={event => { if (!pointers.current.has(event.pointerId)) return; pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY }); const g = gesture.current; if (pointers.current.size === 2 && g.pinch) { const [a,b] = [...pointers.current.values()]; props.onCameraChange(normalizeCamera({ ...props.camera, fieldOfView: g.fov * g.pinch / Math.max(10, Math.hypot(a.x-b.x,a.y-b.y)) })); return; } if (pointers.current.size !== 1 || g.pinch) return; const dx = event.clientX-g.x, dy = event.clientY-g.y; if (Math.hypot(dx,dy)>4) g.moved=true; props.onCameraChange(normalizeCamera({ ...props.camera, azimuth: g.az-dx/dimensions.current.width*props.camera.fieldOfView, altitude: g.alt+dy/dimensions.current.width*props.camera.fieldOfView })); }}
      onPointerUp={event => { const g = gesture.current; pointers.current.delete(event.pointerId); const remaining = [...pointers.current.values()][0]; if (remaining) gesture.current = { ...remaining, az: props.camera.azimuth, alt: props.camera.altitude, moved: true, pinch: 0, fov: props.camera.fieldOfView }; if (!g.moved && !g.pinch) { const bounds = event.currentTarget.getBoundingClientRect(); const x = event.clientX-bounds.left, y = event.clientY-bounds.top; const nearest = [...projected.current].sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0]; if (nearest && Math.hypot(nearest.x-x,nearest.y-y)<25) props.onSelect(nearest.id); } }}
      onPointerCancel={() => pointers.current.clear()} />
    <div className="theatre-top"><div className="theatre-state"><i className={mode === 'DAYLIGHT' ? 'theatre-day-dot' : ''} /><span>{mode}</span></div><span className="theatre-appearance">SIMULATED APPEARANCE</span></div>
    {props.comparison && <><div className="theatre-compare-label theatre-before">{props.baselineLabel}</div><div className="theatre-compare-label theatre-after">SELECTED LIGHTING</div><div className="theatre-divider" style={{ left: `${props.split}%` }} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); splitPointer(e); }} onPointerMove={e => { if (e.buttons) splitPointer(e); }}><span><Columns2 size={16} /></span></div></>}
    <div className="theatre-view-meta"><span>{cardinal(props.camera.azimuth)} {props.camera.azimuth.toFixed(0)}°</span><span>ALT {props.camera.altitude.toFixed(0)}°</span><span>FOV {props.camera.fieldOfView.toFixed(0)}°</span></div>
    <div className="theatre-camera-tools" aria-label="Sky camera controls"><button aria-label="Look left" onClick={() => pan(-15,0)}><ChevronLeft size={16} /></button><button aria-label="Look up" onClick={() => pan(0,10)}><ChevronUp size={16} /></button><button aria-label="Look down" onClick={() => pan(0,-10)}><ChevronDown size={16} /></button><button aria-label="Look right" onClick={() => pan(15,0)}><ChevronRight size={16} /></button><span /><button aria-label="Zoom sky out" onClick={() => zoom(10)} disabled={props.camera.fieldOfView>=125}><Minus size={16} /></button><button aria-label="Zoom sky in" onClick={() => zoom(-10)} disabled={props.camera.fieldOfView<=35}><Plus size={16} /></button><button aria-label="Reset sky camera" onClick={() => props.onCameraChange(DEFAULT_CAMERA)}><RotateCcw size={14} /></button>{document.fullscreenEnabled && <button aria-label={fullscreen?'Exit full screen sky':'Full screen sky'} onClick={() => { setFullscreenError(''); const request = document.fullscreenElement ? document.exitFullscreen() : frame.current?.requestFullscreen(); void request?.catch(() => setFullscreenError('Full screen is unavailable in this browser.'));  }}><Maximize2 size={14} /></button>}</div>
    {fullscreenError && <span className="theatre-camera-message" role="status">{fullscreenError}</span>}<div className="theatre-centre-reticle" aria-hidden="true"><span /><span /></div>
    <div className="theatre-horizon-caption">{props.filters.horizon==='local'&&props.horizonData?'MAPPED BUILDINGS · ESTIMATED HEIGHTS':props.filters.horizon==='local'?'ILLUSTRATIVE SKYLINE · MAP UNAVAILABLE':props.filters.horizon==='rooftop'?'ILLUSTRATIVE ROOFTOP':props.filters.horizon==='coast'?'ILLUSTRATIVE COAST':'ILLUSTRATIVE FIELD'}</div>
    <div className="theatre-source-credit">{fallback ? 'STAR CATALOG MODE · WEBGL UNAVAILABLE' : imageFailed ? 'SURVEY IMAGE UNAVAILABLE · CATALOG POSITIONS PRESERVED' : 'ESA/Gaia/DPAC · SURVEY BACKGROUND'}<small>DRAG TO LOOK AROUND · SCROLL / PINCH TO ZOOM</small></div>
    {props.comparison && <label className="theatre-compare-access">Compare lighting <input type="range" min="4" max="96" value={props.split} aria-label="Immersive sky comparison divider" onChange={e => props.onSplitChange(Number(e.target.value))} /></label>}
  </div>;
}
