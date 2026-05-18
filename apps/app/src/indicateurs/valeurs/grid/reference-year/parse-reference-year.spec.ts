import { describe, expect, it } from 'vitest';
import {
  maxReferenceYear,
  MIN_REFERENCE_YEAR,
  parseReferenceYear,
} from './parse-reference-year';
import { toYear } from '../types';

describe('parseReferenceYear', () => {
  const current = toYear(2020);
  const years = [toYear(2015), toYear(2020), toYear(2024)];

  it('accepte une année dans la plage', () => {
    expect(
      parseReferenceYear('2018', {
        currentReferenceYear: current,
        years,
      })
    ).toEqual({ ok: true, year: toYear(2018) });
  });

  it('accepte l’année civile en cours', () => {
    const max = maxReferenceYear();
    expect(
      parseReferenceYear(String(max), {
        currentReferenceYear: current,
        years,
      })
    ).toEqual({ ok: true, year: toYear(max) });
  });

  it('accepte l’année de référence actuelle (no-op côté caller)', () => {
    expect(
      parseReferenceYear('2020', {
        currentReferenceYear: current,
        years,
      })
    ).toEqual({ ok: true, year: toYear(2020) });
  });

  it('rejette non entier / vide', () => {
    expect(
      parseReferenceYear('', { currentReferenceYear: current, years })
    ).toEqual({ ok: false, reason: 'invalid' });
    expect(
      parseReferenceYear('20.5', { currentReferenceYear: current, years })
    ).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejette hors bornes', () => {
    expect(
      parseReferenceYear(String(MIN_REFERENCE_YEAR - 1), {
        currentReferenceYear: current,
        years,
      })
    ).toEqual({ ok: false, reason: 'out-of-range' });
    expect(
      parseReferenceYear(String(maxReferenceYear() + 1), {
        currentReferenceYear: current,
        years,
      })
    ).toEqual({ ok: false, reason: 'out-of-range' });
  });

  it('rejette une année déjà affichée autre que la référence', () => {
    expect(
      parseReferenceYear('2015', {
        currentReferenceYear: current,
        years,
      })
    ).toEqual({ ok: false, reason: 'duplicate' });
  });
});
