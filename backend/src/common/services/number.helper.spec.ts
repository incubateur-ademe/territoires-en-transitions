import { roundTo } from './number.helper';

describe('number helper', () => {
  describe('roundTo', () => {
    it('roundTo for 1.5625', async () => {
      expect(roundTo(1.5625, 3)).toBe(1.563);
    });

    it('roundTo for 0.3375', async () => {
      expect(roundTo(0.3375, 3)).toBe(0.338);
    });
  });
});
