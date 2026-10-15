import { sum } from 'es-toolkit';
import { describe, expect, it } from 'vitest';
import { toSharesOf100 } from './to-shares-of-100';

describe('toSharesOf100', () => {
  it('répartit trois valeurs égales sur 100 sans perdre de point', () => {
    const shares = toSharesOf100([1, 1, 1]);

    expect({ shares, total: sum(shares) }).toEqual({
      shares: [34, 33, 33],
      total: 100,
    });
  });

  it('donne le point restant à la plus grande partie décimale', () => {
    expect(toSharesOf100([60.6, 20.2, 19.2])).toEqual([61, 20, 19]);
  });

  it('garde 0 pour une valeur nulle et somme 100 sur les autres', () => {
    const shares = toSharesOf100([0, 2, 1]);

    expect({ shares, total: sum(shares) }).toEqual({
      shares: [0, 67, 33],
      total: 100,
    });
  });

  it('renvoie des zéros quand le total est nul', () => {
    expect(toSharesOf100([0, 0])).toEqual([0, 0]);
  });

  it('renvoie une liste vide pour une liste vide', () => {
    expect(toSharesOf100([])).toEqual([]);
  });
});
