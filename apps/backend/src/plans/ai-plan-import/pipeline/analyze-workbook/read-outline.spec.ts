import { describe, expect, it } from 'vitest';
import {
  buildDeepNumberingWorkbook,
  readTestGrids,
} from '../__fixtures__/build-test-workbook';
import { ClassifiedRow, classifyGridRows } from './classify-grid-rows';
import { detectTableHeader } from './detect-table-header';
import { readBannerPaths, readOutline } from './read-outline';
import { buildTextGrid, SheetGrid } from './sheet-grid';

const outlineOf = (grid: SheetGrid) =>
  readOutline(grid, classifyGridRows(grid, detectTableHeader(grid)));

const data = (row: number): ClassifiedRow => ({ row, kind: 'data' });
const banner = (row: number, text: string): ClassifiedRow => ({
  row,
  kind: 'banner',
  text,
});

describe('readOutline', () => {
  it('lit les axes, les fiches et leurs sous-actions d’une numérotation profonde', async () => {
    const [grid] = await readTestGrids(await buildDeepNumberingWorkbook());

    const outline = outlineOf(grid);

    expect(outline.isOutline).toBe(true);
    expect(
      outline.rows
        .filter(({ kind }) => kind === 'banner')
        .map(({ row, text }) => [row, text])
    ).toEqual([
      [2, 'Sobriété énergétique'],
      [3, 'Patrimoine public'],
      [8, 'Énergies renouvelables'],
      [9, 'Solaire'],
    ]);
    expect([...outline.levels]).toEqual([
      [2, 1],
      [3, 2],
      [8, 1],
      [9, 2],
    ]);
    expect([...outline.subRows]).toEqual([
      [4, [5, 6]],
      [10, [11]],
    ]);
  });

  it('prend la profondeur la plus fine quand aucune ne porte d’attribut', () => {
    const outline = outlineOf(
      buildTextGrid('Plan', [
        ['N°', 'Intitulé'],
        ['1', 'Sobriété énergétique'],
        ['1.1', 'Rénover les écoles du territoire'],
        ['1.2', 'Passer l’éclairage public en LED'],
        ['2', 'Énergies renouvelables'],
        ['2.1', 'Solariser les toitures des gymnases'],
      ])
    );

    expect(outline.isOutline).toBe(true);
    expect([...outline.levels]).toEqual([
      [2, 1],
      [5, 1],
    ]);
    expect(outline.subRows.size).toBe(0);
  });

  it('n’est pas un plan numéroté à une seule profondeur', () => {
    const grid = buildTextGrid('Plan', [
      ['N°', 'Intitulé', 'Pilote'],
      ['1', 'Rénover les écoles du territoire', 'Bâtiments'],
      ['2', 'Passer l’éclairage public en LED', 'Voirie'],
      ['3', 'Solariser les toitures des gymnases', 'Énergie'],
    ]);
    const rows = classifyGridRows(grid, detectTableHeader(grid));

    const outline = readOutline(grid, rows);

    expect(outline).toMatchObject({ isOutline: false, rows });
    expect(outline.levels.size).toBe(0);
  });

  it('ne prend pas des valeurs décimales pour une numérotation', () => {
    const outline = outlineOf(
      buildTextGrid('Plan', [
        ['Intitulé', 'Part'],
        ['Rénover les écoles du territoire', '0.035'],
        ['Passer l’éclairage public en LED', '0.5'],
        ['Solariser les toitures des gymnases', '0.12'],
      ])
    );

    expect(outline.isOutline).toBe(false);
  });

  it('demande des numéros sur la plupart des rangées', () => {
    const outline = outlineOf(
      buildTextGrid('Plan', [
        ['N°', 'Intitulé'],
        ['1', 'Sobriété énergétique'],
        ['1.1', 'Rénover les écoles du territoire'],
        ['', 'Passer l’éclairage public en LED'],
        ['', 'Solariser les toitures des gymnases'],
      ])
    );

    expect(outline.isOutline).toBe(false);
  });

  it('rend les rangées telles quelles sans rangée de données', () => {
    const rows: ClassifiedRow[] = [{ row: 1, kind: 'header' }];

    expect(readOutline(buildTextGrid('Plan', [['N°']]), rows)).toEqual({
      rows,
      levels: new Map(),
      isOutline: false,
      subRows: new Map(),
    });
  });
});

describe('readBannerPaths', () => {
  it('empile les bandeaux d’après leur numérotation', () => {
    const paths = readBannerPaths(
      [
        banner(1, 'Axe 1 : Mobilité'),
        banner(2, 'Orientation 1.1 : Transports collectifs'),
        data(3),
        banner(4, 'Orientation 1.2 : Modes actifs'),
        data(5),
        banner(6, 'Axe 2 : Habitat'),
        data(7),
      ],
      new Map()
    );

    expect([...paths]).toEqual([
      [3, ['Axe 1 : Mobilité', 'Orientation 1.1 : Transports collectifs']],
      [5, ['Axe 1 : Mobilité', 'Orientation 1.2 : Modes actifs']],
      [7, ['Axe 2 : Habitat']],
    ]);
  });

  it('donne à un bandeau sans numéro le niveau le plus courant', () => {
    const paths = readBannerPaths(
      [banner(1, 'Axe 1 : Mobilité'), data(2), banner(3, 'Habitat'), data(4)],
      new Map()
    );

    expect(paths.get(4)).toEqual(['Habitat']);
  });

  it('suit les niveaux que la numérotation des rangées a donnés', () => {
    const paths = readBannerPaths(
      [banner(1, 'Sobriété'), banner(2, 'Patrimoine public'), data(3)],
      new Map([
        [1, 1],
        [2, 2],
      ])
    );

    expect(paths.get(3)).toEqual(['Sobriété', 'Patrimoine public']);
  });

  it('laisse sans chemin les rangées d’avant le premier bandeau', () => {
    const paths = readBannerPaths(
      [data(1), banner(2, 'Axe 1 : Mobilité'), { row: 3, kind: 'total' }],
      new Map()
    );

    expect([...paths]).toEqual([[1, []]]);
  });
});
