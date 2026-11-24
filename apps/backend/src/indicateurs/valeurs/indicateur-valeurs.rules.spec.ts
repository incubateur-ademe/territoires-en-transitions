import {
  IndicateurPeriodiciteEnum,
  IndicateurValeurCreate,
} from '@tet/domain/indicateurs';
import { describe, expect, it } from 'vitest';
import { IndicateurValeursRules } from './indicateur-valeurs.rules';

describe('IndicateurValeursRules.getCanonicalDateValeur', () => {
  it.each([
    {
      periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
      dateValeur: '2026-12-31',
      expected: '2026-01-01',
    },
    {
      periodicite: IndicateurPeriodiciteEnum.SEMESTRIELLE,
      dateValeur: '2026-07-01',
      expected: '2026-07-01',
    },
    {
      periodicite: IndicateurPeriodiciteEnum.TRIMESTRIELLE,
      dateValeur: '2026-04-01',
      expected: '2026-04-01',
    },
    {
      periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
      dateValeur: '2026-02-01',
      expected: '2026-02-01',
    },
  ] as const)(
    'retourne $expected pour $dateValeur en $periodicite',
    ({ periodicite, dateValeur, expected }) => {
      const canonical = IndicateurValeursRules.getCanonicalDateValeur(
        dateValeur,
        { id: 7, periodicite }
      );

      expect(canonical).toBe(expected);
    }
  );

  it.each([
    {
      periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
      dateValeur: '2026-02-15',
    },
    {
      periodicite: IndicateurPeriodiciteEnum.TRIMESTRIELLE,
      dateValeur: '2026-05-01',
    },
    {
      periodicite: IndicateurPeriodiciteEnum.SEMESTRIELLE,
      dateValeur: '2026-03-01',
    },
    {
      periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
      dateValeur: 'pas-une-date',
    },
  ] as const)(
    'retourne null pour $dateValeur en $periodicite',
    ({ periodicite, dateValeur }) => {
      const canonical = IndicateurValeursRules.getCanonicalDateValeur(
        dateValeur,
        { id: 7, periodicite }
      );

      expect(canonical).toBeNull();
    }
  );
});

describe('IndicateurValeursRules.normalize', () => {
  const valeur: IndicateurValeurCreate = {
    collectiviteId: 1,
    indicateurId: 7,
    dateValeur: '2026-06-15',
    resultat: 12.3456,
    objectif: null,
  };

  it('ramène la date au premier jour de la période et arrondit à la précision', () => {
    const normalized = IndicateurValeursRules.normalize(valeur, {
      id: 7,
      precision: 2,
    });

    expect(normalized).toEqual({
      ...valeur,
      periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
      dateValeur: '2026-01-01',
      resultat: 12.35,
      objectif: null,
    });
  });

  it('retourne null pour une date non canonique pour la périodicité de la valeur', () => {
    const normalized = IndicateurValeursRules.normalize(
      {
        ...valeur,
        periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
        dateValeur: '2026-06-15',
      },
      { id: 7, precision: 2 }
    );

    expect(normalized).toBeNull();
  });
});
