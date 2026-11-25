import { describe, expect, it } from 'vitest';
import { toOpenDataByIndicateurId } from './sous-indicateurs-open-data.rules';

const EXCLUDED = ['collectivite', 'snbc'];

const toIndicateur = ({
  id,
  sources,
}: {
  id: number;
  sources: Record<
    string,
    { libelle: string; valeurs: { dateValeur: string; resultat?: number }[] }
  >;
}) => ({ definition: { id }, sources });

describe('toOpenDataByIndicateurId', () => {
  it('garde les sources open data avec leur libellé et écarte la collectivité et les trajectoires', () => {
    const openData = toOpenDataByIndicateurId({
      indicateurs: [
        toIndicateur({
          id: 224,
          sources: {
            collectivite: {
              libelle: 'Collectivité',
              valeurs: [{ dateValeur: '2009-01-01', resultat: 20 }],
            },
            snbc: {
              libelle: 'SNBC',
              valeurs: [{ dateValeur: '2030-01-01', resultat: 5 }],
            },
            insee: {
              libelle: 'INSEE',
              valeurs: [{ dateValeur: '2009-01-01', resultat: 18.13 }],
            },
          },
        }),
      ],
      moyennes: [],
      excludedSourceIds: EXCLUDED,
    });

    expect(openData.get(224)).toEqual({
      sources: [
        {
          id: 'insee',
          label: 'INSEE',
          valeurs: [
            { dateValeur: '2009-01-01', resultat: 18.13, objectif: null },
          ],
        },
      ],
      moyenne: null,
    });
  });

  it("ajoute la moyenne des collectivités de même type d'un indicateur sans source open data", () => {
    const openData = toOpenDataByIndicateurId({
      indicateurs: [],
      moyennes: [
        {
          indicateurId: 336,
          valeurs: [{ dateValeur: '2014-01-01', valeur: 33.75 }],
        },
      ],
      excludedSourceIds: EXCLUDED,
    });

    expect(openData.get(336)).toEqual({
      sources: [],
      moyenne: { valeurs: [{ dateValeur: '2014-01-01', valeur: 33.75 }] },
    });
  });

  it("n'a aucune entrée pour un indicateur sans valeur open data ni moyenne", () => {
    const openData = toOpenDataByIndicateurId({
      indicateurs: [
        toIndicateur({
          id: 315,
          sources: {
            insee: { libelle: 'INSEE', valeurs: [] },
            collectivite: {
              libelle: 'Collectivité',
              valeurs: [{ dateValeur: '2020-01-01', resultat: 1 }],
            },
          },
        }),
      ],
      moyennes: [{ indicateurId: 315, valeurs: [] }],
      excludedSourceIds: EXCLUDED,
    });

    expect(openData.has(315)).toBe(false);
  });
});
