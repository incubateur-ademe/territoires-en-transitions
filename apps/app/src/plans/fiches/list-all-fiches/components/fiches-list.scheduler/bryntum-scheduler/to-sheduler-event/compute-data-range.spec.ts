import { computeDateRange } from './compute-data-range';

describe('computeDateRange', () => {
  it('should return null if both dates are null', () => {
    const result = computeDateRange(null, null);
    expect(result).toBeNull();
  });

  it('should return the date range if both dates are defined', () => {
    const result = computeDateRange(
      new Date('2021-01-01'),
      new Date('2021-01-10')
    );
    expect(result).toEqual([new Date('2021-01-01'), new Date('2021-01-10')]);
  });

  it('should return the date range if only the start date is defined', () => {
    const result = computeDateRange(new Date('2021-01-01'), null);
    expect(result).toEqual([new Date('2021-01-01'), new Date('2021-01-02')]);
  });

  it('should return the date range if only the end date is defined', () => {
    const result = computeDateRange(null, new Date('2021-01-02'));
    expect(result).toEqual([new Date('2021-01-01'), new Date('2021-01-02')]);
  });
});
