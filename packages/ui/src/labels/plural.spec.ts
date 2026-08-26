import { describe, expect, it } from 'vitest';
import { plural } from './plural';

describe('plural', () => {
  const label = plural({ one: 'élément', other: 'éléments' });

  describe('avec count', () => {
    it('préfixe le count au singulier pour count === 0', () => {
      expect(label({ count: 0 })).toBe('0 élément');
    });

    it('préfixe le count au singulier pour count === 1', () => {
      expect(label({ count: 1 })).toBe('1 élément');
    });

    it('préfixe le count au pluriel pour count === 3', () => {
      expect(label({ count: 3 })).toBe('3 éléments');
    });

    it('préfixe le count au pluriel pour count === -1 (ni 0 ni 1)', () => {
      expect(label({ count: -1 })).toBe('-1 éléments');
    });
  });

  describe('avec count et zero', () => {
    const labelWithZero = plural({
      zero: 'Aucun filtre',
      one: 'filtre',
      other: 'filtres',
    });

    it('retourne la forme zero pour count === 0', () => {
      expect(labelWithZero({ count: 0 })).toBe('Aucun filtre');
    });

    it('préfixe le count au singulier pour count === 1', () => {
      expect(labelWithZero({ count: 1 })).toBe('1 filtre');
    });

    it('préfixe le count au pluriel pour count === 5', () => {
      expect(labelWithZero({ count: 5 })).toBe('5 filtres');
    });
  });

  describe('avec plural boolean', () => {
    it('retourne le pluriel pour plural === true', () => {
      expect(label({ plural: true })).toBe('éléments');
    });

    it('retourne le singulier pour plural === false', () => {
      expect(label({ plural: false })).toBe('élément');
    });
  });

  describe('sans paramètre', () => {
    it('retourne le singulier', () => {
      expect(label()).toBe('élément');
    });
  });

  it('préserve les caractères spéciaux français', () => {
    const l = plural({
      one: 'Élu·e référent·e',
      other: 'Élu·e·s référent·e·s',
    });
    expect(l({ count: 1 })).toBe('1 Élu·e référent·e');
    expect(l({ count: 3 })).toBe('3 Élu·e·s référent·e·s');
    expect(l({ plural: true })).toBe('Élu·e·s référent·e·s');
    expect(l()).toBe('Élu·e référent·e');
  });
});
