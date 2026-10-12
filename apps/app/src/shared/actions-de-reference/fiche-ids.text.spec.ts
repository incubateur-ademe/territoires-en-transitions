import { describe, expect, it } from 'vitest';
import { isFicheIdsText, toFicheIds, toFicheIdsText } from './fiche-ids.text';

describe('isFicheIdsText', () => {
  it.each(['', '   ', '12', '12,34', ' 12 ,  34 ', '2147483647'])(
    'accepte « %s »',
    (text) => {
      expect(isFicheIdsText(text)).toBe(true);
    }
  );

  it.each([
    '0',
    '-3',
    '1.5',
    'abc',
    '12,abc',
    '12,',
    ',12',
    '12,,34',
    '12 34',
    '2147483648',
  ])('refuse « %s »', (text) => {
    expect(isFicheIdsText(text)).toBe(false);
  });
});

describe('toFicheIds', () => {
  it('rend une liste vide pour un texte vide ou fait d espaces', () => {
    expect([toFicheIds(''), toFicheIds('   ')]).toEqual([[], []]);
  });

  it('rend les ids dans l ordre de saisie, espaces ignorés', () => {
    expect(toFicheIds(' 34 ,12,  7')).toEqual([34, 12, 7]);
  });

  it('garde les doublons saisis', () => {
    expect(toFicheIds('12,12')).toEqual([12, 12]);
  });
});

describe('toFicheIdsText', () => {
  it('sépare les ids par une virgule et une espace', () => {
    expect(toFicheIdsText([34, 12, 7])).toBe('34, 12, 7');
  });

  it('rend un texte vide pour aucun id', () => {
    expect(toFicheIdsText([])).toBe('');
  });

  it('rend un texte que toFicheIds relit à l identique', () => {
    expect(toFicheIds(toFicheIdsText([34, 12, 7]))).toEqual([34, 12, 7]);
  });
});
