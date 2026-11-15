import { useId, useState } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpRight, Info } from 'lucide-react';
import { type HistoricalData, downloadFile, evidenceCSV } from '../lib/data';

const number = (v: number | null | undefined, digits = 3) => v === null || v === undefined ? '—' : v.toFixed(digits);
const signed = (v: number | null | undefined, digits = 3) => v === null || v === undefined ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(digits)}`;

export default function History({ data, onEvidence,source,onSource }: { data: HistoricalData; onEvidence: () => void;source:string;onSource:(value:string)=>void }) {
  const [start, setStart] = useState(2001);
  const [end, setEnd] = useState(2024);
  const [selectedYear, setSelectedYear] = useState(2024);
  const id = useId().replace(/:/g, '');
  const result = data.windows[`${start}-${end}`];
  const points = data.annual.filter(p => p.year >= start && p.year <= end);
  const selected = points.find(p => p.year === selectedYear) ?? points[points.length - 1];
  const finiteValues = points.flatMap(p => p.value === null ? [] : [p.value]);
  const max = Math.max(0.8, ...finiteValues) * 1.12;
  const x = (year: number) => 64 + (year - start) / (end - start) * 900;
  const y = (value: number) => 340 - value / max * 270;
  const path = points.map((p, i) => p.value === null ? '' : `${i === 0 || points[i - 1].value === null ? 'M' : 'L'}${x(p.year)},${y(p.value)}`).join(' ');
  const significant = result.pValue !== null && result.pValue !== undefined && result.pValue < 0.05;
  const report = () => downloadFile(`nightlens-${data.region.id}-${start}-${end}-evidence.json`, JSON.stringify({ variable: data.variable, units: data.units, region: data.region, spatialResolution: data.spatialResolution, sourceUrl: data.sourceUrl, rawSha256: data.sha256, retrievedAt: data.retrievedAt, processing: data.processing, annual: points, analysis: result, caveat: 'Exploratory trend. Not nighttime radiance, not skyglow, not causal evidence.' }, null, 2), 'application/json');
  return <section className="history-view">
    <div className="history-heading"><div><span className="eyebrow">02 / THE TIME MACHINE</span><h1>What is changing <em>above us?</em></h1><p>Follow a NASA atmospheric record. Separate a changing environment from a hypothetical city.</p></div><button className="text-link" onClick={onEvidence}>Read the method <ArrowUpRight size={16} /></button></div>
    <div className="data-context"><span className="evidence-tag measured">NASA-DERIVED RECORD</span><span>{data.provider}</span><span>{data.spatialResolution} · 2001–2024</span></div>{data.region.id==='penang'&&<label className="history-source-choice">NASA record <select aria-label="NASA record" value={source} onChange={e=>onSource(e.target.value)}><option value="giovanni">MODIS Terra via Giovanni · challenge resource</option><option value="power">CERES SYN1deg via NASA POWER · context</option></select><small>Different products and sampling. Compare their limitations; do not splice their values.</small></label>}{data.parameter==='MOD08_M3.061.AOD550'&&<p className="history-product-note">Direct use of the challenge-listed Giovanni resource. Requested Penang region: 100–101° E, 5–6° N; one actual source grid centre at 100.5° E, 5.5° N. Monthly satellite composites are historical atmospheric context, not nighttime-light measurements. <a href="/data/giovanni-modis-penang-2001-2024.csv" download>Original NASA export ↗</a> · <a href={data.sourceUrl} target="_blank" rel="noreferrer">Reproduce in Giovanni ↗</a></p>}
    <div className="historical-chart">
      <div className="chart-heading"><div><span className="eyebrow">AEROSOL OPTICAL DEPTH</span><h2>How much aerosol is in the atmospheric column?</h2></div><div className="chart-unit">λ 0.55 µm <span>DIMENSIONLESS</span></div></div>
      <div className="year-range"><label>From <select aria-label="Start year" value={start} onChange={e => { const v = Number(e.target.value); setStart(v); if (selectedYear < v) setSelectedYear(v); }}>{data.annual.filter(p => p.year < end).map(p => <option key={p.year}>{p.year}</option>)}</select></label><ArrowRight size={14} /><label>To <select aria-label="End year" value={end} onChange={e => { const v = Number(e.target.value); setEnd(v); if (selectedYear > v) setSelectedYear(v); }}>{data.annual.filter(p => p.year > start).map(p => <option key={p.year}>{p.year}</option>)}</select></label><span>{result.n} complete annual values · {result.missingYears} missing</span></div>
      <svg viewBox="0 0 1010 420" className="history-chart-svg" role="img" aria-label={`NASA aerosol optical-depth annual means for ${data.region.name}, ${start} to ${end}, dimensionless. Each point represents one source grid cell.`}>
        <defs><linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#83b8be" stopOpacity="0.15" /><stop offset="1" stopColor="#83b8be" stopOpacity="0" /></linearGradient></defs>
        {[0, 1, 2, 3, 4].map(i => <g key={i}><line x1="64" x2="964" y1={y(i * max / 4)} y2={y(i * max / 4)} stroke="#303b46" strokeDasharray="2 5" /><text x="45" y={y(i * max / 4) + 4} textAnchor="end">{(i * max / 4).toFixed(2)}</text></g>)}
        <text x="64" y="35" className="axis-title">AOD · DIMENSIONLESS</text>
        {points.every(p => p.value !== null) && <path d={`${path} L964,340 L64,340Z`} fill={`url(#${id}-area)`} />}
        <path d={path} fill="none" stroke="#83b8be" strokeWidth="2" />
        {result.slopePerYear !== undefined && result.interceptAtStart !== undefined && <path d={`M${x(start)},${y(result.interceptAtStart)} L${x(end)},${y(result.interceptAtStart + result.slopePerYear * (end - start))}`} fill="none" stroke="#c7a475" strokeWidth="1.3" strokeDasharray="6 6" />}
        {points.filter(p => p.value !== null).map(p => <g key={p.year} role="button" tabIndex={0} aria-label={`Select year ${p.year}`} onClick={() => setSelectedYear(p.year)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedYear(p.year); } }} className="data-point"><circle cx={x(p.year)} cy={y(p.value!)} r={p.year === selected?.year ? 6 : 3} fill="#0b1119" stroke={p.year === selected?.year ? '#e9e5dc' : '#83b8be'} strokeWidth="1.7" /><circle cx={x(p.year)} cy={y(p.value!)} r="12" fill="transparent" /><title>{p.year}: {number(p.value)} AOD (dimensionless)</title></g>)}
        {points.filter((_, i) => i % Math.max(1, Math.ceil(points.length / 8)) === 0 || i === points.length - 1).map(p => <text key={p.year} x={x(p.year)} y="370" textAnchor="middle">{p.year}</text>)}
        <g className="chart-legend"><line x1="64" x2="88" y1="404" y2="404" stroke="#83b8be" strokeWidth="2" /><text x="98" y="408">NASA-derived annual mean</text><line x1="326" x2="350" y1="404" y2="404" stroke="#c7a475" strokeDasharray="5 4" /><text x="360" y="408">Calculated linear trend</text></g>
      </svg>
      <div className="mobile-chart-legend"><span><i /> NASA-derived annual mean</span><span><i /> Calculated linear trend</span></div>
      <div className="selected-year"><label htmlFor="selected-year">Inspect annual record</label><input id="selected-year" type="range" min={start} max={end} step="1" value={selected?.year ?? end} onChange={e => setSelectedYear(Number(e.target.value))} /><output><strong>{selected?.year}</strong> {number(selected?.value)} <span>AOD</span></output></div>
    </div>
    <div className="trend-readout">
      <div><span>ENDPOINT CHANGE</span><strong>{signed(result.percentChange, 1)}<small>%</small></strong><p>{signed(result.absoluteChange)} AOD · {start} to {end}</p></div>
      <div><span>FITTED TREND / DECADE</span><strong>{signed(result.slopePerYear === undefined ? undefined : result.slopePerYear * 10)}<small>AOD</small></strong><p>95% CI: {result.ci95PerYear ? result.ci95PerYear.map(v => signed(v * 10)).join(' to ') : 'requires ≥ 8 valid years'}</p></div>
      <div className="inference"><span>EXPLORATORY INFERENCE</span><strong className={significant ? 'cyan' : ''}>{result.n < 8 ? 'Too few years' : significant ? 'Evidence of a linear trend' : 'Trend is inconclusive'}</strong><p>{result.pValue !== undefined && result.pValue !== null ? `Two-sided p = ${result.pValue.toFixed(3)} · HAC ${data.parameter==='MOD08_M3.061.AOD550'?'calendar ':''}lag 1 · α = 0.05` : 'Inferential statistics withheld'}</p></div>
    </div>
    <details className="history-processing"><summary>Processing, source and uncertainty</summary><p>{data.processing.aggregation}</p><p>{data.processing.scaling}</p><p>{data.processing.quality}</p><p>{data.processing.uncertainty}</p><p>Raw SHA-256: <code>{data.sha256}</code></p><a href={data.documentationUrl} target="_blank" rel="noreferrer">Product documentation ↗</a></details><div className="history-note"><Info size={17} /><p><strong>This record describes aerosols, not artificial light.</strong> Aerosols affect atmospheric transparency; this record does not establish a nighttime-lighting trend or predict star visibility. Window selection is exploratory; significance does not establish causation.</p></div>
    <div className="data-download"><div><span className="eyebrow">TAKE THE EVIDENCE WITH YOU</span><p>Source, coordinates, units, complete annual values and analysis assumptions.</p></div><button className="quiet-button" onClick={() => downloadFile(`nightlens-${data.region.id}-${start}-${end}.csv`, evidenceCSV(data, start, end), 'text/csv')}><ArrowDownToLine size={15} /> Annual CSV</button><button className="quiet-button" onClick={report}><ArrowDownToLine size={15} /> Evidence JSON</button></div>
  </section>;
}
