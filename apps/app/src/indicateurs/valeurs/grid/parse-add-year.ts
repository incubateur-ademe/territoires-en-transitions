import { toYear, Year } from './types';

export const MIN_ADD_YEAR = 1990;
export const MAX_ADD_YEAR = 2100;

export type ParseAddYearResult =
  | { ok: true; year: Year }
  | { ok: false; reason: 'invalid' | 'duplicate' | 'out-of-range' };

export const parseAddYear = (
  raw: string,
  existingYears: readonly Year[]
): ParseAddYearResult => {
  const trimmed = raw.trim();
  if (!/^\d{4}$/.test(trimmed)) {
    return { ok: false, reason: 'invalid' };
  }
  const value = Number(trimmed);
  if (value < MIN_ADD_YEAR || value > MAX_ADD_YEAR) {
    return { ok: false, reason: 'out-of-range' };
  }
  const year = toYear(value);
  if (existingYears.includes(year)) {
    return { ok: false, reason: 'duplicate' };
  }
  return { ok: true, year };
};
