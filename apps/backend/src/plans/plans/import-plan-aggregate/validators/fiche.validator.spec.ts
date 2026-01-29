import { describe, expect, it } from 'vitest';
import { ImportFicheInput } from '../schemas/import-fiche.input';
import { validateFiche } from './fiche.validator';
describe('validateFiche', () => {
  const createValidFiche = (
    overrides?: Partial<ImportFicheInput>
  ): ImportFicheInput =>
    ({
      axisPath: ['Axe 1'],
      titre: 'Fiche valide',
      description: 'Description',
      pilotes: [],
      referents: [],
      structures: [],
      services: [],
      financeurs: [],
      partenaires: [],
      ...overrides,
    } as ImportFicheInput);

  describe('Title validation', () => {
    it('should pass for a valid title', async () => {
      const fiche = createValidFiche({ titre: 'Mon titre valide' });

      const result = await validateFiche(fiche);

      expect(result.success).toBe(true);
    });

    it('should fail when title is empty', async () => {
      const fiche = createValidFiche({ titre: '' });

      const result = await validateFiche(fiche);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error._tag).toBe('InvalidFicheTitre');
        expect(result.error.message).toContain('titre');
        if (result.error._tag === 'InvalidFicheTitre') {
          expect(result.error.titre).toBe('');
        }
      }
    });

    it('should fail when title is only whitespace', async () => {
      const fiche = createValidFiche({ titre: '   ' });

      const result = await validateFiche(fiche);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error._tag).toBe('InvalidFicheTitre');
      }
    });

    it('should fail when title is undefined', async () => {
      const fiche = createValidFiche({ titre: undefined as any });

      const result = await validateFiche(fiche);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error._tag).toBe('InvalidFicheTitre');
      }
    });
  });

  describe('Date validation', () => {
    it('should pass when dateDebut is before dateFin', async () => {
      const fiche = createValidFiche({
        dateDebut: new Date('2024-01-01'),
        dateFin: new Date('2024-12-31'),
      });

      const result = await validateFiche(fiche);

      expect(result.success).toBe(true);
    });

    it('should pass when dateDebut equals dateFin', async () => {
      const sameDate = new Date('2024-06-15');
      const fiche = createValidFiche({
        dateDebut: sameDate,
        dateFin: sameDate,
      });

      const result = await validateFiche(fiche);

      expect(result.success).toBe(true);
    });

    it('should fail when dateDebut is after dateFin', async () => {
      const fiche = createValidFiche({
        dateDebut: new Date('2024-12-31'),
        dateFin: new Date('2024-01-01'),
      });

      const result = await validateFiche(fiche);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error._tag).toBe('InvalidDateRange');
        expect(result.error.message).toContain('date');
        if (result.error._tag === 'InvalidDateRange') {
          expect(result.error.dateDebut).toEqual(new Date('2024-12-31'));
          expect(result.error.dateFin).toEqual(new Date('2024-01-01'));
        }
      }
    });

    it('should pass when only dateDebut is provided', async () => {
      const fiche = createValidFiche({
        dateDebut: new Date('2024-01-01'),
        dateFin: undefined,
      });

      const result = await validateFiche(fiche);

      expect(result.success).toBe(true);
    });

    it('should pass when only dateFin is provided', async () => {
      const fiche = createValidFiche({
        dateDebut: undefined,
        dateFin: new Date('2024-12-31'),
      });

      const result = await validateFiche(fiche);

      expect(result.success).toBe(true);
    });

    it('should pass when no dates are provided', async () => {
      const fiche = createValidFiche({
        dateDebut: undefined,
        dateFin: undefined,
      });

      const result = await validateFiche(fiche);

      expect(result.success).toBe(true);
    });
  });

  describe('Budget validation', () => {
    it('should pass for a positive budget', async () => {
      const fiche = createValidFiche({ budget: 10000 });

      const result = await validateFiche(fiche);

      expect(result.success).toBe(true);
    });

    it('should pass for a zero budget', async () => {
      const fiche = createValidFiche({ budget: 0 });

      const result = await validateFiche(fiche);

      expect(result.success).toBe(true);
    });

    it('should fail for a negative budget', async () => {
      const fiche = createValidFiche({ budget: -5000 });

      const result = await validateFiche(fiche);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error._tag).toBe('InvalidBudget');
        expect(result.error.message).toContain('négatif');
        if (result.error._tag === 'InvalidBudget') {
          expect(result.error.value).toBe(-5000);
          expect(result.error.reason).toContain('négatif');
        }
      }
    });

    it('should pass when budget is undefined', async () => {
      const fiche = createValidFiche({ budget: undefined });

      const result = await validateFiche(fiche);

      expect(result.success).toBe(true);
    });
  });

  describe('Multiple validation errors', () => {
    it('should return the first validation error encountered', async () => {
      const fiche = createValidFiche({
        titre: '', // Invalid
        budget: -100, // Also invalid
      });

      const result = await validateFiche(fiche);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Should return title error first (as it's checked first)
        expect(result.error._tag).toBe('InvalidFicheTitre');
      }
    });
  });

  describe('Valid fiche with all fields', () => {
    it('should pass validation for a complete valid fiche', async () => {
      const fiche = createValidFiche({
        titre: 'Fiche complète',
        description: 'Description complète',
        objectifs: 'Objectifs clairs',
        dateDebut: new Date('2024-01-01'),
        dateFin: new Date('2024-12-31'),
        budget: 50000,
        pilotes: ['Pilote 1'],
        referents: ['Référent 1'],
        structures: ['Structure A'],
        services: ['Service B'],
        financeurs: [{ nom: 'ADEME', montant: 25000 }],
        partenaires: ['Partenaire C'],
      });

      const result = await validateFiche(fiche);

      expect(result.success).toBe(true);
    });
  });
});
