import { describe, expect, it } from 'vitest';
import { buildNavigableKeys, getNextNavKey } from './grid-navigation';
import { GridRowGroup, toIndicateurId, toYear } from '../types';

const years = [2030, 2036].map(toYear);

const groups: GridRowGroup[] = [
  {
    id: 'g',
    label: 'G',
    rows: [
      { indicateurId: toIndicateurId(1), label: 'A' },
      { indicateurId: toIndicateurId(2), label: 'B' },
      { indicateurId: toIndicateurId(3), label: 'C' },
    ],
  },
];

const navigableKeys = buildNavigableKeys({ groups, years });

describe('buildNavigableKeys', () => {
  it('range les cellules de la matrice par ligne puis par colonne champ', () => {
    expect(navigableKeys).toEqual([
      ['1:2030:resultat', '1:2030:objectif', '1:2036:resultat', '1:2036:objectif'],
      ['2:2030:resultat', '2:2030:objectif', '2:2036:resultat', '2:2036:objectif'],
      ['3:2030:resultat', '3:2030:objectif', '3:2036:resultat', '3:2036:objectif'],
    ]);
  });
});

describe('getNextNavKey', () => {
  it('descend d\'une ligne dans la même colonne', () => {
    expect(getNextNavKey(navigableKeys, '1:2030:resultat', 'down')).toBe(
      '2:2030:resultat'
    );
  });

  it('monte d\'une ligne dans la même colonne', () => {
    expect(getNextNavKey(navigableKeys, '3:2036:objectif', 'up')).toBe(
      '2:2036:objectif'
    );
  });

  it('avance et recule en ordre ligne-major (Tab)', () => {
    expect(getNextNavKey(navigableKeys, '1:2036:objectif', 'next')).toBe(
      '2:2030:resultat'
    );
    expect(getNextNavKey(navigableKeys, '2:2030:resultat', 'previous')).toBe(
      '1:2036:objectif'
    );
  });

  it('rend null au bord de la grille', () => {
    expect(getNextNavKey(navigableKeys, '3:2036:objectif', 'down')).toBe(null);
    expect(getNextNavKey(navigableKeys, '1:2030:resultat', 'up')).toBe(null);
  });

  it('rend null pour une cellule inconnue', () => {
    expect(getNextNavKey(navigableKeys, '9:2030:resultat', 'down')).toBe(null);
  });
});
