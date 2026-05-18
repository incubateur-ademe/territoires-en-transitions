import { ValeurField, Year } from './types';

export const isResultatEditable = (year: Year, now: number): boolean =>
  year <= now;

export const pasteFieldForYear = (year: Year, now: number): ValeurField =>
  year > now ? 'objectif' : 'resultat';

export const valueFieldsForYear = (
  year: Year,
  now: number
): readonly ValeurField[] =>
  isResultatEditable(year, now) ? ['resultat', 'objectif'] : ['objectif'];

export const valueColumnCountForYears = (
  years: readonly Year[],
  now: number
): number =>
  years.reduce((count, year) => count + valueFieldsForYear(year, now).length, 0);
