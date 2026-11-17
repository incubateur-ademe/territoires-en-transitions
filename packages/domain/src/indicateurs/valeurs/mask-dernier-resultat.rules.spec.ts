import { describe, expect, it } from 'vitest';
import { maskDernierResultat } from './mask-dernier-resultat.rules';

describe('maskDernierResultat', () => {
  it('masque seulement le résultat le plus récent, objectifs conservés', () => {
    expect(
      maskDernierResultat([
        { dateValeur: '2022-01-01', resultat: 10, objectif: null },
        { dateValeur: '2023-01-01', resultat: 12, objectif: 8 },
        { dateValeur: '2030-01-01', resultat: null, objectif: 5 },
      ])
    ).toEqual([
      { dateValeur: '2022-01-01', resultat: 10, objectif: null },
      { dateValeur: '2023-01-01', resultat: null, objectif: 8 },
      { dateValeur: '2030-01-01', resultat: null, objectif: 5 },
    ]);
  });

  it('laisse les valeurs intactes sans aucun résultat', () => {
    const valeurs = [{ dateValeur: '2030-01-01', resultat: null }];
    expect(maskDernierResultat(valeurs)).toBe(valeurs);
  });
});
