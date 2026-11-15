import { describe, expect, it } from 'vitest';
import { applyExperiment, DEFAULT_SCENARIO, deriveVisualState, formatTime, normalizeScenario, resetScenario, timeLabel } from '../src/lib/scenario';

describe('scheduled nonessential fixture dimming', () => {
  it('keeps baseline output before the exact schedule boundary and activates at it', () => {
    const before = deriveVisualState({ ...DEFAULT_SCENARIO, time: 1199 });
    const boundary = deriveVisualState({ ...DEFAULT_SCENARIO, time: 1200 });
    const after = deriveVisualState({ ...DEFAULT_SCENARIO, time: 1201 });
    expect(before.scheduleActive).toBe(false);
    expect(before.participatingOutput).toBe(1);
    expect(before.illustrativeGlow).toBe(1);
    expect(boundary.scheduleActive).toBe(true);
    expect(boundary.participatingOutput).toBe(0.5);
    expect(after).toEqual(boundary);
  });
  it('reverses the schedule when dragging backward and supports next midnight', () => {
    expect(deriveVisualState({ ...DEFAULT_SCENARIO, time: 1440, scheduleStart: 1440 }).scheduleActive).toBe(true);
    expect(deriveVisualState({ ...DEFAULT_SCENARIO, time: 1439, scheduleStart: 1440 }).scheduleActive).toBe(false);
    expect(deriveVisualState({ ...DEFAULT_SCENARIO, time: 1080 }).participatingOutput).toBe(1);
  });
  it('restores independent default state after all inputs change', () => {
    const changed = resetScenario();
    Object.assign(changed, { time: 1440, scheduleStart: 1080, dimmingPercent: 100, participatingFixturePercent: 0, shieldingEnabled: true, lightColorScenario: 'warm' });
    const reset = resetScenario();
    expect(reset).toEqual(DEFAULT_SCENARIO);
    expect(reset).not.toBe(DEFAULT_SCENARIO);
    reset.time = 1080;
    expect(resetScenario().time).toBe(1260);
  });
  it('is deterministic and does not equate fixture dimming with a skyglow percentage', () => {
    const a = deriveVisualState({ ...DEFAULT_SCENARIO, participatingFixturePercent: 100 });
    expect(a).toEqual(deriveVisualState({ ...DEFAULT_SCENARIO, participatingFixturePercent: 100 }));
    expect(a.aggregateFixtureOutput).toBe(0.5);
    expect(a.illustrativeGlow).not.toBe(0.5);
    expect(a.illustrativeGlow).toBeGreaterThan(0.5);
  });
  it('keeps nonparticipating fixtures and the unchanged background contribution', () => {
    expect(deriveVisualState({ ...DEFAULT_SCENARIO, participatingFixturePercent: 0, shieldingEnabled: true, lightColorScenario: 'warm' }).illustrativeGlow).toBe(1);
    expect(deriveVisualState({ ...DEFAULT_SCENARIO, dimmingPercent: 0 }).aggregateFixtureOutput).toBe(1);
    expect(deriveVisualState({ ...DEFAULT_SCENARIO, dimmingPercent: 100, participatingFixturePercent: 100 }).illustrativeGlow).toBe(0.24);
  });
  it('lets shielding and color change the illustration without changing fixture output', () => {
    const base = deriveVisualState(DEFAULT_SCENARIO);
    const shield = deriveVisualState({ ...DEFAULT_SCENARIO, shieldingEnabled: true });
    const warm = deriveVisualState({ ...DEFAULT_SCENARIO, lightColorScenario: 'warm' });
    expect(shield.participatingOutput).toBe(base.participatingOutput);
    expect(warm.participatingOutput).toBe(base.participatingOutput);
    expect(shield.illustrativeGlow).toBeLessThan(base.illustrativeGlow);
    expect(warm.illustrativeGlow).toBeLessThan(base.illustrativeGlow);
  });
  it('validates finite inputs and clamps valid numeric boundaries', () => {
    expect(() => normalizeScenario({ ...DEFAULT_SCENARIO, time: NaN })).toThrow();
    expect(() => normalizeScenario({ ...DEFAULT_SCENARIO, dimmingPercent: Infinity })).toThrow();
    expect(normalizeScenario({ ...DEFAULT_SCENARIO, time: 2000, participatingFixturePercent: -10, dimmingPercent: 200 })).toMatchObject({ time: 1440, participatingFixturePercent: 0, dimmingPercent: 100 });
  });
  it('formats midnight distinctly and does not confuse minutes with hours', () => {
    expect(formatTime(1200)).toBe('20:00');
    expect(timeLabel(1200)).toBe('8:00 PM');
    expect(timeLabel(1440)).toBe('Midnight');
  });
  it('presets reset unrelated scenario inputs and preserve the chosen time', () => {
    expect(applyExperiment('city', 1180)).toEqual({ ...DEFAULT_SCENARIO, time: 1180 });
    expect(applyExperiment('observatory', 1320)).toMatchObject({ time: 1320, shieldingEnabled: true, lightColorScenario: 'warm' });
    expect(() => applyExperiment('unknown', 1260)).toThrow();
  });
});
