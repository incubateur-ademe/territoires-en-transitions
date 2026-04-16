import { describe, expect, it } from 'vitest';
import { countedPlural, plural } from '@tet/ui/labels/plural';

describe('plural', () => {
  const label = plural({ one: 'élément', other: 'éléments' });

  it('retourne le singulier pour count === 0', () => {
    expect(label({ count: 0 })).toBe('élément');
  });

  it('retourne le singulier pour count === 1', () => {
    expect(label({ count: 1 })).toBe('élément');
  });

  it('retourne le pluriel pour count === 2', () => {
    expect(label({ count: 2 })).toBe('éléments');
  });

  it('retourne le pluriel pour count === -1 (ni 0 ni 1)', () => {
    expect(label({ count: -1 })).toBe('éléments');
  });

  describe('avec zero', () => {
    const labelWithZero = plural({
      zero: 'Aucun filtre',
      one: 'filtre',
      other: 'filtres',
    });

    it('retourne la forme zero pour count === 0', () => {
      expect(labelWithZero({ count: 0 })).toBe('Aucun filtre');
    });

    it('retourne le singulier pour count === 1', () => {
      expect(labelWithZero({ count: 1 })).toBe('filtre');
    });

    it('retourne le pluriel pour count === 5', () => {
      expect(labelWithZero({ count: 5 })).toBe('filtres');
    });
  });

  it('préserve les caractères spéciaux français', () => {
    const l = plural({
      one: 'Élu·e référent·e',
      other: 'Élu·e·s référent·e·s',
    });
    expect(l({ count: 1 })).toBe('Élu·e référent·e');
    expect(l({ count: 3 })).toBe('Élu·e·s référent·e·s');
  });
});

describe('countedPlural', () => {
  const label = countedPlural({ one: 'élément', other: 'éléments' });

  it('préfixe le count au singulier pour count === 0', () => {
    expect(label({ count: 0 })).toBe('0 élément');
  });

  it('préfixe le count au singulier pour count === 1', () => {
    expect(label({ count: 1 })).toBe('1 élément');
  });

  it('préfixe le count au pluriel pour count === 3', () => {
    expect(label({ count: 3 })).toBe('3 éléments');
  });

  it('utilise la forme zero (sans count) pour count === 0 si fournie', () => {
    const labelWithZero = countedPlural({
      zero: 'Aucun filtre',
      one: 'filtre',
      other: 'filtres',
    });
    expect(labelWithZero({ count: 0 })).toBe('Aucun filtre');
    expect(labelWithZero({ count: 1 })).toBe('1 filtre');
    expect(labelWithZero({ count: 5 })).toBe('5 filtres');
  });
});
