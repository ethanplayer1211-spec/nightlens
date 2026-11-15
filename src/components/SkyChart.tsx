import { useId, useState } from 'react';
import { Columns2, Minus, Plus } from 'lucide-react';
import { ASTERISMS, type SkyCalculation, type SkyObject } from '../lib/astronomy';
import type { CityScenario } from '../lib/scenario';
import { deriveVisualState } from '../lib/scenario';

interface Props {
  sky: SkyCalculation; scenario: CityScenario; comparison: boolean;
  split: number; onSplit: (value: number) => void;
  grid: boolean; constellations: boolean; selected: string | null;
  onSelect: (object: SkyObject) => void;
  haze: number; cloud: number; moonlight: boolean;
}

function starColor(ci?: number | null) {
  return ci !== undefined && ci !== null && ci > 0.9 ? '#d9c8a9' : ci !== undefined && ci !== null && ci < 0 ? '#b9cedb' : '#e0e4df';
}

export default function SkyChart({ sky, scenario, comparison, split, onSplit, grid, constellations, selected, onSelect, haze, cloud, moonlight }: Props) {
  const id = useId().replace(/:/g, '');
  const [zoom, setZoom] = useState(1);
  const visual = deriveVisualState(scenario);
  const hips = new Map(sky.objects.filter(o => o.hip).map(o => [o.hip, o]));
  const daylight = Math.max(0, Math.min(1, (sky.sunAltitude + 18) / 24));
  const moonGlow = moonlight && sky.moonAltitude > 0 ? sky.moonIllumination * Math.sin(sky.moonAltitude * Math.PI / 180) * 0.22 : 0;
  const selectedObject = sky.objects.find(o => o.id === selected);
  const namedObjects = sky.objects.filter(o => o.name && (o.kind !== 'star' || o.magnitude < 2.15) && o.altitude > 7);

  const layer = (after: boolean) => {
    const glow = (after ? visual.illustrativeGlow : 1);
    const opacity = Math.min(0.9, 0.22 + glow * 0.36 + haze / 100 * 0.18 + cloud / 100 * 0.13 + moonGlow);
    return <g data-sky-layer={after ? 'experiment' : 'baseline'} data-glow={glow.toFixed(4)}>
      <circle cx="420" cy="390" r="340" fill="#0a131e" />
      <circle cx="420" cy="390" r="340" fill={`url(#${id}-${after ? 'after' : 'before'})`} opacity={opacity} />
      <circle cx="420" cy="390" r="340" fill="#7e9eac" opacity={daylight * 0.63} />
      <g transform={`translate(420 390) scale(${zoom}) translate(-420 -390)`}>
        {constellations && <g stroke="#83b8be" strokeWidth="0.7" opacity="0.35" fill="none">
          {ASTERISMS.flatMap((asterism, n) => asterism.hips.slice(1).map((hip, i) => {
            const a = hips.get(asterism.hips[i]), b = hips.get(hip);
            return a && b ? <line key={`${n}-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} /> : null;
          }))}
        </g>}
        {sky.objects.map(o => {
          const brightness = o.kind === 'star' ? Math.max(0.035, Math.min(1, (1.16 - o.magnitude * 0.115) * (1 - (glow - 0.24) * Math.max(0, o.magnitude) * 0.11) * (1 - haze / 160) * (1 - cloud / 110) * (1 - daylight * 0.97) * (1 - moonGlow))) : 1 - daylight * 0.65;
          const r = o.kind === 'moon' ? 7 : o.kind === 'planet' ? 2.8 : Math.max(0.45, 2.05 - o.magnitude * 0.27);
          return <g key={o.id} opacity={brightness}>
            {o.magnitude < 0.5 && o.kind === 'star' && <path d={`M${o.x - 4} ${o.y}h8M${o.x} ${o.y - 4}v8`} stroke={starColor(o.colorIndex)} strokeWidth="0.45" opacity="0.65" />}
            <circle cx={o.x} cy={o.y} r={r} fill={o.kind === 'planet' ? '#c7a475' : o.kind === 'moon' ? '#ece8db' : starColor(o.colorIndex)} />
            {o.kind === 'moon' && <circle cx={o.x + 4 * sky.moonIllumination} cy={o.y} r={6.7 * (1 - sky.moonIllumination)} fill="#172331" />}
          </g>;
        })}
        {namedObjects.map(o => <text key={o.id} x={o.x + 9} y={o.y - 8} fill={o.kind === 'star' ? '#acb6be' : '#d1b589'} className="sky-object-label">{o.name}</text>)}
        {selectedObject && <g className="selected-reticle" transform={`translate(${selectedObject.x} ${selectedObject.y})`} fill="none" stroke="#c7a475" strokeWidth="0.8"><circle r="12" /><path d="M-17 0h7M10 0h7M0 -17v7M0 10v7" /></g>}
      </g>
    </g>;
  };

  const setFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    onSplit(Math.max(4, Math.min(96, (event.clientX - bounds.left) / bounds.width * 100)));
  };

  return <div className="sky-instrument" data-testid="sky-instrument">
    <div className="sky-overline"><span><i /> {comparison ? 'SAME SKY · TWO LIGHTING SCENARIOS' : 'CALCULATED ASTRONOMICAL POSITIONS'}</span><span>PLATE 01</span></div>
    <div className="sky-canvas" data-testid="sky-canvas">
      <svg className="celestial-chart" viewBox="0 0 840 780" role="img" aria-label={`Calculated sky, ${sky.objects.filter(o => o.kind === 'planet').length} selected planets above the geometric horizon. Lighting and star contrast are illustrative.`}>
        <defs>
          <radialGradient id={`${id}-before`} cx="48%" cy="36%" r="70%"><stop offset="0%" stopColor="#0b1524" stopOpacity="0" /><stop offset="62%" stopColor="#4d5358" stopOpacity="0.34" /><stop offset="100%" stopColor="#a78a64" stopOpacity="0.85" /></radialGradient>
          <radialGradient id={`${id}-after`} cx="48%" cy="36%" r="70%"><stop offset="0%" stopColor="#0b1524" stopOpacity="0" /><stop offset="62%" stopColor={visual.warmth ? '#665548' : '#4d5358'} stopOpacity="0.34" /><stop offset="100%" stopColor={visual.warmth ? '#b48950' : '#a78a64'} stopOpacity="0.85" /></radialGradient>
          <clipPath id={`${id}-disc`}><circle cx="420" cy="390" r="340" /></clipPath>
          <clipPath id={`${id}-left`}><rect x="0" y="0" width={840 * split / 100} height="780" /></clipPath>
          <clipPath id={`${id}-right`}><rect x={840 * split / 100} y="0" width={840 * (100 - split) / 100} height="780" /></clipPath>
        </defs>
        <g clipPath={`url(#${id}-disc)`}>
          {comparison ? <><g clipPath={`url(#${id}-left)`}>{layer(false)}</g><g clipPath={`url(#${id}-right)`}>{layer(true)}</g></> : layer(true)}
          {grid && <g fill="none" stroke="#82919e" strokeWidth="0.55" opacity="0.24" transform={`translate(420 390) scale(${zoom}) translate(-420 -390)`}>
            {[340, 226.67, 113.33].map(r => <circle key={r} cx="420" cy="390" r={r} strokeDasharray={r === 340 ? undefined : '2 6'} />)}
            {[0, 30, 60, 90, 120, 150].map(a => <line key={a} x1="80" y1="390" x2="760" y2="390" transform={`rotate(${a} 420 390)`} />)}
          </g>}
        </g>
        <g fill="none" stroke="#5b6268"><circle cx="420" cy="390" r="340" strokeWidth="0.9" /><circle cx="420" cy="390" r="351" strokeWidth="0.4" />
          {Array.from({ length: 72 }, (_, i) => <line key={i} x1="420" y1={i % 6 === 0 ? 33 : 36} x2="420" y2="39" transform={`rotate(${i * 5} 420 390)`} opacity={i % 6 === 0 ? 1 : 0.5} />)}
        </g>
        <g className="compass-labels" textAnchor="middle"><text x="420" y="20">N</text><text x="48" y="394">E</text><text x="420" y="772">S</text><text x="792" y="394">W</text></g>
        {grid && <g clipPath={`url(#${id}-disc)`}><g className="altitude-labels" transform={`translate(420 390) scale(${zoom}) translate(-420 -390)`}><text x="427" y="280">60°</text><text x="427" y="167">30°</text><text x="427" y="65">HORIZON</text><text x="428" y="407">ZENITH</text></g></g>}
        <g clipPath={`url(#${id}-disc)`} transform={`translate(420 390) scale(${zoom}) translate(-420 -390)`}>
          {namedObjects.map(o => <g key={o.id} role="button" tabIndex={0} aria-label={`Inspect ${o.name}`} onClick={() => onSelect(o)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(o); } }} className="sky-target"><circle cx={o.x} cy={o.y} r="12" fill="transparent" /></g>)}
        </g>
      </svg>
      {comparison && <>
        <div className="comparison-label before"><span>01</span> BASELINE</div>
        <div className="comparison-label after"><span>02</span> EXPERIMENT</div>
        <div className="comparison-divider" style={{ left: `${split}%` }} />
        <div className="compare-gesture" role="presentation" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); setFromPointer(e); }} onPointerMove={e => { if (e.buttons) setFromPointer(e); }}>
          <div className="compare-handle" style={{ left: `${split}%` }}><Columns2 size={15} /></div>
        </div>
      </>}
      <div className="sky-scale"><span>AZIMUTHAL EQUIDISTANT</span><span>LOOKING UP · EAST LEFT</span></div>
      <div className="zoom-tools" aria-label="Chart zoom"><button onClick={() => setZoom(z => Math.max(1, z - 0.25))} aria-label="Zoom out" disabled={zoom <= 1}><Minus size={15} /></button><span>{zoom.toFixed(2)}×</span><button onClick={() => setZoom(z => Math.min(2, z + 0.25))} aria-label="Zoom in" disabled={zoom >= 2}><Plus size={15} /></button></div>
    </div>
    {comparison && <label className="comparison-accessible">Before / after divider <input aria-label="Before / after sky comparison" type="range" min="4" max="96" value={split} onChange={e => onSplit(Number(e.target.value))} /></label>}
    <div className="sky-caption"><span><i className="key-star" /> Catalog stars <i className="key-planet" /> Planets <i className="key-line" /> Asterisms</span><span className="evidence-tag illustrative">ILLUSTRATIVE SKY APPEARANCE</span></div>
  </div>;
}
