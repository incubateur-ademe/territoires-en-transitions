import { describe, expect, it } from 'vitest';
import { computeProgression } from './progression.rules';

describe('computeProgression', () => {
  it('calcule (départ - utilisée) / (départ - attendue)', () => {
    expect(computeProgression(100, 80, 90)).toBe(0.5);
  });

  it('renvoie null si une valeur manque', () => {
    expect(computeProgression(null, 80, 90)).toBeNull();
    expect(computeProgression(100, undefined, 90)).toBeNull();
    expect(computeProgression(100, 80, null)).toBeNull();
  });

  it('renvoie null si le dénominateur est nul', () => {
    expect(computeProgression(100, 100, 90)).toBeNull();
  });
});
