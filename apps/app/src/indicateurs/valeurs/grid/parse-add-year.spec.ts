import { describe, expect, it } from 'vitest';
import { parseAddYear, MIN_ADD_YEAR, MAX_ADD_YEAR } from './parse-add-year';
import { toYear } from './types';

describe('parseAddYear', () => {
  const existing = [toYear(2024), toYear(2030)];

  it('accepte une année libre dans la plage', () => {
    expect(parseAddYear('2040', existing)).toEqual({
      ok: true,
      year: toYear(2040),
    });
  });

  it('rejette non entier / vide', () => {
    expect(parseAddYear('', existing)).toEqual({ ok: false, reason: 'invalid' });
    expect(parseAddYear('20.5', existing)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejette hors bornes', () => {
    expect(parseAddYear(String(MIN_ADD_YEAR - 1), existing)).toEqual({
      ok: false,
      reason: 'out-of-range',
    });
    expect(parseAddYear(String(MAX_ADD_YEAR + 1), existing)).toEqual({
      ok: false,
      reason: 'out-of-range',
    });
  });

  it('rejette doublon', () => {
    expect(parseAddYear('2030', existing)).toEqual({
      ok: false,
      reason: 'duplicate',
    });
  });
});
