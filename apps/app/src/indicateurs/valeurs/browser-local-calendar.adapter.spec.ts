import { IndicateurPeriods } from '@tet/domain/indicateurs';
import { describe, expect, it } from 'vitest';
import {
  toBrowserLocalCalendarDate,
  toBrowserLocalMidnight,
} from './browser-local-calendar.adapter';

describe('browser local calendar adapter', () => {
  it('reads calendar fields in the browser timezone', () => {
    expect(toBrowserLocalCalendarDate(new Date(2026, 1, 3, 18))).toEqual({
      year: 2026,
      month: 2,
      day: 3,
    });
  });

  it('creates local midnight without interpreting the domain date as UTC', () => {
    const localDate = IndicateurPeriods.toDateValeur(
      IndicateurPeriods.parse('mensuelle', '2026-02')
    );

    const midnight = toBrowserLocalMidnight(localDate);

    expect({
      year: midnight.getFullYear(),
      month: midnight.getMonth() + 1,
      day: midnight.getDate(),
      hours: midnight.getHours(),
    }).toEqual({ year: 2026, month: 2, day: 1, hours: 0 });
  });
});
