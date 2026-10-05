import { describe, expect, it } from 'vitest';
import { toAxisValueLabel } from './axis';

const axis = { name: 'Potentiel', minLabel: 'Faible', maxLabel: 'Fort' };

describe('toAxisValueLabel', () => {
  it("affiche la valeur brute d'un axe sans format", () => {
    expect(toAxisValueLabel(axis, 56)).toBe('56');
  });

  it("passe la valeur par le format de l'axe", () => {
    expect(
      toAxisValueLabel(
        {
          ...axis,
          toValueLabel: (value) => (value >= 50 ? 'Fort' : 'Faible'),
        },
        56
      )
    ).toBe('Fort');
  });
});
