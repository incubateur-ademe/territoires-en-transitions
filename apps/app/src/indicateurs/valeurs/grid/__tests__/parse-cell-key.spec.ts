import { describe, expect, it } from 'vitest';
import {
  generateCellKey,
  isCellKey,
  parseCellKey,
  toIndicateurId,
  toYear,
} from '../types';

describe('parseCellKey', () => {
  it('fait le round-trip inverse de generateCellKey', () => {
    const key = generateCellKey(toIndicateurId(12), toYear(2030));
    expect(parseCellKey(key)).toEqual({ indicateurId: 12, year: 2030 });
  });
});

describe('isCellKey', () => {
  it('accepte une clé bien formée', () => {
    expect(isCellKey('12:2030')).toBe(true);
  });

  it('rejette null, un séparateur manquant, une partie vide ou non numérique', () => {
    expect(isCellKey(null)).toBe(false);
    expect(isCellKey('12')).toBe(false);
    expect(isCellKey(':2030')).toBe(false);
    expect(isCellKey('12:')).toBe(false);
    expect(isCellKey('a:2030')).toBe(false);
    expect(isCellKey('12:2030:x')).toBe(false);
  });
});
