import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { validateOoxmlArchive } from './validate-ooxml-archive';

const GENEROUS_CAP = 100 * 1024 * 1024;

const toRealXlsx = async (): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Plan');
  sheet.addRow(['axe', 'titre']);
  sheet.addRow(['Axe 1', 'Action']);
  return Buffer.from(await workbook.xlsx.writeBuffer());
};

const toForgedArchive = (
  entries: { name: string; uncompressedBytes: number }[]
): Buffer => {
  const localStub = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
  const directory = Buffer.concat(
    entries.map(({ name, uncompressedBytes }) => {
      const nameBuffer = Buffer.from(name, 'utf-8');
      const header = Buffer.alloc(46);
      header.writeUInt32LE(0x02014b50, 0);
      header.writeUInt32LE(uncompressedBytes, 24);
      header.writeUInt16LE(nameBuffer.length, 28);
      return Buffer.concat([header, nameBuffer]);
    })
  );
  const endOfDirectory = Buffer.alloc(22);
  endOfDirectory.writeUInt32LE(0x06054b50, 0);
  endOfDirectory.writeUInt16LE(entries.length, 10);
  endOfDirectory.writeUInt32LE(directory.length, 12);
  endOfDirectory.writeUInt32LE(localStub.length, 16);
  return Buffer.concat([localStub, directory, endOfDirectory]);
};

describe('validateOoxmlArchive', () => {
  it('accepte un xlsx réel sous le plafond', async () => {
    const xlsx = await toRealXlsx();

    expect(validateOoxmlArchive(xlsx, GENEROUS_CAP)).toEqual({
      success: true,
      data: { kind: 'xlsx' },
    });
  });

  it('rejette un xlsx réel dont les tailles déclarées dépassent le plafond', async () => {
    const xlsx = await toRealXlsx();

    const result = validateOoxmlArchive(xlsx, 10);

    expect(result).toMatchObject({
      success: false,
      error: { kind: 'uncompressed_too_large' },
    });
  });

  it('reconnaît un document Word à sa structure', () => {
    const docx = toForgedArchive([
      { name: '[Content_Types].xml', uncompressedBytes: 100 },
      { name: 'word/document.xml', uncompressedBytes: 100 },
    ]);

    expect(validateOoxmlArchive(docx, GENEROUS_CAP)).toEqual({
      success: true,
      data: { kind: 'docx' },
    });
  });

  it('rejette une archive Office sans classeur ni document', () => {
    const other = toForgedArchive([
      { name: '[Content_Types].xml', uncompressedBytes: 100 },
      { name: 'ppt/presentation.xml', uncompressedBytes: 100 },
    ]);

    expect(validateOoxmlArchive(other, GENEROUS_CAP)).toEqual({
      success: false,
      error: { kind: 'not_ooxml' },
    });
  });

  it('rejette une bombe déclarant des tailles décompressées énormes', () => {
    const bomb = toForgedArchive([
      { name: '[Content_Types].xml', uncompressedBytes: 100 },
      { name: 'xl/sharedStrings.xml', uncompressedBytes: 4_000_000_000 },
    ]);

    const result = validateOoxmlArchive(bomb, GENEROUS_CAP);

    expect(result).toEqual({
      success: false,
      error: { kind: 'uncompressed_too_large', declaredBytes: 4_000_000_100 },
    });
  });

  it("rejette un buffer qui n'est pas une archive zip", () => {
    const text = Buffer.from('pas un zip du tout', 'utf-8');

    expect(validateOoxmlArchive(text, GENEROUS_CAP)).toEqual({
      success: false,
      error: { kind: 'not_ooxml' },
    });
  });

  it('rejette une archive déclarant plus de 4096 entrées', () => {
    const archive = toForgedArchive([
      { name: '[Content_Types].xml', uncompressedBytes: 100 },
    ]);
    archive.writeUInt16LE(60_000, archive.length - 22 + 10);

    expect(validateOoxmlArchive(archive, GENEROUS_CAP)).toEqual({
      success: false,
      error: { kind: 'not_ooxml' },
    });
  });
});
