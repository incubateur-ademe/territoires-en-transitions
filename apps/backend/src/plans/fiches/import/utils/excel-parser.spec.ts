import * as fs from 'node:fs';
import * as path from 'path';
import { parsePlanExcel } from './excel-parser';

const RESOURCES_DIR = path.join(__dirname, './plan_examples');

describe('Excel Parser Tests', () => {
  const readExcelFile = (filename: string): string => {
    const filePath = path.join(RESOURCES_DIR, filename);
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('base64');
  };

  describe('Valid Excel File', () => {
    it('should successfully parse a valid plan Excel file', async () => {
      const fileContent = readExcelFile('plan_ok.xlsx');
      const result = await parsePlanExcel(fileContent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);

        const firstRow = result.data[0];
        expect(firstRow).toHaveProperty('Axe');
        expect(firstRow).toHaveProperty('SousAxe');
        expect(firstRow).toHaveProperty('TitreFicheAction');
        expect(firstRow).toHaveProperty('Descriptif');
        expect(firstRow).toHaveProperty('InstancesGouvernance');
        expect(firstRow).toHaveProperty('Objectifs');
        expect(firstRow).toHaveProperty('IndicateursLies');
        expect(firstRow).toHaveProperty('StructurePilote');
        expect(firstRow).toHaveProperty('MoyensHumainsTechniques');
        expect(firstRow).toHaveProperty('Partenaires');
        expect(firstRow).toHaveProperty('DirectionOuServicePilote');
        expect(firstRow).toHaveProperty('PersonnePilote');
        expect(firstRow).toHaveProperty('EluReferent');
        expect(firstRow).toHaveProperty('ParticipationCitoyenne');
        expect(firstRow).toHaveProperty('Financements');
        expect(firstRow).toHaveProperty('Financeur1');
        expect(firstRow).toHaveProperty('Montant1');
        expect(firstRow).toHaveProperty('Financeur2');
        expect(firstRow).toHaveProperty('Montant2');
        expect(firstRow).toHaveProperty('Financeur3');
        expect(firstRow).toHaveProperty('Montant3');
        expect(firstRow).toHaveProperty('BudgetPrevisionnel');
        expect(firstRow).toHaveProperty('Statut');
        expect(firstRow).toHaveProperty('NiveauPriorite');
        expect(firstRow).toHaveProperty('DateDebut');
        expect(firstRow).toHaveProperty('DateFin');
        expect(firstRow).toHaveProperty('ActionAmeliorationContinue');
        expect(firstRow).toHaveProperty('Calendrier');
        expect(firstRow).toHaveProperty('ActionsLiees');
        expect(firstRow).toHaveProperty('FichesPlansLiees');
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
