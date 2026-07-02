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
  it('range les cellules de la matrice par ligne puis par colonne', () => {
    expect(navigableKeys).toEqual([
      ['1:2030', '1:2036'],
      ['2:2030', '2:2036'],
      ['3:2030', '3:2036'],
    ]);
  });
});

describe('getNextNavKey', () => {
  it('descend d\'une ligne dans la même colonne', () => {
    expect(getNextNavKey(navigableKeys, '1:2030', 'down')).toBe('2:2030');
  });

  it('monte d\'une ligne dans la même colonne', () => {
    expect(getNextNavKey(navigableKeys, '3:2036', 'up')).toBe('2:2036');
  });

  it('avance et recule en ordre ligne-major (Tab)', () => {
    expect(getNextNavKey(navigableKeys, '1:2036', 'next')).toBe('2:2030');
    expect(getNextNavKey(navigableKeys, '2:2030', 'previous')).toBe('1:2036');
  });

  it('rend null au bord de la grille', () => {
    expect(getNextNavKey(navigableKeys, '3:2036', 'down')).toBe(null);
    expect(getNextNavKey(navigableKeys, '1:2030', 'up')).toBe(null);
  });

  it('rend null pour une cellule inconnue', () => {
    expect(getNextNavKey(navigableKeys, '9:2030', 'down')).toBe(null);
  });
});
