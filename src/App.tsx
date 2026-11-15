import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, CircleHelp, Clock3, Columns2, Compass, MapPin, Moon, RotateCcw, ShieldCheck, SlidersHorizontal, Sparkles, Sun, Telescope } from 'lucide-react';
import SkyChart from './components/SkyChart';
import LiveObservatory from './components/LiveObservatory';
import History from './components/History';
import { EvidenceContent, EvidenceDialog } from './components/Evidence';
import { calculateSky, cardinal, localToUTC, LOCATIONS, type CatalogStar, type SkyObject } from './lib/astronomy';
import { applyExperiment, EXPERIMENTS, deriveVisualState, formatTime, normalizeScenario, resetScenario, timeLabel, type CityScenario } from './lib/scenario';
import { validateHistoricalData, type HistoricalData } from './lib/data';

type View = 'observatory' | 'time-machine' | 'sky-lab' | 'methodology';
const VIEWS: { id: View; title: string }[] = [{ id: 'observatory', title: 'Observatory' }, { id: 'time-machine', title: 'Time Machine' }, { id: 'sky-lab', title: 'Sky Lab' }, { id: 'methodology', title: 'Methodology' }];
const currentView = (): View => VIEWS.find(v => v.id === window.location.hash.slice(1))?.id ?? 'observatory';

function AtlasMark() { return <svg viewBox="0 0 42 42" fill="none" aria-hidden="true"><circle cx="21" cy="21" r="17" /><ellipse cx="21" cy="21" rx="7" ry="17" /><ellipse cx="21" cy="21" rx="17" ry="7" /><path d="M4 21h34M21 4v34M8 8l26 26" /><path d="m33 3 1.2 4.5L39 9l-4.8 1.5L33 15l-1.4-4.5L27 9l4.6-1.5Z" className="logo-star" /></svg>; }

function RangeControl({ label, value, onChange, min = 0, max = 100, suffix = '%', hint, ariaLabel }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; suffix?: string; hint?: string; ariaLabel?: string }) {
  return <label className="range-control"><span className="control-heading"><span>{label}</span><output>{value}<small>{suffix}</small></output></span><input type="range" min={min} max={max} step="1" value={value} aria-label={ariaLabel ?? label} onChange={e => onChange(Number(e.target.value))} style={{ '--range-fill': `${(value - min) / (max - min) * 100}%` } as React.CSSProperties} />{hint && <span className="control-hint">{hint}</span>}</label>;
}

export default function App() {
  const [view, setView] = useState<View>(currentView);
  const [locationId, setLocationId] = useState('penang');
  const [historySource,setHistorySource]=useState('giovanni');
  const location = LOCATIONS.find(l => l.id === locationId)!;
  const [date, setDate] = useState('2026-11-15');
  const [scenario, setScenario] = useState<CityScenario>(resetScenario);
  const [comparison, setComparison] = useState(true);
  const [split, setSplit] = useState(50);
  const [grid, setGrid] = useState(true);
  const [constellations, setConstellations] = useState(true);
  const [haze, setHaze] = useState(10);
  const [cloud, setCloud] = useState(0);
  const [moonlight, setMoonlight] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [activeExperiment, setActiveExperiment] = useState<string | null>('city');
  const [chartResetCount, setChartResetCount] = useState(0);
  const [stars, setStars] = useState<CatalogStar[]>([]);
  const [data, setData] = useState<HistoricalData | null>(null);
  const [catalogError, setCatalogError] = useState('');
  const [dataError, setDataError] = useState('');
  const [retry, setRetry] = useState(0);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const topic = view === 'time-machine' ? 'data' : view === 'observatory' ? 'astronomy' : 'city';
  const experiment = view === 'sky-lab';

  useEffect(() => { const onHash = () => { const next = VIEWS.find(v => v.id === window.location.hash.slice(1)); if (next) setView(next.id); }; window.addEventListener('hashchange', onHash); return () => window.removeEventListener('hashchange', onHash); }, []);
  useEffect(() => {
    const abort = new AbortController();
    fetch('/data/stars.json', { signal: abort.signal }).then(r => { if (!r.ok) throw new Error('Star catalog unavailable'); return r.json(); }).then((catalog: { stars: CatalogStar[] }) => {
      if (!Array.isArray(catalog.stars) || !catalog.stars.length || catalog.stars.some(s => !Number.isFinite(s.ra) || s.ra < 0 || s.ra >= 24 || !Number.isFinite(s.dec) || Math.abs(s.dec) > 90 || !Number.isFinite(s.magnitude))) throw new Error('Invalid catalog coordinates');
      setStars(catalog.stars); setCatalogError('');
    }).catch((e: Error) => { if (e.name !== 'AbortError') setCatalogError('The cached star catalog could not be loaded.'); });
    return () => abort.abort();
  }, [retry]);
  useEffect(() => {
    const abort = new AbortController();
    setData(null); setDataError('');
    fetch(`/data/${locationId}${locationId==='penang'&&historySource==='giovanni'?'-modis':''}.json`, { signal: abort.signal }).then(r => { if (!r.ok) throw new Error('NASA cache unavailable'); return r.json(); }).then(value => setData(validateHistoricalData(value))).catch((e: Error) => { if (e.name !== 'AbortError') setDataError('The cached NASA record could not be loaded.'); });
    return () => abort.abort();
  }, [locationId, historySource, retry]);

  const observation = useMemo(() => {
    try { if (date < '2001-01-01' || date > '2100-12-31') throw new RangeError('Date outside supported UI range'); return { sky: calculateSky(stars, location, localToUTC(date, scenario.time, location.utcOffset)), error: '' }; }
    catch { return { sky: null, error: 'Choose a valid observing date between 2001 and 2100.' }; }
  }, [stars, location, date, scenario.time]);
  const sky = observation.sky;
  const visual = deriveVisualState(scenario);
  const targetObjects = useMemo(() => sky?.objects.filter(o => o.name && (o.kind !== 'star' || o.magnitude < 2.5)).sort((a, b) => (a.kind === 'star' ? 1 : 0) - (b.kind === 'star' ? 1 : 0) || a.magnitude - b.magnitude).slice(0, 8) ?? [], [sky]);
  const selectedObject = sky?.objects.find(o => o.id === selected);

  const navigate = (id: View) => { setView(id); window.location.hash = id; };
  const updateScenario = (patch: Partial<CityScenario>) => { setScenario(s => normalizeScenario({ ...s, ...patch })); if (Object.keys(patch).some(key => key !== 'time')) setActiveExperiment(null); };
  const reset = () => { setScenario(resetScenario()); setActiveExperiment('city'); setChartResetCount(n => n + 1); setComparison(true); setSplit(50); setHaze(10); setCloud(0); setMoonlight(true); setGrid(true); setConstellations(true); setSelected(null); };
  const chooseExperiment = (id: string) => { setScenario(applyExperiment(id, scenario.time)); setActiveExperiment(id); setComparison(true); setSplit(50); };
  const chooseTarget = (object: SkyObject) => setSelected(object.id);

  return <>
    <a className="skip-link" href="#main-content" onClick={e => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to instrument</a>
    <header className={`site-header ${view==='observatory'?'experience-header':''}`}><button className="brand" onClick={() => navigate('observatory')} aria-label="NightLens home"><AtlasMark /><span>NightLens<small>THE ATLAS OF LOST STARLIGHT</small></span></button>
      <nav aria-label="Main navigation">{VIEWS.map(v => <a href={`#${v.id}`} key={v.id} className={view === v.id ? 'active' : ''} aria-current={view === v.id ? 'page' : undefined} onClick={() => setView(v.id)}>{v.title}{v.id === 'sky-lab' && <span className="nav-dot" />}</a>)}</nav>
      <button className="header-evidence" onClick={() => setEvidenceOpen(true)}><BookOpen size={16} /><span>Evidence notebook</span></button>
    </header>

    <main id="main-content" className={`app-shell ${view==='observatory'?'app-observatory':''}`} tabIndex={-1}>
      {view === 'sky-lab' && <div className="intro-row"><div><div className="eyebrow"><span className="section-number">{experiment ? '03' : '01'}</span> {experiment ? 'WHAT IF? — CITY EXPERIMENT' : 'THE DIGITAL OBSERVATORY'}<span className="eyebrow-rule" /></div><h1>{experiment ? <>A quieter city. <em>A deeper night.</em></> : <>Look up. <em>Know where you stand.</em></>}</h1><p>{experiment ? 'Explore responsible lighting. Keep the same sky. See a different possibility.' : 'A calculated atlas of the sky above you, grounded in time and place.'}</p></div><div className="intro-aside"><span className="edition">FIELD EDITION / 2026</span><span>{experiment ? 'A HYPOTHETICAL LIGHTING STUDY' : 'ASTRONOMY, WITHOUT THE GUESSWORK'}</span></div></div>}

      {view !== 'methodology' && view !== 'observatory' && <div className="observing-bar"><label className="location-control"><MapPin size={16} /><select aria-label="Observing location" value={locationId} onChange={e => { setLocationId(e.target.value); setSelected(null); }}>{LOCATIONS.map(l => <option value={l.id} key={l.id}>{l.name}</option>)}</select><ChevronDown size={14} /></label><span className="coordinates">{location.latitude.toFixed(4)}° N &nbsp; {location.longitude.toFixed(4)}° E</span>{view !== 'time-machine' && <><label className="date-control"><span>OBSERVING DATE</span><input aria-label="Observing date" type="date" min="2001-01-01" max="2100-12-31" value={date} onChange={e => setDate(e.target.value)} /></label><span className="timezone">UTC +{String(location.utcOffset).padStart(2, '0')}:00</span></>}<button className="text-link nasa-link" onClick={() => navigate(view === 'time-machine' ? 'sky-lab' : 'time-machine')}>{view === 'time-machine' ? 'Explore the sky' : 'Explore NASA records'}<ArrowUpRight size={14} /></button></div>}

      {view === 'sky-lab' && <>
        {catalogError || observation.error ? <div className="load-error" role="alert"><CircleHelp size={22} /><p>{catalogError || observation.error}</p>{catalogError && <button className="quiet-button" onClick={() => setRetry(r => r + 1)}>Retry cached catalog</button>}</div> : sky && <div className="laboratory-layout">
          <section className="sky-column" aria-label="Interactive sky instrument">
            <div className="sky-toolbar"><span className="instrument-label"><Compass size={15} /> THE SKY ABOVE {locationId.toUpperCase()}</span><div className="chart-toggles"><button onClick={() => setConstellations(v => !v)} aria-pressed={constellations}>Asterisms</button><button onClick={() => setGrid(v => !v)} aria-pressed={grid}>Grid</button></div></div>
            {!stars.length && <p className="catalog-loading" role="status">Loading the local star catalog…</p>}
            <div className="timeline-panel"><div className="timeline-heading"><div><Clock3 size={15} /><span>MOVE THROUGH THE EVENING</span></div><output aria-live="polite">{formatTime(scenario.time)}<small>{scenario.time === 1440 ? 'NEXT DAY' : `UTC+${location.utcOffset}`}</small></output></div><div className="timeline-track"><input type="range" min="1080" max="1440" step="5" value={scenario.time} aria-label="Evening timeline" aria-valuetext={timeLabel(scenario.time)} onChange={e => updateScenario({ time: Number(e.target.value) })} />{experiment && <div className="schedule-marker" style={{ left: `${(scenario.scheduleStart - 1080) / 360 * 100}%` }}><span>{formatTime(scenario.scheduleStart)} · DIMMING BEGINS</span></div>}</div><div className="timeline-labels"><span>6 PM</span><span>7 PM</span><span>8 PM</span><span>9 PM</span><span>10 PM</span><span>11 PM</span><span>MIDNIGHT</span></div></div>
            <SkyChart key={chartResetCount} sky={sky} scenario={experiment ? scenario : { ...scenario, dimmingPercent: 0, participatingFixturePercent: 0, shieldingEnabled: false, lightColorScenario: 'cool' }} comparison={experiment && comparison} split={split} onSplit={setSplit} grid={grid} constellations={constellations} selected={selected} onSelect={chooseTarget} haze={haze} cloud={cloud} moonlight={moonlight} />
            {selectedObject && <div className="object-inspector" role="status"><span><Telescope size={16} /><strong>{selectedObject.name}</strong></span><span>ALT {selectedObject.altitude.toFixed(1)}°</span><span>AZ {selectedObject.azimuth.toFixed(1)}° {cardinal(selectedObject.azimuth)}</span><span className="evidence-tag calculated">CALCULATED</span></div>}
            {sky.sunAltitude > -18 && <p className="twilight-note"><Sun size={14} />{sky.sunAltitude >= 0 ? 'The Sun is above the horizon.' : 'Astronomical darkness has not begun.'} Sky appearance is schematic; targets listed above the horizon may be unobservable.</p>}
          </section>

          <aside className="instrument-panel" aria-label={experiment ? 'City experiment controls' : 'Observation controls'}>
            {experiment ? <>
              <div className="panel-title"><span className="eyebrow">YOUR EXPERIMENT</span><span className="evidence-tag illustrative">ILLUSTRATIVE</span></div><h2>{EXPERIMENTS.find(p => p.id === activeExperiment)?.name ?? "Custom city study"}</h2><p className="panel-description">What if selected nonessential lights became quieter after evening hours?</p>
              <div className="schedule-setting"><label htmlFor="schedule-start"><Clock3 size={15} /> Begin dimming at</label><div className="select-wrap"><select id="schedule-start" value={scenario.scheduleStart} onChange={e => updateScenario({ scheduleStart: Number(e.target.value) })}>{Array.from({ length: 13 }, (_, i) => 1080 + i * 30).map(m => <option key={m} value={m}>{timeLabel(m)}</option>)}</select><ChevronDown size={13} /></div></div>
              <RangeControl label="Scheduled fixture brightness" value={100 - scenario.dimmingPercent} onChange={value => updateScenario({ dimmingPercent: 100 - value })} hint={`${scenario.dimmingPercent}% dimming of participating fixtures after ${formatTime(scenario.scheduleStart)}.`} />
              <RangeControl label="Participating fixtures" value={scenario.participatingFixturePercent} onChange={value => updateScenario({ participatingFixturePercent: value })} hint="A share of selected nonessential fixtures—not a share of skyglow." />
              <div className="shield-setting"><div><label htmlFor="shielding"><ShieldCheck size={16} /> Shield the fixtures</label><p>Direct participating lights downward.</p></div><input id="shielding" aria-label="Fixture shielding" type="checkbox" role="switch" checked={scenario.shieldingEnabled} onChange={e => updateScenario({ shieldingEnabled: e.target.checked })} /></div>
              <div className="color-setting"><div className="control-heading"><span>Lighting color scenario</span><CircleHelp size={13} /></div><div className="segmented-control" role="group" aria-label="Lighting color scenario"><button aria-pressed={scenario.lightColorScenario === 'warm'} onClick={() => updateScenario({ lightColorScenario: 'warm' })}><span className="warm-dot" /> Warmer</button><button aria-pressed={scenario.lightColorScenario === 'cool'} onClick={() => updateScenario({ lightColorScenario: 'cool' })}><span className="cool-dot" /> Cooler</button></div></div>
              <div className={`schedule-status ${visual.scheduleActive ? 'activated' : ''}`} role="status" data-testid="schedule-status"><span className="status-icon">{visual.scheduleActive ? <Check size={15} /> : <Clock3 size={15} />}</span><div><strong>{visual.scheduleActive ? 'Schedule active' : 'Waiting for the schedule'}</strong><span>{visual.scheduleActive ? `Participating fixtures at ${Math.round(visual.participatingOutput * 100)}% output.` : `Baseline output until ${formatTime(scenario.scheduleStart)}.`}</span></div></div>
              <div className="experiment-actions"><button className="primary-button" onClick={() => { setComparison(v => !v); setSplit(50); }} aria-pressed={comparison}><Columns2 size={16} />{comparison ? 'View experiment only' : 'Compare before / after'}</button><button className="reset-button" onClick={reset} aria-label="Reset experiment"><RotateCcw size={16} /> Reset</button></div>
              <p className="safety-note"><ShieldCheck size={13} /> Essential safety lighting is excluded.</p>
            </> : <>
              <div className="panel-title"><span className="eyebrow">OBSERVING NOTES</span><span className="evidence-tag calculated">CALCULATED</span></div><h2>The evening’s geometry</h2><p className="panel-description">Above the horizon does not mean visible. Weather, sky brightness and local obstacles still matter.</p>
              <div className="moon-readout"><Moon size={27} /><div><span>MOON ILLUMINATION</span><strong>{(sky.moonIllumination * 100).toFixed(1)}<small>%</small></strong></div></div><div className="geometry-line"><span>Moon altitude</span><strong>{sky.moonAltitude.toFixed(1)}°</strong></div><div className="geometry-line"><span>Sun altitude</span><strong>{sky.sunAltitude.toFixed(1)}°</strong></div><div className="geometry-line"><span>Selected planets above horizon</span><strong>{sky.objects.filter(o => o.kind === 'planet').length}</strong></div>
              <button className="primary-button observatory-experiment" onClick={() => navigate('sky-lab')}><Sparkles size={16} /> Try a city experiment <ArrowRight size={16} /></button><button className="text-link" onClick={reset}><RotateCcw size={14} /> Reset sky settings</button>
            </>}
            <details className="atmosphere-controls"><summary><SlidersHorizontal size={14} /> Atmospheric illustration <ChevronDown size={14} /></summary><p>Independent educational controls, not live conditions or NASA-derived forecasts.</p><RangeControl label="Illustrative haze" value={haze} onChange={setHaze} /><RangeControl label="Illustrative cloud cover" value={cloud} onChange={setCloud} /><label className="moonlight-toggle"><input type="checkbox" checked={moonlight} onChange={e => setMoonlight(e.target.checked)} /> Include illustrative Moon influence</label></details>
            <button className="panel-evidence" onClick={() => setEvidenceOpen(true)}><BookOpen size={16} /><span>What does this picture mean?<small>Assumptions, sources & limitations</small></span><ArrowUpRight size={15} /></button>
          </aside>
        </div>}
        {experiment && <section className="experiment-index" aria-label="Preset experiments"><div><span className="eyebrow">EXPERIMENT INDEX</span><p>Four ways to ask a better lighting question.</p></div><div className="preset-list">{EXPERIMENTS.map((preset, index) => <button key={preset.id} aria-pressed={activeExperiment === preset.id} onClick={() => chooseExperiment(preset.id)}><span className="preset-number">0{index + 1}</span><span><strong>{preset.name}</strong><small>{preset.description}</small></span><ArrowUpRight size={14} /></button>)}</div></section>}
        <section className="under-sky"><div className="field-note"><span className="eyebrow">A NOTE FROM THE OBSERVATORY</span><h3>Less light does not mean less care.</h3><p>Responsible lighting serves people where and when it is needed. This experiment explores choices for nonessential fixtures; it does not prescribe a city’s lighting policy.</p><a href="https://darksky.org/resources/guides-and-how-tos/lighting-principles/" target="_blank" rel="noreferrer">Explore the five lighting principles <ArrowUpRight size={14} /></a></div><div className="targets-panel"><div className="targets-heading"><span className="eyebrow">ABOVE THE GEOMETRIC HORIZON</span><span className="evidence-tag calculated">CALCULATED</span></div><div className="target-list">{targetObjects.slice(0, 5).map(object => <button key={object.id} onClick={() => chooseTarget(object)} className={selected === object.id ? 'selected' : ''}><span className={object.kind === 'planet' ? 'target-dot planet' : 'target-dot'} /><span>{object.name}<small>{object.kind}</small></span><span>{object.altitude.toFixed(1)}°<small>ALT · {cardinal(object.azimuth)}</small></span></button>)}</div><p>Catalog targets; actual detectability is not calculated.</p></div></section>
        <section className="evidence-route"><Activity size={22} /><div><h3>A hypothetical sky. A real environmental record.</h3><p>The Time Machine explores NASA aerosol data, with source provenance and an uncertainty-aware trend test.</p></div><button className="text-link" onClick={() => navigate('time-machine')}>Go to the Time Machine <ArrowRight size={17} /></button></section>
      </>}

      {view === 'observatory' && <LiveObservatory onHistory={() => navigate('time-machine')} />}
      {view === 'time-machine' && (data ? <History source={historySource} onSource={setHistorySource} key={locationId} data={data} onEvidence={() => setEvidenceOpen(true)} /> : <div className="load-error" role={dataError ? 'alert' : 'status'}><p>{dataError || 'Loading cached NASA records…'}</p>{dataError && <button className="quiet-button" onClick={() => setRetry(r => r + 1)}>Retry NASA cache</button>}</div>)}
      {view === 'methodology' && <section className="methodology-view"><span className="eyebrow">04 / THE EVIDENCE NOTEBOOK</span><h1>Wonder, <em>with its workings shown.</em></h1><div className="methodology-grid"><aside><span className="eyebrow">THREE KINDS OF KNOWING</span><div><span className="evidence-tag measured">NASA-DERIVED RECORD</span><p>A traceable environmental dataset.</p></div><div><span className="evidence-tag calculated">CALCULATED</span><p>Geometry and statistics from stated methods.</p></div><div><span className="evidence-tag illustrative">ILLUSTRATIVE</span><p>An educational picture, never a measurement.</p></div></aside><EvidenceContent topic="all" /></div></section>}
    </main>
    <footer className="site-footer"><div><AtlasMark /><span>NightLens <small>A digital observatory for the changing night sky.</small></span></div><span>NASA SPACE APPS 2026 · INDEPENDENT PROJECT</span><a href="#methodology" onClick={() => setView('methodology')}>Sources & AI disclosure <ArrowUpRight size={12} /></a></footer>
    <EvidenceDialog open={evidenceOpen} topic={topic} onClose={() => setEvidenceOpen(false)} />
  </>;
}
