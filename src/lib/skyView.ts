import type { SkyCalculation } from './astronomy';
import type { SkyFilters } from './skyAppearance';
import type { LocalHorizon } from './horizon';
import type { CityScene } from './cityScene';
import type {ReactNode} from 'react';

export interface SkyCamera { azimuth: number; altitude: number; fieldOfView: number }
export interface ImmersiveSkyProps {
  sky: SkyCalculation;
  onAfterMidnight?:()=>void;onComparisonToggle?:()=>void;enterViewRequest?:number;onNightPreview?:()=>void;localClockLabel?:string;
  onLightingTheme?:(id:string)=>void;lightTheme?:string;
  controlPanel?:ReactNode;onImmersiveChange?:(value:boolean)=>void;midnightPresetSelected?:boolean;
  onAnnotationsChange?:(value:boolean)=>void;
  /** Row-major matrix mapping east/up/north world vectors to Galactic x/y/z. */
  worldToGalactic: number[];
  camera: SkyCamera;
  onCameraChange: (camera: SkyCamera) => void;
  lightPollution: number;
  compareLightPollution: number;
  comparison: boolean;
  split: number;
  onSplitChange: (value: number) => void;
  showLabels: boolean;
  showConstellations: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Relative artistic cloud contrast knob, not measured optical depth. */
  cloudCover: number;
  filters: SkyFilters;
  fixtureGlare: number;
  fixtureOutput: number;
  warmth: number;
  cityLightPercent: number;
  horizonData: LocalHorizon | null;
  baselineLabel: string;
  scene?:CityScene|null;
}

export const DEFAULT_CAMERA: SkyCamera = { azimuth: 180, altitude: 27, fieldOfView: 105 };

export function normalizeCamera(camera: SkyCamera): SkyCamera {
  if (![camera.azimuth, camera.altitude, camera.fieldOfView].every(Number.isFinite)) throw new RangeError('Invalid camera');
  return { azimuth: ((camera.azimuth % 360) + 360) % 360, altitude: Math.max(-85, Math.min(85, camera.altitude)), fieldOfView: Math.max(8, Math.min(125, camera.fieldOfView)) };
}

/** Aim along an above-horizon part of the Galactic plane, without moving the survey. */
export function galacticView(matrix: number[]): SkyCamera {
  let best = { azimuth: 180, altitude: 0, fieldOfView: 105 }, bestAltitude = -90;
  for (let longitude = 0; longitude < 360; longitude += 3) {
    const angle = longitude * Math.PI / 180;
    const x = Math.cos(angle), y = Math.sin(angle);
    // Orthogonal rotation inverse is its transpose.
    const east = matrix[0] * x + matrix[3] * y;
    const up = matrix[1] * x + matrix[4] * y;
    const north = matrix[2] * x + matrix[5] * y;
    const altitude = Math.asin(Math.max(-1, Math.min(1, up))) * 180 / Math.PI;
    if (altitude > bestAltitude) { bestAltitude = altitude; best = { azimuth: Math.atan2(east, north) * 180 / Math.PI, altitude: Math.min(62, altitude), fieldOfView: 105 }; }
  }
  return normalizeCamera(best);
}

/** Perspective coordinates shared by the WebGL sky and projected catalog symbols. */
export function projectPerspective(altitude: number, azimuth: number, camera: SkyCamera, width: number, height: number) {
  const rad = Math.PI / 180;
  const az = camera.azimuth * rad, alt = camera.altitude * rad;
  const objectAlt = altitude * rad, objectAz = azimuth * rad;
  const point = [Math.cos(objectAlt) * Math.sin(objectAz), Math.sin(objectAlt), Math.cos(objectAlt) * Math.cos(objectAz)];
  const forward = [Math.cos(alt) * Math.sin(az), Math.sin(alt), Math.cos(alt) * Math.cos(az)];
  const right = [Math.cos(az), 0, -Math.sin(az)];
  const up = [-Math.sin(alt) * Math.sin(az), Math.cos(alt), -Math.sin(alt) * Math.cos(az)];
  const dot = (a: number[], b: number[]) => a.reduce((sum, v, i) => sum + v * b[i], 0);
  const depth = dot(point, forward);
  if (depth <= 0 || width <= 0 || height <= 0) return null;
  const tangent = Math.tan(camera.fieldOfView * rad / 2);
  const x = width / 2 * (1 + dot(point, right) / (depth * tangent));
  const y = height / 2 * (1 - dot(point, up) / (depth * tangent * height / width));
  return { x, y, visible: x >= -20 && x <= width + 20 && y >= -20 && y <= height + 20 };
}
