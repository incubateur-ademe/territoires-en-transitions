import { describe, expect, it } from 'vitest';
import { decodeCsv, detectDelimiter, readCsvGrid } from './read-csv-grid';
import { renderGridLines } from './sheet-grid';

const textsOf = (buffer: Buffer): string[][] =>
  readCsvGrid(buffer).cells.map((row) => row.map(({ text }) => text));

describe('readCsvGrid', () => {
  it.each([
    ['point-virgule', 'Axe;Action\nMobilité;Covoiturer, puis pédaler'],
    ['virgule', 'Axe,Action\nMobilité,"Covoiturer, puis pédaler"'],
    ['tabulation', 'Axe\tAction\nMobilité\tCovoiturer, puis pédaler'],
  ])('reconnaît le séparateur %s', (_, csv) => {
    expect(textsOf(Buffer.from(csv, 'utf-8'))).toEqual([
      ['Axe', 'Action'],
      ['Mobilité', 'Covoiturer, puis pédaler'],
    ]);
  });

  it('retire le BOM et garde un retour à la ligne entre guillemets dans sa cellule', () => {
    const grid = readCsvGrid(
      Buffer.from('\uFEFFAxe;Action\r\nMobilité;"Covoiturer\r\net pédaler"\r\n')
    );

    expect(grid.cells[0][0].text).toBe('Axe');
    expect(grid.cells[1][1].text).toBe('Covoiturer\net pédaler');
    expect(renderGridLines(grid).map(({ text }) => text)).toEqual([
      'Axe\tAction',
      'Mobilité\tCovoiturer et pédaler',
    ]);
  });

  it('lit un CSV exporté en windows-1252', () => {
    const latin1 = Buffer.from([
      ...Buffer.from('Axe;Action\nMobilit', 'latin1'),
      0xe9,
      ...Buffer.from(';R', 'latin1'),
      0xe9,
      ...Buffer.from('nover', 'latin1'),
    ]);

    expect(textsOf(latin1)).toEqual([
      ['Axe', 'Action'],
      ['Mobilité', 'Rénover'],
    ]);
  });

  it('numérote les cellules depuis 1 et reconnaît les nombres', () => {
    const grid = readCsvGrid(
      Buffer.from('Action;Budget\nIsoler;12 000\nPlanter;4500,5')
    );

    expect(grid).toMatchObject({
      name: '',
      state: 'visible',
      rowCount: 3,
      colCount: 2,
    });
    expect(grid.cells[2][1]).toMatchObject({
      row: 3,
      col: 2,
      kind: 'number',
      isMergeSlave: false,
    });
    expect(grid.cells[1][1].kind).toBe('text');
  });

  it('ne garde pas les rangées vides de fin', () => {
    expect(readCsvGrid(Buffer.from('A;B\n\n;\n')).rowCount).toBe(1);
    expect(readCsvGrid(Buffer.from('   \n  ')).rowCount).toBe(0);
  });
});

describe('detectDelimiter', () => {
  it('préfère le séparateur régulier à une virgule dans le texte', () => {
    expect(
      detectDelimiter(
        'Axe;Action;Pilote\nA;Isoler, rénover;CC\nB;Planter;CC, Région'
      )
    ).toBe(';');
  });
});

describe('decodeCsv', () => {
  it('lit l’UTF-8 tel quel', () => {
    expect(decodeCsv(Buffer.from('Rénover', 'utf-8'))).toBe('Rénover');
  });
});
