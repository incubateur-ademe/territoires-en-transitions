import { roundTo } from './number.utils';

describe('number helper', () => {
  describe('roundTo', () => {
    it('roundTo for 1.5625', async () => {
      expect(roundTo(1.5625, 3)).toBe(1.563);
    });

    it('roundTo for 0.3375', async () => {
      expect(roundTo(0.3375, 3)).toBe(0.338);
    });

    it('roundTo for 0', async () => {
      expect(roundTo(0, 3)).toBe(0);
    });

    it('roundTo for 2.0', async () => {
      expect(roundTo(2.0, 3)).toBe(2);
    });

    it('roundTo for 2.35', async () => {
      expect(roundTo(2.35, 1)).toBe(2.4);
    });

    it('roundTo for 2.55', async () => {
      expect(roundTo(2.55, 1)).toBe(2.6);
    });
  });
});
