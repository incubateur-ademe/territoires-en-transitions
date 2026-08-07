import { toYear, Year } from '../../../../indicateurs/valeurs/grid/types';

export const HORIZON_YEARS = [2030, 2036, 2050] as const;

export const buildTopicYears = ({
  referenceYear,
  extraYears,
}: {
  referenceYear: Year;
  extraYears: readonly number[];
}): Year[] => {
  const set = new Set<number>([
    referenceYear,
    ...HORIZON_YEARS,
    ...extraYears,
  ]);
  return [...set].sort((a, b) => a - b).map(toYear);
};
