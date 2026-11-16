import { Workbook } from 'exceljs';
import { describe, expect, it } from 'vitest';
import {
  buildUniqueWorksheetNames,
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

describe('buildUniqueWorksheetNames', () => {
  it('garde les noms valides et distincts', () => {
    expect(buildUniqueWorksheetNames(['PCAET', 'Plan vélo'])).toEqual([
      'PCAET',
      'Plan vélo',
    ]);
  });

  it('tronque à 31 caractères', () => {
    const [name] = buildUniqueWorksheetNames(['a'.repeat(40)]);

    expect(name).toBe('a'.repeat(31));
  });

  it('distingue les doublons sans tenir compte de la casse', () => {
    expect(buildUniqueWorksheetNames(['Plan', 'plan', 'PLAN'])).toEqual([
      'Plan',
      'plan (2)',
      'PLAN (3)',
    ]);
  });

  it('distingue les doublons apparus après troncature, sans dépasser 31 caractères', () => {
    const names = buildUniqueWorksheetNames([
      `${'a'.repeat(31)} 2024`,
      `${'a'.repeat(31)} 2025`,
    ]);

    expect(names).toEqual(['a'.repeat(31), `${'a'.repeat(27)} (2)`]);
  });

  it('remplace les caractères interdits', () => {
    expect(buildUniqueWorksheetNames(['Plan 2024/2028 : [v2]'])).toEqual([
      'Plan 2024-2028 - -v2-',
    ]);
  });

  it("retire l'apostrophe en début et en fin de nom", () => {
    expect(buildUniqueWorksheetNames(["'Plan de l'eau'"])).toEqual([
      "Plan de l'eau",
    ]);
  });

  it("retire l'apostrophe laissée en fin de nom par la troncature", () => {
    const [name] = buildUniqueWorksheetNames([
      "Plan d'actions climat-air de l'EPCI",
    ]);

    expect(name).toBe("Plan d'actions climat-air de l");
    expect(() => new Workbook().addWorksheet(name)).not.toThrow();
  });

  it('remplace un nom vide par sa position', () => {
    expect(buildUniqueWorksheetNames(['', '   ', 'PCAET'], 'Plan')).toEqual([
      'Plan 1',
      'Plan 2',
      'PCAET',
    ]);
  });

  it('écarte le nom réservé « History »', () => {
    expect(buildUniqueWorksheetNames(['History'])).toEqual(['History (2)']);
  });

  it('produit des noms acceptés par exceljs', () => {
    const workbook = new Workbook();
    const names = buildUniqueWorksheetNames([
      'Plan',
      'PLAN',
      '',
      'History',
      `${'b'.repeat(40)}`,
      `${'b'.repeat(40)}`,
    ]);

    expect(() =>
      names.forEach((name) => workbook.addWorksheet(name))
    ).not.toThrow();
  });
});
