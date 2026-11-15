import type { Location } from './astronomy';

export interface AnnualPoint { year: number; value: number | null; validMonths: number }
export interface TrendResult {
  n: number; missingYears: number; status: string;
  startYear?: number; endYear?: number; absoluteChange?: number | null; percentChange?: number | null;
  slopePerYear?: number; interceptAtStart?: number; ci95PerYear?: number[] | null;
  pValue?: number | null; residualLag1?: number | null; method?: string;
}
export interface HistoricalData {
  region: Location; variable: string; parameter: string; units: string; provider: string;
  sourceKind: string; spatialResolution: string; sourceUrl: string; documentationUrl: string;
  retrievedAt: string; sha256: string; sourceHeader: { sources: string[] };
  observations: { year: number; month: number; value: number | null }[];
  annual: AnnualPoint[]; windows: Record<string, TrendResult>;
  processing: { aggregation: string; scaling: string; quality: string; uncertainty: string };
}

export function validateHistoricalData(value: unknown): HistoricalData {
  if (!value || typeof value !== 'object') throw new Error('Missing cached NASA dataset');
  const data = value as HistoricalData;
  const power=data.parameter==='AOD_55'&&data.sourceHeader?.sources?.includes('SYN1DEG')&&data.sourceUrl?.startsWith('https://power.larc.nasa.gov/api/');
  const modis=data.parameter==='MOD08_M3.061.AOD550'&&data.sourceHeader?.sources?.includes('MOD08_M3.061')&&data.sourceUrl?.startsWith('https://giovanni.gsfc.nasa.gov/giovanni/#')&&data.sourceUrl.includes('bbox=100,5,101,6');
  if ((!power&&!modis) || data.units !== 'dimensionless' || !Array.isArray(data.annual) || !data.annual.length || !data.windows) throw new Error('Cached dataset schema or provenance is invalid');
  if (!/^[a-f0-9]{64}$/.test(data.sha256)) throw new Error('Dataset source or checksum is invalid');
  const years = new Set<number>();
  for (const point of data.annual) {
    if (!Number.isInteger(point.year) || years.has(point.year) || (point.value !== null && (!Number.isFinite(point.value) || point.value < 0 || point.validMonths !== 12))) throw new Error('Invalid annual record');
    years.add(point.year);
  }
  return data;
}

export function downloadFile(name: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function evidenceCSV(data: HistoricalData, start: number, end: number): string {
  return [
    `# ${data.provider}; ${data.parameter}; dimensionless; one 1-degree source grid cell`,
    `# Source: ${data.sourceUrl}`, `# Raw SHA256: ${data.sha256}`,
    '# Day-weighted annual mean; 12 valid months required; not nighttime radiance',
    'year,aerosol_optical_depth_550nm,valid_months',
    ...data.annual.filter(p => p.year >= start && p.year <= end).map(p => `${p.year},${p.value ?? ''},${p.validMonths}`),
  ].join('\r\n');
}
