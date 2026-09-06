import { describe, expect, it } from 'vitest';
import {
  formatIndicateurPeriod,
  getIndicateurPeriodPresentation,
  IndicateurPeriods,
  indicateurPeriodSchema,
  type IndicateurPeriodicite,
  type LocalCalendarDate,
} from '..';
import { createCalendarMonthStrategy } from './calendar-month-period.strategy';

type StrategyCase = Readonly<{
  periodicite: IndicateurPeriodicite;
  serialized: string;
  dateValeur: string;
  containingDate: string;
  nextSerialized: string;
  endExclusive: string;
}>;

const strategyCasesByPeriodicity = {
  annuelle: {
    periodicite: 'annuelle',
    serialized: '2026',
    dateValeur: '2026-01-01',
    containingDate: '2026-11-23',
    nextSerialized: '2027',
    endExclusive: '2027-01-01',
  },
  mensuelle: {
    periodicite: 'mensuelle',
    serialized: '2026-02',
    dateValeur: '2026-02-01',
    containingDate: '2026-02-23',
    nextSerialized: '2026-03',
    endExclusive: '2026-03-01',
  },
} as const satisfies Record<IndicateurPeriodicite, StrategyCase>;

const strategyCases = Object.values(strategyCasesByPeriodicity);

describe.each(strategyCases)(
  'contrat de la stratégie $periodicite',
  ({
    periodicite,
    serialized,
    dateValeur,
    containingDate,
    nextSerialized,
    endExclusive,
  }) => {
    it('hydrate et déshydrate une période sans perdre sa périodicité', () => {
      const parsed = IndicateurPeriods.parse(periodicite, serialized);

      expect(parsed).toEqual({ periodicite, dateDebut: dateValeur });
      expect(Object.isFrozen(parsed)).toBe(true);
      expect(IndicateurPeriods.serialize(parsed)).toBe(serialized);
      expect(IndicateurPeriods.toDateValeur(parsed)).toBe(dateValeur);
      expect(IndicateurPeriods.fromDateValeur(periodicite, dateValeur)).toEqual(
        parsed
      );
    });

    it('trouve la période qui contient une date locale', () => {
      expect(IndicateurPeriods.containing(periodicite, containingDate)).toEqual(
        IndicateurPeriods.parse(periodicite, serialized)
      );
    });

    it('applique la même arithmétique à next, add et endExclusive', () => {
      const period = IndicateurPeriods.parse(periodicite, serialized);
      const next = IndicateurPeriods.parse(periodicite, nextSerialized);

      expect(IndicateurPeriods.next(period)).toEqual(next);
      expect(IndicateurPeriods.add(next, -1)).toEqual(period);
      expect(IndicateurPeriods.endExclusive(period)).toBe(endExclusive);
      expect(IndicateurPeriods.compare(period, next)).toBeLessThan(0);
    });
  }
);

describe('IndicateurPeriods', () => {
  it('partage une politique de présentation exhaustive entre les runtimes', () => {
    const monthly = IndicateurPeriods.parse('mensuelle', '2026-02');

    expect(formatIndicateurPeriod(monthly, 'fr-FR')).toBe('février 2026');
    expect(getIndicateurPeriodPresentation('mensuelle').chartTimeAxis).toEqual({
      useUTC: true,
      minInterval: 28 * 24 * 60 * 60 * 1000,
      maxInterval: 365 * 24 * 60 * 60 * 1000,
    });
  });

  it('refuse une configuration dont le codec ne peut pas identifier chaque période', () => {
    expect(() =>
      createCalendarMonthStrategy({
        periodicite: 'mensuelle',
        monthsPerPeriod: 3,
        anchorDate: '2000-01-01',
        serialization: 'year',
      })
    ).toThrow('Sérialisation annuelle incompatible');
  });

  it('refuse un ancrage mensuel qui ne commence pas le premier jour', () => {
    expect(() =>
      createCalendarMonthStrategy({
        periodicite: 'mensuelle',
        monthsPerPeriod: 1,
        anchorDate: '2000-01-02',
        serialization: 'year-month',
      })
    ).toThrow('Ancrage calendaire invalide');
  });

  it('distingue dans ses clés une année et le mois de janvier correspondant', () => {
    const annual = IndicateurPeriods.parse('annuelle', '2026');
    const january = IndicateurPeriods.parse('mensuelle', '2026-01');

    expect(IndicateurPeriods.key(annual)).toBe('annuelle:2026');
    expect(IndicateurPeriods.key(january)).toBe('mensuelle:2026-01');
    expect(IndicateurPeriods.key(annual)).not.toBe(
      IndicateurPeriods.key(january)
    );
    expect(IndicateurPeriods.fromKey(IndicateurPeriods.key(january))).toEqual(
      january
    );
  });

  it('expose un parseur sûr pour les clés non fiables', () => {
    expect(IndicateurPeriods.safeFromKey('mensuelle:2026-02')).toEqual({
      success: true,
      period: IndicateurPeriods.parse('mensuelle', '2026-02'),
    });
    expect(IndicateurPeriods.safeFromKey('inconnue:2026')).toMatchObject({
      success: false,
      error: expect.any(Error),
    });
  });

  it('refuse les périodes et dates non canoniques', () => {
    expect(() => IndicateurPeriods.parse('mensuelle', '2026-13')).toThrow(
      'invalide'
    );
    expect(() => IndicateurPeriods.parse('annuelle', '0000')).toThrow(
      'invalide'
    );
    expect(() =>
      IndicateurPeriods.fromDateValeur('mensuelle', '2026-02-02')
    ).toThrow('non canonique');
    expect(() =>
      IndicateurPeriods.fromDateValeur('annuelle', '2026-02-01')
    ).toThrow('non canonique');
    expect(() =>
      IndicateurPeriods.containing('mensuelle', '2025-02-29')
    ).toThrow('invalide');
  });

  it('valide et réhydrate la représentation JSON', () => {
    const result = indicateurPeriodSchema.safeParse({
      periodicite: 'mensuelle',
      dateDebut: '2026-02-01',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(
        IndicateurPeriods.parse('mensuelle', '2026-02')
      );
      expect(Object.isFrozen(result.data)).toBe(true);
    }
    expect(
      indicateurPeriodSchema.safeParse({
        periodicite: 'annuelle',
        dateDebut: '2026-02-01',
      }).success
    ).toBe(false);
  });

  it('refuse de comparer silencieusement deux cadences différentes', () => {
    const annual = IndicateurPeriods.parse('annuelle', '2026');
    const monthly = IndicateurPeriods.parse('mensuelle', '2026-01');

    expect(() => IndicateurPeriods.compare(annual, monthly)).toThrow(
      'Périodicités incompatibles'
    );
    expect(IndicateurPeriods.compareTotal(annual, monthly)).not.toBe(0);
  });

  it('calcule la période courante depuis des parties calendaires explicites', () => {
    const today: LocalCalendarDate = { year: 2026, month: 2, day: 28 };

    expect(IndicateurPeriods.current('annuelle', today)).toEqual(
      IndicateurPeriods.parse('annuelle', '2026')
    );
    expect(IndicateurPeriods.current('mensuelle', today)).toEqual(
      IndicateurPeriods.parse('mensuelle', '2026-02')
    );
    expect(
      IndicateurPeriods.isStarted(
        IndicateurPeriods.parse('mensuelle', '2026-03'),
        today
      )
    ).toBe(false);
  });

  it('gère les années bissextiles et les frontières annuelles sans Date locale', () => {
    expect(IndicateurPeriods.containing('mensuelle', '2024-02-29')).toEqual(
      IndicateurPeriods.parse('mensuelle', '2024-02')
    );
    expect(
      IndicateurPeriods.next(IndicateurPeriods.parse('mensuelle', '2026-12'))
    ).toEqual(IndicateurPeriods.parse('mensuelle', '2027-01'));
    expect(
      IndicateurPeriods.next(IndicateurPeriods.parse('mensuelle', '0001-12'))
    ).toEqual(IndicateurPeriods.parse('mensuelle', '0002-01'));
  });

  it('refuse les déplacements fractionnaires et les dépassements du calendrier', () => {
    const first = IndicateurPeriods.parse('annuelle', '0001');
    const last = IndicateurPeriods.parse('annuelle', '9999');

    expect(() => IndicateurPeriods.add(first, 0.5)).toThrow('entier');
    expect(() => IndicateurPeriods.add(first, -1)).toThrow('bornes');
    expect(() => IndicateurPeriods.next(last)).toThrow('bornes');
  });
});
