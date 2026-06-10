import { describe, expect, it } from 'vitest';
import { detectSourceMimeType } from './detect-source-mime-type';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

describe('detectSourceMimeType', () => {
  it('reconnait un PDF par sa signature, quel que soit le mime déclaré', () => {
    const pdf = Buffer.from('%PDF-1.7\n...', 'utf-8');
    expect(detectSourceMimeType(pdf, 'application/octet-stream')).toBe(
      'application/pdf'
    );
  });

  it('reconnait un xlsx par la signature ZIP', () => {
    const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x01]);
    expect(detectSourceMimeType(zip, 'application/octet-stream')).toBe(
      XLSX_MIME
    );
  });

  it('reconnait un CSV texte déclaré comme csv', () => {
    const csv = Buffer.from('axe,titre\n1,Action', 'utf-8');
    expect(detectSourceMimeType(csv, 'text/csv')).toBe('text/csv');
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
