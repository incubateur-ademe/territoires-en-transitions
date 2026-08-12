import { getFormattedNumber, roundTo, sumRoundedTo } from './number.utils';

describe('number helper', () => {
  describe('getFormattedNumber', () => {
    it('sépare les milliers par un espace', () => {
      expect(getFormattedNumber(1234567)).toBe('1 234 567');
    });

    it('laisse les nombres à 3 chiffres intacts', () => {
      expect(getFormattedNumber(999)).toBe('999');
    });

    it('sépare les milliers des nombres négatifs sans détacher le signe', () => {
      expect(getFormattedNumber(-1234)).toBe('-1 234');
    });

    it('affiche les décimales avec une virgule', () => {
      expect(getFormattedNumber(1234.56)).toBe('1 234,56');
    });

    it('ne groupe pas les décimales au-delà de 3 chiffres', () => {
      expect(getFormattedNumber(1234.56789)).toBe('1 234,56789');
    });

    it('rend 0,30000000000000004 sans groupage des décimales', () => {
      expect(getFormattedNumber(0.1 + 0.2)).toBe('0,30000000000000004');
    });
  });

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

  describe('sumRoundedTo', () => {
    it('renvoie 0 sans valeur', () => {
      expect(sumRoundedTo([])).toBe(0);
    });

    it('ignore les valeurs absentes', () => {
      expect(sumRoundedTo([1000, null, undefined, 500])).toBe(1500);
    });

    it('additionne 0,1 et 0,2 en 0,3', () => {
      expect(sumRoundedTo([0.1, 0.2])).toBe(0.3);
    });

    it('additionne 100,10 et 200,20 en 300,30', () => {
      expect(sumRoundedTo([100.1, 200.2])).toBe(300.3);
    });

    it('arrondit au centime sans précision donnée', () => {
      expect(sumRoundedTo([0.004, 0.004])).toBe(0.01);
    });

    it('arrondit à la précision donnée', () => {
      expect(sumRoundedTo([0.1, 0.2], 0)).toBe(0);
    });
  });
});
