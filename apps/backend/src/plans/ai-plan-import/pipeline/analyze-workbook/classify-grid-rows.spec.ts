import { describe, expect, it } from 'vitest';
import {
  buildHorizontalHierarchyWorkbook,
  buildShortSumRangeSheet,
  buildTestWorkbook,
  buildVerticalHierarchyWorkbook,
  readTestGrids,
  SUIVI_FIRST_DATA_ROW,
} from '../__fixtures__/build-test-workbook';
import { classifyGridRows, findAggregateFormulas } from './classify-grid-rows';
import { detectTableHeader } from './detect-table-header';
import { buildTextGrid, SheetGrid } from './sheet-grid';

const classify = (grid: SheetGrid) =>
  classifyGridRows(grid, detectTableHeader(grid));

const kindsOf = (grid: SheetGrid) =>
  classify(grid).filter(({ kind }) => kind !== 'data');

describe('classifyGridRows', () => {
  it('reconnaît titre, en-tête, bandeaux et totaux d’un tableau de suivi', async () => {
    const grids = await readTestGrids(await buildHorizontalHierarchyWorkbook());
    const suivi = grids.find(({ name }) => name === 'Suivi') as SheetGrid;

    const rows = classify(suivi);

    expect(rows.slice(0, 4)).toEqual([
      { row: 1, kind: 'title' },
      { row: 3, kind: 'header' },
      { row: 4, kind: 'header' },
      {
        row: SUIVI_FIRST_DATA_ROW,
        kind: 'banner',
        text: 'AMBITION n°1 : Pour un territoire sobre en énergie',
      },
    ]);
    expect(rows.filter(({ kind }) => kind === 'banner')).toHaveLength(2);
    expect(rows.slice(-2).map(({ kind }) => kind)).toEqual(['total', 'total']);
    expect(rows.filter(({ kind }) => kind === 'data')).toHaveLength(13);
  });

  it('lit les rangées de titre isolées comme des bandeaux', async () => {
    const [grid] = await readTestGrids(await buildVerticalHierarchyWorkbook());

    expect(kindsOf(grid)).toEqual([
      { row: 1, kind: 'title' },
      { row: 3, kind: 'header' },
      { row: 4, kind: 'banner', text: 'Axe 1 – Mobilité durable' },
      {
        row: 5,
        kind: 'banner',
        text: '1.1 Développer les transports collectifs',
      },
      { row: 8, kind: 'banner', text: '1.2 Encourager les modes actifs' },
      { row: 10, kind: 'banner', text: 'Axe 2 – Habitat économe' },
      { row: 11, kind: 'banner', text: '2.1 Rénover le parc privé' },
    ]);
  });

  it('exclut une rangée « Total » sans formule', () => {
    const grid = buildTextGrid('Plan', [
      ['Action', 'Pilote', 'Budget'],
      ['Créer une ligne de bus express', 'Interco', '1000'],
      ['Aménager des aires de covoiturage', 'Commune', '2000'],
      ['Total', '', '3000'],
    ]);

    expect(kindsOf(grid)).toEqual([
      { row: 1, kind: 'header' },
      { row: 4, kind: 'total' },
    ]);
  });

  it('garde en données les rangées entre une plage de SUM restée courte et sa formule', async () => {
    const [grid] = await readTestGrids(
      await buildTestWorkbook([buildShortSumRangeSheet()])
    );

    expect(kindsOf(grid)).toEqual([
      { row: 1, kind: 'header' },
      { row: 7, kind: 'total' },
    ]);
  });

  it('ne voit aucun bandeau dans une liste d’une seule colonne', () => {
    const grid = buildTextGrid('Feuil2', [
      ['Avancement'],
      ['Non engagée'],
      ['En cours'],
      ['Terminée'],
    ]);

    expect(classify(grid).some(({ kind }) => kind === 'banner')).toBe(false);
  });
});

describe('findAggregateFormulas', () => {
  it('trouve les SUM et COUNTIF qui résument une plage au-dessus d’eux', async () => {
    const grids = await readTestGrids(
      await buildTestWorkbook([
        {
          name: 'Plan',
          rows: [
            ['Action', 'Budget'],
            ['Créer une ligne de bus express', 1000],
            ['Aménager des aires de covoiturage', 2000],
            ['Total', { formula: 'SUM(B2:B3)', result: 3000 }],
            ['Nombre', { formula: 'COUNTIF(A2:A3,"*bus*")', result: 1 }],
          ],
        },
      ])
    );

    expect(findAggregateFormulas(grids[0])).toEqual([
      expect.objectContaining({
        row: 4,
        col: 2,
        top: 2,
        bottom: 3,
        rangeCol: 2,
        result: '3000',
      }),
      expect.objectContaining({ row: 5, col: 2, rangeCol: 1, result: '1' }),
    ]);
  });
});
