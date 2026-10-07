import { Document, Packer, Paragraph } from 'docx';
import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { detectSourceMimeType } from './detect-source-mime-type';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const realXlsx = async (): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('Plan').addRow(['axe', 'titre']);
  return Buffer.from(await workbook.xlsx.writeBuffer());
};

const realDocx = (): Promise<Buffer> =>
  Packer.toBuffer(
    new Document({
      sections: [{ children: [new Paragraph({ text: 'Axe 1' })] }],
    })
  );

describe('detectSourceMimeType', () => {
  it('reconnait un PDF par sa signature, quel que soit le mime déclaré', () => {
    const pdf = Buffer.from('%PDF-1.7\n...', 'utf-8');
    expect(detectSourceMimeType(pdf, 'application/octet-stream')).toBe(
      'application/pdf'
    );
  });

  it('reconnait un xlsx à sa structure, quel que soit le mime déclaré', async () => {
    expect(
      detectSourceMimeType(await realXlsx(), 'application/octet-stream')
    ).toBe(XLSX_MIME);
  });

  it('reconnait un document Word à sa structure', async () => {
    expect(
      detectSourceMimeType(await realDocx(), 'application/octet-stream')
    ).toBe(DOCX_MIME);
  });

  it('rejette une archive ZIP qui n’est ni un classeur ni un document', () => {
    const zipContainer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x01]);
    expect(
      detectSourceMimeType(zipContainer, 'application/octet-stream')
    ).toBeNull();
  });

  it('reconnait un CSV texte déclaré comme csv', () => {
    const csv = Buffer.from('axe,titre\n1,Action', 'utf-8');
    expect(detectSourceMimeType(csv, 'text/csv')).toBe('text/csv');
  });

  it('reconnait un CSV que Windows déclare comme Excel', () => {
    const csv = Buffer.from('axe,titre\n1,Action', 'utf-8');
    expect(detectSourceMimeType(csv, 'application/vnd.ms-excel')).toBe(
      'text/csv'
    );
  });

  it('rejette un .xls binaire déclaré comme Excel', () => {
    const xls = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0x00, 0x00]);
    expect(detectSourceMimeType(xls, 'application/vnd.ms-excel')).toBeNull();
  });

  it('rejette un binaire déclaré csv mais contenant des octets nuls', () => {
    const binary = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    expect(detectSourceMimeType(binary, 'text/csv')).toBeNull();
  });

  it('rejette un type non supporté', () => {
    const text = Buffer.from('du texte libre', 'utf-8');
    expect(detectSourceMimeType(text, 'application/msword')).toBeNull();
  });
});
