import { describe, expect, it } from 'vitest';
import { createCalendarMonthStrategy } from './calendar-month-period.strategy';
import { IndicateurPeriodeErrorEnum } from './indicateur-periode.errors';
import { IndicateurPeriodes } from './indicateur-periodes';

describe('annual calendar operations', () => {
  it.each([1, 1999, 2024])(
    'advances year %i without a timezone or epoch offset',
    (year) => {
      const period = IndicateurPeriodes.fromYear(year);
      const next = IndicateurPeriodes.fromYear(year + 1);
      expect(IndicateurPeriodes.next(period)).toEqual(next);
      expect(IndicateurPeriodes.add(next, -1)).toEqual(period);
      expect(IndicateurPeriodes.endExclusive(period)).toBe(next.dateDebut);
      expect(IndicateurPeriodes.compare(period, next)).toBeLessThan(0);
    }
  );

  it('round-trips keys and reports invalid keys without losing the error', () => {
    const period = IndicateurPeriodes.fromYear(2026);
    expect(IndicateurPeriodes.fromKey(IndicateurPeriodes.key(period))).toEqual(
      period
    );
    expect(IndicateurPeriodes.safeFromKey('annuelle:2026')).toEqual({
      success: true,
      period,
    });
    expect(IndicateurPeriodes.safeFromKey('inconnue:2026')).toMatchObject({
      success: false,
      error: {
        code: IndicateurPeriodeErrorEnum.INDICATEUR_PERIODICITE_UNKNOWN,
      },
    });
    expect(() => IndicateurPeriodes.fromKey('2026')).toThrow(
      IndicateurPeriodeErrorEnum.INDICATEUR_PERIODE_KEY_INVALID
    );
  });

  it('classifies annual periods from explicit calendar parts on a leap day', () => {
    const date = { year: 2024, month: 2, day: 29 };
    const current = IndicateurPeriodes.fromYear(2024);
    expect(IndicateurPeriodes.current('annuelle', date)).toEqual(current);
    expect(IndicateurPeriodes.isStarted(current, date)).toBe(true);
    expect(
      IndicateurPeriodes.isStarted(IndicateurPeriodes.next(current), date)
    ).toBe(false);
  });

  it('rejects fractional offsets and calendar overflow', () => {
    const first = IndicateurPeriodes.fromYear(1);
    expect(() => IndicateurPeriodes.add(first, 0.5)).toThrow(
      IndicateurPeriodeErrorEnum.INDICATEUR_PERIODE_OFFSET_INVALID
    );
    expect(() => IndicateurPeriodes.add(first, -1)).toThrow(
      IndicateurPeriodeErrorEnum.INDICATEUR_CALENDAR_OUT_OF_RANGE
    );
    expect(() =>
      IndicateurPeriodes.next(IndicateurPeriodes.fromYear(9999))
    ).toThrow(IndicateurPeriodeErrorEnum.INDICATEUR_CALENDAR_OUT_OF_RANGE);
  });

  it.each([
    {
      monthsPerPeriod: 0,
      anchorDate: '2000-01-01',
      error: IndicateurPeriodeErrorEnum.INDICATEUR_CALENDAR_STEP_INVALID,
    },
    {
      monthsPerPeriod: 12,
      anchorDate: '2000-01-02',
      error: IndicateurPeriodeErrorEnum.INDICATEUR_CALENDAR_ANCHOR_INVALID,
    },
    {
      monthsPerPeriod: 6,
      anchorDate: '2000-01-01',
      error:
        IndicateurPeriodeErrorEnum.INDICATEUR_PERIODE_SERIALIZATION_INCOMPATIBLE,
    },
  ])(
    'rejects incompatible annual strategy configuration: $error',
    ({ error, ...configuration }) => {
      expect(() =>
        createCalendarMonthStrategy({
          periodicite: 'annuelle',
          serialization: 'year',
          ...configuration,
        })
      ).toThrow(error);
    }
  );
});
