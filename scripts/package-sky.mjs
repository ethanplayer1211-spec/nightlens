import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import console from 'node:console';
import { Buffer } from 'node:buffer';

const result = await build({ entryPoints: ['src/skyEntry.tsx'], bundle: true, write: false, outdir: '.local/sky-package', entryNames: 'sky', minify: true, format: 'iife', platform: 'browser', target: 'es2022', jsx: 'automatic', legalComments: 'inline' });
const js = result.outputFiles.find(file => file.path.endsWith('.js'))?.text;
const css = result.outputFiles.find(file => file.path.endsWith('.css'))?.text;
if (!js || !css) throw new Error('Standalone sky compilation did not produce JavaScript and CSS');
const stars = await fs.readFile('public/data/stars.json', 'utf8');
const survey = await fs.readFile('public/data/gaia-sky.png');
const horizon = await fs.readFile('public/data/horizon-penang.json','utf8');
const licensePaths = ['LICENSE', 'public/licenses/astronomy-engine.txt', 'public/licenses/lucide.txt', 'node_modules/react/LICENSE', 'node_modules/react-dom/LICENSE', 'node_modules/scheduler/LICENSE'];
const licenses = (await Promise.all(licensePaths.map(async file => `${file}\n${await fs.readFile(file, 'utf8')}`))).join('\n\n');
const html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0b1119"><title>NightLens — The Sky Above You</title><meta name="description" content="Standalone astronomical sky explorer. Calculated geometry, real Gaia survey field, illustrative lighting. Code and text assisted by Codex; data and imagery from attributed scientific sources."><style>${css.replaceAll('</style', '<\\/style')}</style></head><body><div id="root"></div><img id="nightlens-gaia-texture" hidden alt="Embedded Gaia survey texture" src="data:image/png;base64,${survey.toString('base64')}"><script type="application/json" id="nightlens-star-data">${stars.replaceAll('<', '\\u003c')}</script><script type="application/json" id="nightlens-horizon-data">${horizon.replaceAll('<', '\\u003c')}</script><script type="text/plain" id="nightlens-software-licenses">${licenses.replaceAll('</script', '<\\/script')}</script><script>${js.replaceAll('</script', '<\\/script')}</script></body></html>`;
const output = path.resolve('public/downloads/nightlens-sky.html');
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, html);
console.log(`Standalone sky: ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MiB, includes catalog, Gaia map, code and styles`);
