import * as fs from 'node:fs';
import * as path from 'path';
import { parsePlanExcel } from './excel-parser';

const RESOURCES_DIR = path.join(__dirname, '../__fixtures__');

describe('Excel Parser Tests', () => {
  const readExcelFile = (filename: string): string => {
    const filePath = path.join(RESOURCES_DIR, filename);
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('base64');
  };

  describe('Valid Excel File', () => {
    it('should successfully parse a valid plan Excel file', async () => {
      const fileContent = readExcelFile('one_fiche_plan.xlsx');
      const result = await parsePlanExcel(fileContent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);

        const firstRow = result.data[0];
        expect(firstRow).toHaveProperty('Axe');
        expect(firstRow).toHaveProperty('SousAxe');
        expect(firstRow).toHaveProperty('SousSousAxe');
        expect(firstRow).toHaveProperty('titre');
        expect(firstRow).toHaveProperty('description');
        expect(firstRow).toHaveProperty('instanceGouvernance');
        expect(firstRow).toHaveProperty('objectifs');
        expect(firstRow).toHaveProperty('indicateurs');
        expect(firstRow).toHaveProperty('structures');
        expect(firstRow).toHaveProperty('resources');
        expect(firstRow).toHaveProperty('partenaires');
        expect(firstRow).toHaveProperty('services');
        expect(firstRow).toHaveProperty('pilotes');
        expect(firstRow).toHaveProperty('referents');
        expect(firstRow).toHaveProperty('participation');
        expect(firstRow).toHaveProperty('financements');
        expect(firstRow).toHaveProperty('Financeur1');
        expect(firstRow).toHaveProperty('Montant1');
        expect(firstRow).toHaveProperty('Financeur2');
        expect(firstRow).toHaveProperty('Montant2');
        expect(firstRow).toHaveProperty('Financeur3');
        expect(firstRow).toHaveProperty('Montant3');
        expect(firstRow).toHaveProperty('budget');
        expect(firstRow).toHaveProperty('status');
        expect(firstRow).toHaveProperty('priorite');
        expect(firstRow).toHaveProperty('dateDebut');
        expect(firstRow).toHaveProperty('dateFin');
      }
    });
  });

  describe('Invalid Excel Files', () => {
    it('should fail when columns are incorrect', async () => {
      const fileContent = readExcelFile('plan_column_order_issue.xlsx');
      const result = await parsePlanExcel(fileContent);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toEqual(
          'La colonne B devrait être "Sous-axe (x.x)" et non "Sous-sous axe (x.x.x)"'
        );
      }
    });
  });

  describe('Edge Cases', () => {
    it('should fail when file is not a valid Excel file', async () => {
      const result = await parsePlanExcel('not-a-valid-base64');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('erreur');
      }
    });

    it('should fail when file is empty base64', async () => {
      const result = await parsePlanExcel('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('erreur');
      }
    });
  });
});
