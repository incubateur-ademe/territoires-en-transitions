import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { extractText } from './extract-text';

const PDF_MIME = 'application/pdf';
const CSV_MIME = 'text/csv';
const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const samplePdf = fs.readFileSync(path.join(__dirname, '__fixtures__/sample.pdf'));

const makeXlsx = async (rows: string[][]): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Feuille');
  rows.forEach((row) => worksheet.addRow(row));
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
};

describe('extractText', () => {
  it('refuse un mime non supporté sans throw', async () => {
    const result = await extractText({
      buffer: Buffer.from('data'),
      mimeType: 'image/png',
    });
    expect(result).toEqual({
      success: false,
      error: { kind: 'unsupported_mime', mimeType: 'image/png' },
    });
  });

  it('extrait le texte d un PDF', async () => {
    const result = await extractText({ buffer: samplePdf, mimeType: PDF_MIME });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('DOCUMENT DE TEST');
    }
  });

  it('renvoie parse_failed sur un PDF invalide', async () => {
    const result = await extractText({
      buffer: Buffer.from('ceci n est pas un pdf'),
      mimeType: PDF_MIME,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.kind).toBe('parse_failed');
    }
  });

  it('reessaie le parsing PDF et reussit apres un echec transitoire', async () => {
    let attempts = 0;
    const result = await extractText({
      buffer: samplePdf,
      mimeType: PDF_MIME,
      parsePdf: async () => {
        attempts += 1;
        if (attempts < 2) {
          throw new Error('bad XRef entry');
        }
        return { text: 'DOCUMENT DE TEST' };
      },
    });
    expect(result).toEqual({ success: true, data: 'DOCUMENT DE TEST' });
    expect(attempts).toBe(2);
  });

  it('renvoie parse_failed avec la cause apres 3 echecs consecutifs', async () => {
    let attempts = 0;
    const cause = new Error('bad XRef entry');
    const result = await extractText({
      buffer: samplePdf,
      mimeType: PDF_MIME,
      parsePdf: async () => {
        attempts += 1;
        throw cause;
      },
    });
    expect(result).toEqual({
      success: false,
      error: { kind: 'parse_failed' },
      cause,
    });
    expect(attempts).toBe(3);
  });

  it('extrait le texte d un CSV', async () => {
    const result = await extractText({
      buffer: Buffer.from('axe;titre\nMobilité;Covoiturage', 'utf-8'),
      mimeType: CSV_MIME,
    });
    expect(result).toEqual({
      success: true,
      data: 'axe;titre\nMobilité;Covoiturage',
    });
  });

  it('renvoie empty_text sur un CSV vide', async () => {
    const result = await extractText({
      buffer: Buffer.from('   \n  ', 'utf-8'),
      mimeType: CSV_MIME,
    });
    expect(result).toEqual({ success: false, error: { kind: 'empty_text' } });
  });

  it('extrait le texte d un Excel en préservant les colonnes (tab)', async () => {
    const buffer = await makeXlsx([
      ['axe', 'titre'],
      ['Mobilité', 'Covoiturage'],
    ]);
    const result = await extractText({ buffer, mimeType: XLSX_MIME });
    expect(result).toEqual({
      success: true,
      data: 'axe\ttitre\nMobilité\tCovoiturage',
    });
  });

  it('inclut les dates et garde les colonnes vides intérieures', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Feuille');
    worksheet.addRow(['Action', '', new Date('2025-03-01T00:00:00.000Z')]);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const result = await extractText({ buffer, mimeType: XLSX_MIME });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('2025-03-01');
      expect(result.data).toContain('Action\t\t');
    }
  });

  it('renvoie empty_text sur un Excel sans contenu', async () => {
    const buffer = await makeXlsx([]);
    const result = await extractText({ buffer, mimeType: XLSX_MIME });
    expect(result).toEqual({ success: false, error: { kind: 'empty_text' } });
  });
});
