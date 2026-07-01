import { describe, expect, it } from 'vitest';
import { parseCellNumber } from '../parse-cell-number';

describe('parseCellNumber', () => {
  it('rend null pour une saisie vide', () => {
    expect(parseCellNumber('')).toBe(null);
    expect(parseCellNumber('   ')).toBe(null);
  });

  it('lit un entier et un decimal', () => {
    expect(parseCellNumber('42')).toBe(42);
    expect(parseCellNumber('-3')).toBe(-3);
  });

  it('accepte la virgule francaise et tout separateur d espace', () => {
    expect(parseCellNumber('12,5')).toBe(12.5);
    expect(parseCellNumber('1 000')).toBe(1000);
    expect(parseCellNumber('1 000')).toBe(1000);
    expect(parseCellNumber('1 000')).toBe(1000);
  });

  it('rend null pour une saisie non numerique', () => {
    expect(parseCellNumber('abc')).toBe(null);
    expect(parseCellNumber('1.2.3')).toBe(null);
  });
});
