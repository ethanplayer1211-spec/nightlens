import fs from 'node:fs';
import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { evidenceCSV, validateHistoricalData } from '../src/lib/data';

describe('challenge-listed Giovanni export',()=>{
  it('validates product provenance independently of POWER and exports the correct source',()=>{
    const data=validateHistoricalData(JSON.parse(fs.readFileSync('public/data/penang-modis.json','utf8')));
    expect(data.windows['2001-2024'].n).toBe(23);
    expect(evidenceCSV(data,2001,2024)).toContain('MODIS Terra');
    expect(evidenceCSV(data,2001,2024)).not.toContain('CERES SYN1deg');
    expect(()=>validateHistoricalData({...data,sourceUrl:'https://example.com/'})).toThrow();
    expect(()=>validateHistoricalData({...data,sourceHeader:{sources:['SYN1DEG']}})).toThrow();
  });
});

describe.each(['penang', 'seoul'])('NASA provenance: %s', region => {
  const raw = fs.readFileSync(`data/raw/power-${region}.json`);
  const source = JSON.parse(raw.toString());
  const data = validateHistoricalData(JSON.parse(fs.readFileSync(`public/data/${region}.json`, 'utf8')));
  it('matches the cached raw checksum and NASA-returned metadata', () => {
    expect(crypto.createHash('sha256').update(raw).digest('hex')).toBe(data.sha256);
    expect(source.parameters.AOD_55.units).toBe('dimensionless');
    expect(source.header.sources).toEqual(['SYN1DEG']);
    expect(data.sourceUrl).toContain('https://power.larc.nasa.gov/api/');
  });
  it('uses actual monthly API values, removes month 13, and preserves missingness', () => {
    expect(data.observations).toHaveLength(288);
    expect(data.annual).toHaveLength(24);
    for (const observation of data.observations) {
      const key = `${observation.year}${String(observation.month).padStart(2, '0')}`;
      const actual = source.properties.parameter.AOD_55[key];
      expect(observation.value).toBe(actual === -999 ? null : actual);
      expect(observation.month).toBeLessThanOrEqual(12);
    }
  });
  it('withholds short-record inference and exports units and provenance', () => {
    expect(data.windows['2020-2024'].pValue).toBeNull();
    expect(data.windows['2020-2024'].ci95PerYear).toBeNull();
    expect(data.windows['2001-2024'].n).toBe(24);
    expect(data.windows['2001-2024'].pValue).toBeGreaterThanOrEqual(0);
    expect(evidenceCSV(data, 2020, 2024)).toContain('dimensionless');
    expect(evidenceCSV(data, 2020, 2024)).toContain(data.sha256);
    expect(evidenceCSV(data, 2020, 2024)).not.toContain('\r\n2019,');
  });
  it('rejects schema, source, unit and invalid-observation corruption', () => {
    expect(() => validateHistoricalData({ ...data, units: 'nW/cm2/sr' })).toThrow();
    expect(() => validateHistoricalData({ ...data, sourceUrl: 'https://example.com' })).toThrow();
    expect(() => validateHistoricalData({ ...data, annual: [] })).toThrow();
    expect(() => validateHistoricalData({ ...data, annual: [{ year: 2020, value: -999, validMonths: 12 }] })).toThrow();
  });
});
