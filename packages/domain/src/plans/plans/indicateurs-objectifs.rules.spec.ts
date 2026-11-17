import { describe, expect, it } from 'vitest';
import { IndicateurPeriodiciteEnum } from '../../indicateurs/indicateur/indicateur-periodicite.schema';
import {
  LigneValeurIndicateurObjectif,
  pickDerniereValeur,
  pickObjectif,
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
    ordreAffichage,
    metadonneeId: 1,
    dateVersion: '2024-01-01T00:00:00',
    ...partial,
  });

const ANNUELLE = IndicateurPeriodiciteEnum.ANNUELLE;

describe('pickDerniereValeur', () => {
  it('retient le résultat le plus récent de la collectivité, même si l’open data est plus récent', () => {
    expect(
      pickDerniereValeur(
        [
          ligne({ dateValeur: '2021-01-01', resultat: 10 }),
          ligne({ dateValeur: '2023-01-01', resultat: 12 }),
          ligne({ dateValeur: '2024-01-01', objectif: 5 }),
          openData('rare', 1, { dateValeur: '2024-01-01', resultat: 99 }),
        ],
        ANNUELLE
      )
    ).toEqual({
      valeur: 12,
      dateValeur: '2023-01-01',
      sourceId: 'collectivite',
    });
  });

  it('se replie sur la source open data au plus petit ordre d’affichage', () => {
    expect(
      pickDerniereValeur(
        [
          openData('citepa', 2, { dateValeur: '2023-01-01', resultat: 7 }),
          openData('rare', 1, { dateValeur: '2021-01-01', resultat: 3 }),
          openData('sans-ordre', null, {
            dateValeur: '2024-01-01',
            resultat: 1,
          }),
        ],
        ANNUELLE
      )
    ).toEqual({ valeur: 3, dateValeur: '2021-01-01', sourceId: 'rare' });
  });

  it('entre deux versions d’une même source, garde la plus récente', () => {
    expect(
      pickDerniereValeur(
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
      )?.valeur
    ).toBe(6);
  });

  it('ignore les valeurs d’une autre périodicité que celle de l’indicateur', () => {
    expect(
      pickDerniereValeur(
        [
          ligne({ dateValeur: '2023-01-01', resultat: 12 }),
          ligne({
            periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
            dateValeur: '2024-03-01',
            resultat: 1,
          }),
        ],
        ANNUELLE
      )?.valeur
    ).toBe(12);
  });

  it('renvoie null sans aucun résultat', () => {
    expect(pickDerniereValeur([ligne({ objectif: 3 })], ANNUELLE)).toBeNull();
  });
});

describe('pickObjectif', () => {
  const objectifs = [
    ligne({ dateValeur: '2020-01-01', objectif: 100 }),
    ligne({ dateValeur: '2030-01-01', objectif: 50 }),
    ligne({ dateValeur: '2050-01-01', objectif: 0 }),
  ];

  it('retient le prochain horizon, année courante comprise', () => {
    expect(pickObjectif(objectifs, 2026)).toEqual({ annee: 2030, valeur: 50 });
    expect(pickObjectif(objectifs, 2030)).toEqual({ annee: 2030, valeur: 50 });
  });

  it('retient le dernier horizon quand tous sont passés', () => {
    expect(pickObjectif(objectifs, 2051)).toEqual({ annee: 2050, valeur: 0 });
  });

  it('ne retient jamais une trajectoire open data', () => {
    expect(
      pickObjectif(
        [openData('snbc', 1, { dateValeur: '2030-01-01', objectif: 40 })],
        2026
      )
    ).toBeNull();
  });

  it('garde l’objectif à la date la plus tardive d’un même horizon', () => {
    expect(
      pickObjectif(
        [
          ligne({ dateValeur: '2030-12-01', objectif: 45 }),
          ligne({ dateValeur: '2030-01-01', objectif: 50 }),
        ],
        2026
      )
    ).toEqual({ annee: 2030, valeur: 45 });
  });
});
