import { describe, expect, it } from 'vitest';
import { buildVoletYears, HORIZON_YEARS } from './build-volet-years';
import { toYear } from '../../../indicateurs/valeurs/grid/types';

describe('buildVoletYears', () => {
  it('fusionne référence, horizons et extraYears triés uniques', () => {
    expect(
      buildVoletYears({
        referenceYear: toYear(2024),
        extraYears: [2040, 2030],
      })
    ).toEqual([
      toYear(2024),
      toYear(2030),
      toYear(2036),
      toYear(2040),
      toYear(2050),
    ]);
  });

  it('ignore un extra égal à la référence', () => {
    expect(
      buildVoletYears({
        referenceYear: toYear(2030),
        extraYears: [2030, 2040],
      })
    ).toEqual([toYear(2030), toYear(2036), toYear(2040), toYear(2050)]);
  });

  it('expose les horizons réglementaires', () => {
    expect(HORIZON_YEARS).toEqual([2030, 2036, 2050]);
  });
});
