import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import {
  buildHorizontalHierarchyWorkbook,
  buildTestWorkbook,
  SUIVI_FIRST_DATA_ROW,
} from '../__fixtures__/build-test-workbook';
import {
  MAX_GRID_COLS,
  MAX_GRID_ROWS,
  readWorkbookGrids,
  referencedSheets,
} from './read-workbook-grid';
import {
  getCellValue,
  getGridCell,
  renderGridLines,
  SheetGrid,
} from './sheet-grid';

const readGrids = async (buffer: Buffer): Promise<SheetGrid[]> => {
  const result = await readWorkbookGrids(buffer);
  if (!result.success) {
    throw new Error(result.error.kind);
  }
  return result.data;
};

const sheetNamed = (grids: SheetGrid[], name: string): SheetGrid => {
  const grid = grids.find((candidate) => candidate.name === name);
  if (!grid) {
    throw new Error(`Onglet absent : ${name}`);
  }
  return grid;
};

describe('readWorkbookGrids', () => {
  it('garde chaque onglet non vide, dans l’ordre du classeur', async () => {
    const grids = await readGrids(await buildHorizontalHierarchyWorkbook());

    expect(grids.map(({ name, state }) => [name, state])).toEqual([
      ['Synthèse', 'visible'],
      ['Suivi', 'visible'],
      ['Mobilité', 'visible'],
      ['Feuil2', 'visible'],
    ]);
  });

  it('relie chaque esclave de fusion à son maître, rendue vide', async () => {
    const suivi = sheetNamed(
      await readGrids(await buildHorizontalHierarchyWorkbook()),
      'Suivi'
    );
    const first = SUIVI_FIRST_DATA_ROW + 1;
    const master = getGridCell(suivi, first, 2);
    const slave = getGridCell(suivi, first + 1, 2);

    expect(master).toMatchObject({
      text: 'Se déplacer moins et mieux',
      row: first,
      col: 2,
      isMergeSlave: false,
    });
    expect(slave).toMatchObject({
      text: '',
      row: first + 1,
      col: 2,
      masterRow: first,
      masterCol: 2,
      isMergeSlave: true,
      merge: { top: first, left: 2, right: 2 },
    });
    expect(slave && getCellValue(suivi, slave)).toBe(
      'Se déplacer moins et mieux'
    );
    expect(getGridCell(suivi, 3, 9)).toMatchObject({
      isMergeSlave: true,
      masterRow: 3,
      masterCol: 8,
      merge: { top: 3, bottom: 3, left: 8, right: 11 },
    });
  });

  it('garde la formule, son résultat en cache et les onglets qu’elle cite', async () => {
    const grids = await readGrids(await buildHorizontalHierarchyWorkbook());
    const synthese = sheetNamed(grids, 'Synthèse');
    const suivi = sheetNamed(grids, 'Suivi');

    expect(getGridCell(synthese, 4, 3)).toMatchObject({
      text: '2',
      kind: 'number',
      formula: expect.stringMatching(/^COUNTIF\(Suivi!L5:L\d+,"En projet"\)$/),
      refsSheets: ['Suivi'],
    });
    expect(getGridCell(synthese, 5, 3)?.refsSheets).toEqual(['Mobilité']);
    const totals = suivi.cells.find((row) => row[6]?.text.startsWith('Nombre'));
    expect(totals?.[7]).toMatchObject({
      kind: 'number',
      formula: expect.stringMatching(/^COUNTIF\(H5:H\d+,"X"\)$/),
    });
    expect(totals?.[7].refsSheets).toBeUndefined();
  });

  it('lit vide une cellule en erreur, et une date sans heure en AAAA-MM-JJ', async () => {
    const [grid] = await readGrids(
      await buildTestWorkbook([
        {
          name: 'Plan',
          rows: [
            [
              { error: '#REF!' },
              new Date(Date.UTC(2025, 5, 30)),
              { formula: 'A1', result: 'x' },
            ],
          ],
        },
      ])
    );

    expect(grid.cells[0].map(({ text, kind }) => [text, kind])).toEqual([
      ['', 'error'],
      ['2025-06-30', 'date'],
      ['x', 'text'],
    ]);
  });

  it('lit l’état masqué d’un onglet, les nombres et les textes nettoyés', async () => {
    const grids = await readGrids(
      await buildTestWorkbook([
        { name: 'Visible', rows: [['Action\u00A0 1', 12]] },
        { name: 'Cachée', state: 'hidden', rows: [['Brouillon']] },
        { name: 'Vide', rows: [] },
      ])
    );

    expect(grids.map(({ name, state }) => [name, state])).toEqual([
      ['Visible', 'visible'],
      ['Cachée', 'hidden'],
    ]);
    expect(grids[0].cells[0].map(({ text, kind }) => [text, kind])).toEqual([
      ['Action 1', 'text'],
      ['12', 'number'],
    ]);
  });

  it('rend une rangée par ligne : esclaves vides, retours à la ligne aplatis', async () => {
    const [grid] = await readGrids(
      await buildTestWorkbook([
        {
          name: 'Plan',
          rows: [
            ['Axe', 'Action', 'Détail'],
            ['Mobilité', 'Covoiturer', 'Première ligne\nseconde ligne'],
            [null, 'Pédaler', 'Pistes'],
          ],
          merges: ['A2:A3'],
        },
      ])
    );

    expect(renderGridLines(grid)).toEqual([
      { row: 1, text: 'Axe\tAction\tDétail' },
      { row: 2, text: 'Mobilité\tCovoiturer\tPremière ligne seconde ligne' },
      { row: 3, text: '\tPédaler\tPistes' },
    ]);
    expect(getGridCell(grid, 2, 3)?.text).toBe('Première ligne\nseconde ligne');
  });

  it('borne la grille à une valeur égarée tout au bout de la feuille', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Plan');
    worksheet.getCell('A1').value = 'Fiche';
    worksheet.getCell('XFD1048576').value = 'égarée';
    worksheet.mergeCells('B1:B6000');
    const [grid] = await readGrids(
      Buffer.from(await workbook.xlsx.writeBuffer())
    );

    expect(grid.rowCount).toBe(MAX_GRID_ROWS);
    expect(grid.colCount).toBe(MAX_GRID_COLS);
    expect(grid.truncatedFrom).toEqual({
      rowCount: 1048576,
      colCount: 16384,
    });
    expect(grid.merges).toEqual([
      { top: 1, left: 2, bottom: MAX_GRID_ROWS, right: 2 },
    ]);
  });

  it('refuse un fichier qui n’est pas un classeur', async () => {
    expect(await readWorkbookGrids(Buffer.from('pas un xlsx'))).toEqual({
      success: false,
      error: { kind: 'parse_failed' },
    });
  });
});

describe('referencedSheets', () => {
  it('relève les onglets cités, entre apostrophes ou non, sauf le sien', () => {
    expect(
      referencedSheets(
        "Suivi!H434+'Dév. Eco'!B2+'L''Onglet'!A1+Synthèse!A1+Dév.Eco!C3",
        'Synthèse'
      )
    ).toEqual(['Suivi', 'Dév. Eco', "L'Onglet", 'Dév.Eco']);
  });
});
