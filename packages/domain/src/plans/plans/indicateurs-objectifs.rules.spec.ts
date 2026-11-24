import { describe, expect, it } from 'vitest';
import { IndicateurPeriodiciteEnum } from '../../indicateurs/indicateur/indicateur-periodicite.schema';
import {
  compareIndicateursObjectifs,
  getHorizonParDefaut,
  LigneValeurIndicateurObjectif,
  listObjectifs,
  pickObjectifAHorizon,
  pickResultats,
} from './indicateurs-objectifs.rules';

const ligne = (
  partial: Partial<LigneValeurIndicateurObjectif>
): LigneValeurIndicateurObjectif => ({
  periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
  dateValeur: '2020-01-01',
  resultat: null,
  objectif: null,
  metadonneeId: null,
  sourceId: null,
  sourceLibelle: null,
  ordreAffichage: null,
  dateVersion: null,
  ...partial,
});

const openData = (
  sourceId: string,
  ordreAffichage: number | null,
  partial: Partial<LigneValeurIndicateurObjectif>
) =>
  ligne({
    sourceId,
    sourceLibelle: `Libellé ${sourceId}`,
    ordreAffichage,
    metadonneeId: 1,
    dateVersion: '2024-01-01T00:00:00',
    ...partial,
  });

const ANNUELLE = IndicateurPeriodiciteEnum.ANNUELLE;

describe('pickResultats', () => {
  it('retient tous les résultats de la collectivité, dans l’ordre, même si l’open data existe', () => {
    expect(
      pickResultats(
        [
          ligne({ dateValeur: '2023-01-01', resultat: 12 }),
          ligne({ dateValeur: '2021-01-01', resultat: 10 }),
          ligne({ dateValeur: '2030-01-01', objectif: 5 }),
          openData('rare', 1, { dateValeur: '2024-01-01', resultat: 99 }),
        ],
        ANNUELLE
      )
    ).toEqual({
      source: { type: 'collectivite' },
      points: [
        { dateValeur: '2021-01-01', valeur: 10 },
        { dateValeur: '2023-01-01', valeur: 12 },
      ],
    });
  });

  it('se replie sur la seule source open data au plus petit ordre d’affichage', () => {
    expect(
      pickResultats(
        [
          openData('citepa', 2, { dateValeur: '2023-01-01', resultat: 7 }),
          openData('rare', 1, { dateValeur: '2021-01-01', resultat: 3 }),
          openData('rare', 1, { dateValeur: '2022-01-01', resultat: 4 }),
          openData('sans-ordre', null, {
            dateValeur: '2024-01-01',
            resultat: 1,
          }),
        ],
        ANNUELLE
      )
    ).toEqual({
      source: { type: 'open-data', libelle: 'Libellé rare' },
      points: [
        { dateValeur: '2021-01-01', valeur: 3 },
        { dateValeur: '2022-01-01', valeur: 4 },
      ],
    });
  });

  it('garde la version la plus récente d’une même date open data', () => {
    expect(
      pickResultats(
        [
          openData('rare', 1, {
            metadonneeId: 1,
            dateVersion: '2023-01-01T00:00:00',
            dateValeur: '2022-01-01',
            resultat: 5,
          }),
          openData('rare', 1, {
            metadonneeId: 2,
            dateVersion: '2024-06-01T00:00:00',
            dateValeur: '2022-01-01',
            resultat: 6,
          }),
        ],
        ANNUELLE
      )?.points
    ).toEqual([{ dateValeur: '2022-01-01', valeur: 6 }]);
  });

  it('ignore les valeurs d’une autre périodicité que celle de l’indicateur', () => {
    expect(
      pickResultats(
        [
          ligne({ dateValeur: '2023-01-01', resultat: 12 }),
          ligne({
            periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
            dateValeur: '2024-03-01',
            resultat: 1,
          }),
        ],
        ANNUELLE
      )?.points
    ).toEqual([{ dateValeur: '2023-01-01', valeur: 12 }]);
  });

  it('masque le dernier résultat de la collectivité à la périodicité de l’indicateur, sans égard aux autres', () => {
    expect(
      pickResultats(
        [
          ligne({ dateValeur: '2022-01-01', resultat: 10 }),
          ligne({ dateValeur: '2023-01-01', resultat: 12 }),
          ligne({
            periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
            dateValeur: '2024-03-01',
            resultat: 1,
          }),
        ],
        ANNUELLE,
        { maskDernierResultatCollectivite: true }
      )?.points
    ).toEqual([{ dateValeur: '2022-01-01', valeur: 10 }]);
  });

  it('ne bascule pas sur l’open data quand le seul résultat de la collectivité est masqué', () => {
    expect(
      pickResultats(
        [
          ligne({ dateValeur: '2023-01-01', resultat: 21 }),
          openData('rare', 1, { dateValeur: '2022-01-01', resultat: 7 }),
        ],
        ANNUELLE,
        { maskDernierResultatCollectivite: true }
      )
    ).toBeNull();
  });

  it('renvoie null sans aucun résultat', () => {
    expect(pickResultats([ligne({ objectif: 3 })], ANNUELLE)).toBeNull();
  });
});

describe('listObjectifs', () => {
  it('liste les objectifs de la collectivité par année, sans trajectoire open data', () => {
    expect(
      listObjectifs([
        ligne({ dateValeur: '2050-01-01', objectif: 0 }),
        ligne({ dateValeur: '2030-12-01', objectif: 45 }),
        ligne({ dateValeur: '2030-01-01', objectif: 50 }),
        openData('snbc', 1, { dateValeur: '2036-01-01', objectif: 40 }),
      ])
    ).toEqual([
      { annee: 2030, valeur: 45 },
      { annee: 2050, valeur: 0 },
    ]);
  });
});

describe('pickObjectifAHorizon', () => {
  const objectifs = [
    { annee: 2026, valeur: 80 },
    { annee: 2030, valeur: 50 },
    { annee: 2050, valeur: 0 },
  ];

  it('retient le dernier objectif fixé jusqu’à l’horizon', () => {
    expect(pickObjectifAHorizon(objectifs, 2030)).toEqual({
      annee: 2030,
      valeur: 50,
    });
    expect(pickObjectifAHorizon(objectifs, 2036)).toEqual({
      annee: 2030,
      valeur: 50,
    });
    expect(pickObjectifAHorizon(objectifs, 2050)).toEqual({
      annee: 2050,
      valeur: 0,
    });
  });

  it('renvoie null sans objectif avant l’horizon', () => {
    expect(pickObjectifAHorizon([{ annee: 2050, valeur: 0 }], 2030)).toBeNull();
  });
});

describe('getHorizonParDefaut', () => {
  it('propose le prochain horizon, sinon le dernier', () => {
    expect(getHorizonParDefaut(2026)).toBe(2030);
    expect(getHorizonParDefaut(2030)).toBe(2030);
    expect(getHorizonParDefaut(2031)).toBe(2036);
    expect(getHorizonParDefaut(2060)).toBe(2050);
  });
});

describe('compareIndicateursObjectifs', () => {
  it('place les favoris en tête, puis trie par titre', () => {
    expect(
      [
        { favori: false, titre: 'Émissions' },
        { favori: true, titre: 'Zéro artificialisation' },
        { favori: false, titre: 'Air' },
        { favori: true, titre: 'Bâtiments' },
      ]
        .toSorted(compareIndicateursObjectifs)
        .map(({ titre }) => titre)
    ).toEqual(['Bâtiments', 'Zéro artificialisation', 'Air', 'Émissions']);
  });
});
