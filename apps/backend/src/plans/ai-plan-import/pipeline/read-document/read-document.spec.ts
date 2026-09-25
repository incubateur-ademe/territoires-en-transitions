import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
} from 'docx';
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { buildPage } from '../document/document-page';
import { readDocument } from './read-document';

const PDF_MIME = 'application/pdf';
const CSV_MIME = 'text/csv';
const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const samplePdf = fs.readFileSync(
  path.join(__dirname, '../__fixtures__/sample.pdf')
);

const makeXlsx = async (rows: string[][]): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Feuille');
  rows.forEach((row) => worksheet.addRow(row));
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
};

const pageWith = (text: string) => buildPage(0, [{ text }]);

describe('readDocument', () => {
  it('refuse un mime non supporté sans throw', async () => {
    const result = await readDocument({
      buffer: Buffer.from('data'),
      mimeType: 'image/png',
    });
    expect(result).toEqual({
      success: false,
      error: { kind: 'unsupported_mime', mimeType: 'image/png' },
    });
  });

  it('lit un PDF page par page', async () => {
    const result = await readDocument({
      buffer: samplePdf,
      mimeType: PDF_MIME,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe('pdf');
      expect(result.data.stats).toMatchObject({ pageCount: 1, textPages: 1 });
      expect(result.data.pages[0].text).toContain('DOCUMENT DE TEST');
      expect(result.data.pages[0].height).toBeGreaterThan(0);
    }
  });

  it('renvoie parse_failed sur un PDF invalide', async () => {
    const result = await readDocument({
      buffer: Buffer.from('ceci n est pas un pdf'),
      mimeType: PDF_MIME,
    });
    expect(result).toMatchObject({
      success: false,
      error: { kind: 'parse_failed' },
    });
  });

  it('réessaie la lecture PDF et réussit après un échec transitoire', async () => {
    let attempts = 0;
    const result = await readDocument(
      { buffer: samplePdf, mimeType: PDF_MIME },
      {
        pdfReader: async () => {
          attempts += 1;
          if (attempts < 2) {
            throw new Error('bad XRef entry');
          }
          return [pageWith('DOCUMENT DE TEST')];
        },
      }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pages[0].text).toBe('DOCUMENT DE TEST');
    }
    expect(attempts).toBe(2);
  });

  it('renvoie parse_failed avec la cause après 3 échecs consécutifs', async () => {
    let attempts = 0;
    const cause = new Error('bad XRef entry');
    const result = await readDocument(
      { buffer: samplePdf, mimeType: PDF_MIME },
      {
        pdfReader: async () => {
          attempts += 1;
          throw cause;
        },
      }
    );
    expect(result).toEqual({
      success: false,
      error: { kind: 'parse_failed' },
      cause,
    });
    expect(attempts).toBe(3);
  });

  it('renvoie empty_text quand aucune page ne contient de texte', async () => {
    const result = await readDocument(
      { buffer: samplePdf, mimeType: PDF_MIME },
      { pdfReader: async () => [buildPage(0, []), buildPage(1, [])] }
    );

    expect(result).toEqual({ success: false, error: { kind: 'empty_text' } });
  });

  it('transcrit les pages sans texte quand un OCR est fourni', async () => {
    const ocrPage = vi.fn(async ({ pageIndex }: { pageIndex: number }) =>
      success(`Page ${pageIndex + 1} transcrite`)
    );
    const renderPage = vi.fn(async (pageIndex: number) => ({
      pageIndex,
      mimeType: 'image/jpeg' as const,
      data: Buffer.from('jpeg'),
      width: 10,
      height: 10,
    }));

    const result = await readDocument(
      { buffer: samplePdf, mimeType: PDF_MIME },
      {
        pdfReader: async () => [pageWith('Texte lu'), buildPage(1, [])],
        ocr: { ocrPage, policy: { minCharsPerPage: 5 } },
        renderPage,
      }
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stats).toMatchObject({ textPages: 1, ocrPages: 1 });
      expect(result.data.pages[1].text).toBe('Page 2 transcrite');
    }
    expect(renderPage).toHaveBeenCalledWith(1);
    expect(ocrPage).toHaveBeenCalledTimes(1);
  });

  it('refuse un document scanné plus long que la limite, sans appeler l’OCR', async () => {
    const ocrPage = vi.fn();

    const result = await readDocument(
      { buffer: samplePdf, mimeType: PDF_MIME },
      {
        pdfReader: async () => [buildPage(0, []), buildPage(1, [])],
        ocr: { ocrPage, policy: { maxOcrPages: 1 } },
      }
    );

    expect(result).toEqual({
      success: false,
      error: { kind: 'scanned_too_long', scannedPages: 2, maxOcrPages: 1 },
    });
    expect(ocrPage).not.toHaveBeenCalled();
  });

  it('lit un Word : titres en Markdown, une page par titre de niveau 1, tableaux ligne à ligne', async () => {
    const cell = (text: string) =>
      new TableCell({ children: [new Paragraph({ text })] });
    const buffer = await Packer.toBuffer(
      new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: 'Axe 1 : Bâtiments',
                heading: HeadingLevel.HEADING_1,
              }),
              new Paragraph({ text: 'Rénover & isoler.' }),
              new Paragraph({
                text: 'Action 1.1.1 : Isoler',
                heading: HeadingLevel.HEADING_2,
              }),
              new Table({
                rows: [
                  new TableRow({
                    children: [cell('Pilote'), cell('Service bâtiments')],
                  }),
                ],
              }),
              new Paragraph({
                text: 'Axe 2 : Mobilité',
                heading: HeadingLevel.HEADING_1,
              }),
            ],
          },
        ],
      })
    );

    const result = await readDocument({ buffer, mimeType: DOCX_MIME });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe('docx');
      expect(result.data.pages.map((page) => page.label)).toEqual([
        'Axe 1 : Bâtiments',
        'Axe 2 : Mobilité',
      ]);
      expect(result.data.pages[0].lines.map((line) => line.text)).toEqual([
        '# Axe 1 : Bâtiments',
        'Rénover & isoler.',
        '## Action 1.1.1 : Isoler',
        'Pilote\tService bâtiments',
      ]);
    }
  });

  it('lit un CSV sur une seule page', async () => {
    const result = await readDocument({
      buffer: Buffer.from('axe;titre\nMobilité;Covoiturage', 'utf-8'),
      mimeType: CSV_MIME,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe('csv');
      expect(result.data.pages.map((page) => page.text)).toEqual([
        'axe;titre\nMobilité;Covoiturage',
      ]);
    }
  });

  it('renvoie empty_text sur un CSV vide', async () => {
    const result = await readDocument({
      buffer: Buffer.from('   \n  ', 'utf-8'),
      mimeType: CSV_MIME,
    });
    expect(result).toEqual({ success: false, error: { kind: 'empty_text' } });
  });

  it('lit un Excel, une page par feuille, colonnes séparées par une tabulation', async () => {
    const buffer = await makeXlsx([
      ['axe', 'titre'],
      ['Mobilité', 'Covoiturage'],
    ]);
    const result = await readDocument({ buffer, mimeType: XLSX_MIME });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pages).toHaveLength(1);
      expect(result.data.pages[0].label).toBe('Feuille');
      expect(result.data.pages[0].text).toBe(
        'axe\ttitre\nMobilité\tCovoiturage'
      );
    }
  });

  it('inclut les dates et garde les colonnes vides intérieures', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Feuille');
    worksheet.addRow(['Action', '', new Date('2025-03-01T00:00:00.000Z')]);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const result = await readDocument({ buffer, mimeType: XLSX_MIME });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pages[0].text).toContain('2025-03-01');
      expect(result.data.pages[0].text).toContain('Action\t\t');
    }
  });

  it('renvoie empty_text sur un Excel sans contenu', async () => {
    const buffer = await makeXlsx([]);
    const result = await readDocument({ buffer, mimeType: XLSX_MIME });
    expect(result).toEqual({ success: false, error: { kind: 'empty_text' } });
  });
});
