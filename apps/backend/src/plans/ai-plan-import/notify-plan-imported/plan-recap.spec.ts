import { describe, expect, it } from 'vitest';
import { formatPlanRecap } from './plan-recap';

describe('formatPlanRecap', () => {
  it('énumère axes, sous-axes et fiches au pluriel', () => {
    expect(
      formatPlanRecap({ axesCount: 5, sousAxesCount: 11, fichesCount: 224 })
    ).toBe('5 axes, 11 sous-axes, 224 actions et sous-actions');
  });

  it('passe au singulier pour un seul élément', () => {
    expect(
      formatPlanRecap({ axesCount: 1, sousAxesCount: 1, fichesCount: 1 })
    ).toBe('1 axe, 1 sous-axe, 1 action');
  });

  it('omet les niveaux vides', () => {
    expect(
      formatPlanRecap({ axesCount: 2, sousAxesCount: 0, fichesCount: 8 })
    ).toBe('2 axes, 8 actions et sous-actions');
  });

  it('renvoie une chaîne vide pour un plan vide', () => {
    expect(
      formatPlanRecap({ axesCount: 0, sousAxesCount: 0, fichesCount: 0 })
    ).toBe('');
  });
});
