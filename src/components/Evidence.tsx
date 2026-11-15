import { useEffect, useRef } from 'react';
import { ArrowUpRight, BookOpen, X } from 'lucide-react';

export function EvidenceContent({ topic }: { topic: 'city' | 'data' | 'astronomy' | 'all' }) {
  return <div className="evidence-copy">
    <p className="evidence-intro">An honest instrument tells you what it knows—and where its knowledge ends.</p>
    {(topic === 'city' || topic === 'all') && <>
      <span className="evidence-tag illustrative">ILLUSTRATIVE</span>
      <h3>A city experiment, not a forecast.</h3>
      <p>These are hypothetical changes to selected, nonessential outdoor fixtures. Essential safety lighting stays outside the experiment. Real lighting decisions require appropriate professional design and local requirements.</p>
      <p>The dimming schedule activates at or after its chosen start time. Participating fixtures adopt the selected output; all other fixtures retain the baseline setting. Shielding and color choices apply throughout the timeline. Both sky views use the same location, date, time and celestial coordinates.</p>
      <h4>How the picture changes</h4>
      <p>An uncalibrated transfer function changes sky tint and catalog-star contrast. The display uses a fixed background floor plus square-root tone mapping of a fixture contribution. Shielding and warm-color coefficients are artistic choices. Atmospheric and Moon controls also use illustrative coefficients.</p>
      <p><strong>50% fixture dimming does not mean 50% less skyglow.</strong> The app does not estimate limiting magnitude, a Bortle class, a number of visible stars, energy savings, safety effects or observatory performance. Preset names describe educational experiments, not measured outcomes.</p>
      <h4>Responsible outdoor lighting</h4>
      <ol className="principles-list">
        <li><strong>Useful</strong><span>Give each light a necessary purpose.</span></li>
        <li><strong>Targeted</strong><span>Aim and shield light toward the area it serves.</span></li>
        <li><strong>Low level</strong><span>Choose a level appropriate to the task.</span></li>
        <li><strong>Controlled</strong><span>Match lighting to when it is needed.</span></li>
        <li><strong>Warm-colored</strong><span>Limit short-wavelength light where possible.</span></li>
      </ol>
      <p>Educational guidance adapted from DarkSky International and the Illuminating Engineering Society’s <a href="https://darksky.org/resources/guides-and-how-tos/lighting-principles/" target="_blank" rel="noreferrer">Five Principles for Responsible Outdoor Lighting <ArrowUpRight size={13} /></a>. This is not a lighting standard or an endorsement.</p>
    </>}
    {(topic === 'data' || topic === 'all') && <>
      <span className="evidence-tag measured">NASA-DERIVED RECORD</span>
      <h3>Aerosols, not nighttime radiance.</h3>
      <p>The Time Machine uses NASA POWER’s AOD_55: aerosol optical depth at 0.55 µm, a dimensionless measure of the atmosphere’s aerosol extinction. NASA POWER serves a CERES SYN1deg aerosol field derived from MODIS retrievals and the MATCH model.</p>
      <p>Coverage: January 2001–December 2024; Penang and Seoul coordinates sample a 1° × 1° source grid cell. Neither record is a citywide average, a live air-quality measurement, a night-only observation or a measure of artificial light.</p>
      <h4>Processing & uncertainty</h4>
      <p>Cached NASA responses are checked for units and source, and retain raw SHA-256 checksums. Fill −999, nonfinite and negative values are excluded. Annual values are day-weighted means requiring all 12 months. The API’s annual “month 13” is excluded. The API supplies no per-observation quality flags.</p>
      <p>Ordinary least squares estimates annual change. Exploratory 95% confidence intervals and two-sided p-values use Newey–West HAC covariance (lag 1, small-sample correction, Student-t inference). Fewer than eight valid years suppress inferential statistics.</p>
      <p>The test assumes an approximately linear trend. Short records, residual dependence beyond lag 1, product bias, measurement uncertainty and testing many selected windows can change the inference. No multiple-testing correction is applied. Statistical significance does not establish a cause, and endpoint change can differ from the fitted trend.</p>
      <p><a href="https://power.larc.nasa.gov/docs/methodology/data/sources_clds_aerosols/" target="_blank" rel="noreferrer">NASA POWER source documentation <ArrowUpRight size={13} /></a></p>
      <h4>Black Marble access status</h4>
      <p>VNP46A4 v2 was evaluated as the preferred nighttime-radiance record. The Penang annual tile download redirected to NASA Earthdata Login. No radiance file was downloaded or analyzed. Its measured radiance is never substituted by the aerosol series or by the sky experiment.</p>
    </>}
    {(topic === 'astronomy' || topic === 'all') && <>
      <span className="evidence-tag calculated">CALCULATED</span>
      <h3>Real coordinates. Simplified appearance.</h3>
      <p>Astronomy Engine calculates topocentric Moon and planet coordinates, illumination and the Sun’s altitude. HYG v3.8 supplies 4,105 stars with catalog magnitude ≤ 5.8. J2000 catalog vectors are transformed to the observer’s horizon of date, including precession and nutation. Objects below the geometric horizon are excluded.</p>
      <p>The Observatory supports city search, coordinates and saved places with IANA timezones and daylight-saving changes. Now follows the actual clock; manual previews state their selected instant. Its perspective sky maps an attributed ESA/Gaia/DPAC EDR3 Galactic survey field into the local horizon. The survey is historical, not a live photograph. Sky Lab retains the circular azimuthal equidistant chart, north up and east left, with Penang UTC+08:00 and Seoul UTC+09:00; midnight means the following day.</p>
      <p>Open-Meteo / GeoNames supplies optional location search; Open-Meteo supplies timestamped current weather-model conditions, excluded from manual previews. These are separate from the NASA historical record. Full sky-source credits and licensing are available in the Observatory’s Sources &amp; limitations panel.</p><p>The perspective view also supports mapped OpenStreetMap building footprints with estimated heights and illustrative facades; all locations lack a complete terrain/site survey. Its combined atmosphere and midnight lighting controls remain uncalibrated. The separate Tucson2019 case reanalyzes six published VIIRS observations, with uncertainty and sensitivity diagnostics, and does not predict the selected city’s star visibility.</p><p>Star proper motion, stellar parallax, observer terrain and atmospheric refraction are omitted. Symbol size and contrast, Moon glyph, twilight, haze and cloud appearance are schematic. Asterism lines are chart aids, not objects in space. The target list reports geometry, not a guarantee of visibility.</p>
      <p><a href="https://github.com/cosinekitty/astronomy" target="_blank" rel="noreferrer">Astronomy Engine · MIT <ArrowUpRight size={13} /></a><br /><a href="https://github.com/astronexus/HYG-Database" target="_blank" rel="noreferrer">HYG v3.8 · David Nash / Astronexus · CC BY-SA 4.0 <ArrowUpRight size={13} /></a></p>
    </>}
    <hr /><h4>Built with traceable sources</h4><p>NightLens is an independent NASA Space Apps project. NASA has not endorsed this application. Codex assisted with code, documentation and testing. NASA records and catalog coordinates were downloaded from their cited sources; they were not generated by AI. No custom machine-learning model is used.</p>
  </div>;
}

export function EvidenceDialog({ open, topic, onClose }: { open: boolean; topic: 'city' | 'data' | 'astronomy'; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; if (open && dialog && !dialog.open) dialog.showModal(); else if (!open && dialog?.open) dialog.close(); }, [open]);
  return <dialog ref={ref} className="evidence-dialog" onCancel={onClose} onClose={onClose} aria-labelledby="evidence-title">
    <div className="evidence-dialog-header"><div><BookOpen size={17} /><h2 id="evidence-title">The evidence notebook</h2></div><button className="icon-button" onClick={onClose} aria-label="Close Evidence panel"><X size={20} /></button></div>
    <EvidenceContent topic={topic} />
  </dialog>;
}
