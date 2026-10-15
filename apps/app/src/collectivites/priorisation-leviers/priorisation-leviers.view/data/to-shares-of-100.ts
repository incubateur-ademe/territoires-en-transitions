import { orderBy, sum } from 'es-toolkit';

const SHARES_TOTAL = 100;

export const toSharesOf100 = (values: readonly number[]): number[] => {
  const total = sum([...values]);
  if (total <= 0) {
    return values.map(() => 0);
  }
  const exactShares = values.map((value) => (value / total) * SHARES_TOTAL);
  const flooredShares = exactShares.map(Math.floor);
  const missingPoints = SHARES_TOTAL - sum(flooredShares);
  const indexesToRoundUp = new Set(
    orderBy(
      exactShares.map((exact, index) => ({
        index,
        remainder: exact - flooredShares[index],
      })),
      ['remainder'],
      ['desc']
    )
      .slice(0, missingPoints)
      .map(({ index }) => index)
  );
  return flooredShares.map((floored, index) =>
    indexesToRoundUp.has(index) ? floored + 1 : floored
  );
};
