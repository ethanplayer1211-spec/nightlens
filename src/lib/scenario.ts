export type LightColorScenario = 'warm' | 'cool';

/** Minutes since the selected local calendar day's midnight; 1440 is next midnight. */
export interface CityScenario {
  time: number;
  scheduleStart: number;
  dimmingPercent: number;
  participatingFixturePercent: number;
  shieldingEnabled: boolean;
  lightColorScenario: LightColorScenario;
}

export const DEFAULT_SCENARIO: Readonly<CityScenario> = Object.freeze({
  time: 1260, scheduleStart: 1200, dimmingPercent: 50,
  participatingFixturePercent: 70, shieldingEnabled: false, lightColorScenario: 'cool',
});

function bounded(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) throw new RangeError('Scenario values must be finite');
  return Math.min(max, Math.max(min, value));
}

export function normalizeScenario(input: CityScenario): CityScenario {
  if (input.lightColorScenario !== 'warm' && input.lightColorScenario !== 'cool') throw new RangeError('Unknown lighting color scenario');
  if (typeof input.shieldingEnabled !== 'boolean') throw new TypeError('Shielding must be a boolean');
  return {
    time: Math.round(bounded(input.time, 1080, 1440)),
    scheduleStart: Math.round(bounded(input.scheduleStart, 1080, 1440)),
    dimmingPercent: bounded(input.dimmingPercent, 0, 100),
    participatingFixturePercent: bounded(input.participatingFixturePercent, 0, 100),
    shieldingEnabled: input.shieldingEnabled,
    lightColorScenario: input.lightColorScenario,
  };
}

export function resetScenario(): CityScenario { return { ...DEFAULT_SCENARIO }; }

/** Artistic transfer function, NOT a physical skyglow, energy, or visibility model. */
export function deriveVisualState(input: CityScenario) {
  const scenario = normalizeScenario(input);
  const scheduleActive = scenario.time >= scenario.scheduleStart;
  const participation = scenario.participatingFixturePercent / 100;
  const participatingOutput = scheduleActive ? 1 - scenario.dimmingPercent / 100 : 1;
  const aggregateFixtureOutput = 1 - participation * (1 - participatingOutput);
  // Square-root tone mapping and an unchanged background floor deliberately avoid
  // representing a dimming percentage as the same percentage of skyglow reduction.
  // The shielding/color coefficients are design choices, explicitly uncalibrated.
  const fixtureContribution = (1 - participation) + participation * participatingOutput
    * (scenario.shieldingEnabled ? 0.62 : 1)
    * (scenario.lightColorScenario === 'warm' ? 0.87 : 1);
  const illustrativeGlow = 0.24 + 0.76 * Math.sqrt(fixtureContribution);
  return {
    scheduleActive, participatingOutput, aggregateFixtureOutput,
    illustrativeGlow,
    warmth: scenario.lightColorScenario === 'warm' ? participation : 0,
    changed: fixtureContribution < 1,
  };
}

export function formatTime(minutes: number): string {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = Math.round(minutes % 60);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function timeLabel(minutes: number): string {
  if (minutes === 1440) return 'Midnight';
  const hour = Math.floor(minutes / 60) % 24;
  return `${hour % 12 || 12}:${String(Math.round(minutes % 60)).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export const EXPERIMENTS: { id: string; name: string; description: string; values: Partial<CityScenario> }[] = [
  { id: 'city', name: 'City After Dark', description: 'A scheduled, 50% dimming experiment.', values: { scheduleStart: 1200, dimmingPercent: 50, participatingFixturePercent: 70 } },
  { id: 'shield', name: 'Shield the Streets', description: 'Explore downward-directed fixtures.', values: { dimmingPercent: 30, participatingFixturePercent: 85, shieldingEnabled: true } },
  { id: 'warm', name: 'Warmer Nights', description: 'Explore a warmer lighting palette.', values: { dimmingPercent: 30, participatingFixturePercent: 80, lightColorScenario: 'warm' } },
  { id: 'observatory', name: 'Protect the Observatory', description: 'Combine dimming, shielding and warmth.', values: { scheduleStart: 1140, dimmingPercent: 60, participatingFixturePercent: 90, shieldingEnabled: true, lightColorScenario: 'warm' } },
];

export function applyExperiment(id: string, time: number): CityScenario {
  const preset = EXPERIMENTS.find(p => p.id === id);
  if (!preset) throw new RangeError('Unknown experiment');
  return normalizeScenario({ ...DEFAULT_SCENARIO, time, ...preset.values });
}
