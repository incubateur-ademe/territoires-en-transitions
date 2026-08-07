import { describe, expect, it } from 'vitest';
import { buildTopicYears, HORIZON_YEARS } from './build-topic-years';
import { toYear } from '../../../../indicateurs/valeurs/grid/types';

describe('buildTopicYears', () => {
  it('fusionne référence, horizons et extraYears triés uniques', () => {
    expect(
      buildTopicYears({
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
      buildTopicYears({
        referenceYear: toYear(2030),
        extraYears: [2030, 2040],
      })
    ).toEqual([toYear(2030), toYear(2036), toYear(2040), toYear(2050)]);
  });

  it('expose les horizons réglementaires', () => {
    expect(HORIZON_YEARS).toEqual([2030, 2036, 2050]);
  });
});
