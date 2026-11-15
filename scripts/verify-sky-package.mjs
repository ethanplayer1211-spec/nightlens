/** Verify the delivered standalone against its pinned local source assets. */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {Buffer} from 'node:buffer';
import console from 'node:console';

const file=await fs.readFile('public/downloads/nightlens-sky.html');
assert.deepEqual(file,await fs.readFile('dist/downloads/nightlens-sky.html'));
const html=file.toString('utf8');
const packed=Object.fromEntries([...html.matchAll(/<script type="application\/octet-stream" data-nightlens-json="([^"]+)">([^<]+)<\/script>/g)].map(([,id,bytes])=>[id,JSON.parse(gunzipSync(Buffer.from(bytes,'base64')).toString('utf8'))]));
const readJson=async path=>JSON.parse(await fs.readFile(path,'utf8'));
assert.deepEqual(packed['nightlens-star-data'],await readJson('public/data/stars.json'));
assert.deepEqual(packed['nightlens-horizon-data'],await readJson('public/data/horizon-penang.json'));
const scenes=packed['nightlens-viewpoint-data'];assert.equal(Object.keys(scenes).length,7);
for(const [id,scene] of Object.entries(scenes)){
  for(const [key,prefix] of [['map','viewpoint'],['context','context'],['terrain','terrain'],['terrainFar','terrain-far']])assert.deepEqual(scene[key],await readJson(`public/data/${prefix}-${id}.json`));
  if(scene.water)assert.deepEqual(scene.water,await readJson(`public/data/viewpoint-water-${id}.json`));
}
assert.deepEqual(Buffer.from(packed['nightlens-landmark-model'].glb,'base64'),await fs.readFile('public/data/realism/models/petronas-nanoray.glb'));
for(const [id,path] of [
  ['nightlens-gaia-texture','public/data/gaia-sky.png'],
  ['nightlens-moon-texture','public/data/moon-lroc-2025-2k.jpg'],
  ...['diffuse','normal-gl','roughness'].map(name=>[`nightlens-paving-${name}`,`public/data/realism/square-floor-${name}-1k.jpg`]),
  ['nightlens-reference-kl','public/data/realism/kl-tower-petronas-night-reference.jpg'],
  ['nightlens-reference-sydney','public/data/realism/sydney-harbour-reference.jpg'],
]){
  const tag=html.match(new RegExp(`<img[^>]*id="${id}"[^>]*>`))?.[0];assert.ok(tag,id);
  const base64=tag.match(/src="data:image\/[^;]+;base64,([^"]+)"/)?.[1];assert.ok(base64,id);
  assert.deepEqual(Buffer.from(base64,'base64'),await fs.readFile(path));
}
const fonts=await readJson('data/font-assets.json');
for(const face of fonts.faces)assert.ok(html.includes((await fs.readFile(face.publicFile)).toString('base64')),face.publicFile);
assert.equal((html.match(/data:font\/woff2;base64/g)||[]).length,5);
assert.equal((html.match(/<script[^>]+src=/g)||[]).length,0);
console.log(`Verified ${file.length} bytes: production equality, seven scene bundles, model, seven images, five fonts and catalog; no external scripts.`);
