import { ValeurField, Year } from './types';

export const isResultatEditable = (year: Year, now: number): boolean =>
  year <= now;

export const isObjectifEditable = (_year: Year, _now: number): boolean => true;

export const pasteFieldForYear = (year: Year, now: number): ValeurField =>
  year > now ? 'objectif' : 'resultat';
