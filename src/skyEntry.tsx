import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import LiveObservatory from './components/LiveObservatory';
import './styles.css';

const standalone = Boolean(document.getElementById('nightlens-star-data'));

createRoot(document.getElementById('root')!).render(<StrictMode><main className="compact-page-shell"><header className="compact-page-header">{standalone?<span className="compact-brand">NightLens</span>:<a className="compact-brand" href="./index.html">NightLens</a>}<span>THE SKY ABOVE YOU · FIELD EDITION 2026</span></header><LiveObservatory compact/></main></StrictMode>);
