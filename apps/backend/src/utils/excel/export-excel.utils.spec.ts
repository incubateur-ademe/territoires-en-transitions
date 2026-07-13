import { Workbook } from 'exceljs';
import { describe, expect, it } from 'vitest';
import {
  neutralizeCsvValue,
  sanitizeWorksheetForCsvExport,
} from './export-excel.utils';

describe('neutralizeCsvValue', () => {
  it('préfixe les valeurs commençant par =', () => {
    expect(neutralizeCsvValue('=SUM(A1)')).toBe("'=SUM(A1)");
  });

  it('préfixe les valeurs commençant par +', () => {
    expect(neutralizeCsvValue('+cmd')).toBe("'+cmd");
  });

  it('préfixe les valeurs commençant par -', () => {
    expect(neutralizeCsvValue('-2+3')).toBe("'-2+3");
  });

  it('préfixe les valeurs commençant par @', () => {
    expect(neutralizeCsvValue('@test')).toBe("'@test");
  });

  it('préfixe les valeurs commençant par une tabulation', () => {
    expect(neutralizeCsvValue('\tcmd')).toBe("'\tcmd");
  });

  it('préfixe les valeurs commençant par un retour chariot', () => {
    expect(neutralizeCsvValue('\rcmd')).toBe("'\rcmd");
  });

  it('laisse les valeurs ordinaires inchangées', () => {
    expect(neutralizeCsvValue('texte normal')).toBe('texte normal');
    expect(neutralizeCsvValue('Action 1.1.1')).toBe('Action 1.1.1');
    expect(neutralizeCsvValue('')).toBe('');
  });

  it('ne préfixe pas les valeurs commençant par un chiffre', () => {
    expect(neutralizeCsvValue('42%')).toBe('42%');
  });
});

describe('sanitizeWorksheetForCsvExport', () => {
  it('neutralise les cellules string et laisse les nombres et dates inchangés', () => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('test');
    const date = new Date('2024-06-15');

    worksheet.getCell('A1').value = '=SUM(A1)';
    worksheet.getCell('B1').value = 42;
    worksheet.getCell('C1').value = date;

    sanitizeWorksheetForCsvExport(worksheet);

    expect(worksheet.getCell('A1').value).toBe("'=SUM(A1)");
    expect(worksheet.getCell('B1').value).toBe(42);
    expect(worksheet.getCell('C1').value).toBe(date);
  });
});
