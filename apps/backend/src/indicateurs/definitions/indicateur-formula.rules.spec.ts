import {
  hasIndicateurFormulaChanged,
  normalizeIndicateurFormula,
} from './indicateur-formula.rules';

describe('indicateur formula rules', () => {
  describe('normalizeIndicateurFormula', () => {
    test('normalise la casse et les espaces périphériques', () => {
      expect(normalizeIndicateurFormula(' VAL(a) ')).toBe('val(a)');
    });

    test('normalise les formules absentes ou vides en null', () => {
      expect(normalizeIndicateurFormula(undefined)).toBeNull();
      expect(normalizeIndicateurFormula(null)).toBeNull();
      expect(normalizeIndicateurFormula('   ')).toBeNull();
    });
  });

  describe('hasIndicateurFormulaChanged', () => {
    test('détecte le remplacement et le retrait d une formule', () => {
      expect(hasIndicateurFormulaChanged('val(a)', 'val(b)')).toBe(true);
      expect(hasIndicateurFormulaChanged('val(a)', null)).toBe(true);
    });

    test('ignore les différences de casse, d espaces et les formules vides', () => {
      expect(hasIndicateurFormulaChanged(' VAL(a) ', 'val(A)')).toBe(false);
      expect(hasIndicateurFormulaChanged('   ', null)).toBe(false);
    });
  });
});
