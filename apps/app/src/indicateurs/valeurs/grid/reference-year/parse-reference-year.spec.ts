import { describe, expect, it } from 'vitest';
import {
  maxReferenceYear,
  MIN_REFERENCE_YEAR,
  parseReferenceYear,
} from './parse-reference-year';

describe('parseReferenceYear', () => {
  const current = 2020;
  const years = [2015, 2020, 2024];

  it('accepte une année dans la plage', () => {
    expect(
      parseReferenceYear('2018', {
        currentReferenceYear: current,
        years,
      })
    ).toEqual({ ok: true, year: 2018 });
  });

  it('accepte l’année civile en cours', () => {
    const max = maxReferenceYear();
    expect(
      parseReferenceYear(String(max), {
        currentReferenceYear: current,
        years,
      })
    ).toEqual({ ok: true, year: max });
  });

  it('accepte l’année de référence actuelle (no-op côté caller)', () => {
    expect(
      parseReferenceYear('2020', {
        currentReferenceYear: current,
        years,
      })
    ).toEqual({ ok: true, year: 2020 });
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

  it("accepte une première saisie quand il n'y a pas encore d'année de référence", () => {
    expect(
      parseReferenceYear('2018', {
        currentReferenceYear: null,
        years: [2030, 2036],
      })
    ).toEqual({ ok: true, year: 2018 });
  });
});
