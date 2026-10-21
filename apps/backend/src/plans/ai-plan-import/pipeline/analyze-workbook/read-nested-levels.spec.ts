import { describe, expect, it } from 'vitest';
import {
  buildMislabelledHierarchyWorkbook,
  buildTestWorkbook,
  buildUnlabelledLevelsWorkbook,
  readTestGrids,
  TestCellValue,
} from '../__fixtures__/build-test-workbook';
import { classifyGridRows } from './classify-grid-rows';
import { detectTableHeader } from './detect-table-header';
import { matchColumnLabel } from './match-column-label';
import { profileColumns, readGridValues } from './profile-columns';
import { readHierarchyLevels } from './read-nested-levels';
import { buildTextGrid, SheetGrid } from './sheet-grid';

/** Les colonnes de chaque niveau, du plus large au plus fin. */
const levelColsOf = (grid: SheetGrid): number[][] => {
  const header = detectTableHeader(grid);
  const rows = classifyGridRows(grid, header);
  const valueAt = readGridValues(grid, rows);
  const profiles = profileColumns(grid, rows, header?.labels ?? [], valueAt);
  return readHierarchyLevels(profiles, (profile) =>
    matchColumnLabel(profile.label)
  ).map(({ profiles }) => profiles.map(({ col }) => col));
};

const gridOf = async (
  rows: TestCellValue[][],
  merges: string[]
): Promise<SheetGrid> => {
  const [grid] = await readTestGrids(
    await buildTestWorkbook([{ name: 'Plan', rows, merges }])
  );
  return grid;
};

describe('readHierarchyLevels', () => {
  it('range les colonnes répétées du regroupement le plus large au plus fin', () => {
    const levels = levelColsOf(
      buildTextGrid('Plan', [
        ['Axe', 'Sous-axe', 'Action'],
        ['Mobilité', 'Transports collectifs', 'Créer une ligne express'],
        ['Mobilité', 'Transports collectifs', 'Renforcer la ligne 2'],
        ['Mobilité', 'Modes actifs', 'Réaliser le schéma cyclable'],
        ['Mobilité', 'Modes actifs', 'Créer des pistes cyclables'],
        ['Habitat', 'Rénovation', 'Ouvrir un guichet unique'],
        ['Habitat', 'Rénovation', 'Former les artisans'],
        ['Habitat', 'Logement indigne', 'Repérer les logements'],
        ['Habitat', 'Logement indigne', 'Accompagner les propriétaires'],
      ])
    );

    expect(levels).toEqual([[1], [2]]);
  });

  it('réunit en un niveau les colonnes aux mêmes frontières', () => {
    const levels = levelColsOf(
      buildTextGrid('Plan', [
        ['N° axe', 'Axe', 'Action'],
        ['1', 'Mobilité', 'Créer une ligne express'],
        ['1', 'Mobilité', 'Renforcer la ligne 2'],
        ['2', 'Habitat', 'Ouvrir un guichet unique'],
        ['2', 'Habitat', 'Former les artisans'],
        ['3', 'Eau', 'Installer des compteurs'],
        ['3', 'Eau', 'Réduire les fuites'],
      ])
    );

    expect(levels).toEqual([[1, 2]]);
  });

  it('ne fait pas d’un attribut répété un niveau', () => {
    const levels = levelColsOf(
      buildTextGrid('Plan', [
        ['Axe', 'Action', 'Statut', 'Porteur'],
        ['Mobilité', 'Créer une ligne express', 'En cours', 'Interco'],
        ['Mobilité', 'Renforcer la ligne 2', 'En cours', 'Interco'],
        ['Habitat', 'Ouvrir un guichet unique', 'À venir', 'Commune'],
        ['Habitat', 'Former les artisans', 'À venir', 'Commune'],
        ['Eau', 'Installer des compteurs', 'Terminé', 'Syndicat'],
        ['Eau', 'Réduire les fuites', 'Terminé', 'Syndicat'],
      ])
    );

    expect(levels).toEqual([[1]]);
  });

  it('écarte un niveau dont les blocs chevauchent ceux du précédent', async () => {
    const grid = await gridOf(
      [
        ['Axe', 'Thème', 'Action'],
        ['Mobilité', 'Transports', 'Créer une ligne express'],
        [null, 'Vélo', 'Renforcer la ligne 2'],
        ['Habitat', null, 'Ouvrir un guichet unique'],
        [null, 'Rénovation', 'Former les artisans'],
        ['Eau', null, 'Installer des compteurs'],
        [null, 'Compteurs', 'Réduire les fuites'],
      ],
      ['A2:A3', 'A4:A5', 'A6:A7', 'B3:B4', 'B5:B6']
    );

    expect(levelColsOf(grid)).toEqual([[1]]);
  });

  it('rattrape un « Objectif » fusionné quand la fiche s’emboîte dans ses blocs', async () => {
    const [grid] = await readTestGrids(
      await buildMislabelledHierarchyWorkbook()
    );

    expect(levelColsOf(grid)).toEqual([[2], [3], [1]]);
  });

  it('ne rattrape pas un « Objectif » qui n’est pas fusionné', () => {
    const fiche = (titre: string, etapes: [string, string]) =>
      etapes.map((etape) => [titre, etape]);
    const levels = levelColsOf(
      buildTextGrid('Plan', [
        ['Axe', 'Objectif', 'Fiche action', 'Étape'],
        ...[
          ...fiche('Créer une ligne express vers la gare', ['Tracé', 'Bus']),
          ...fiche('Renforcer la fréquence de la ligne 2', ['Étude', 'Bus']),
        ].map((row) => ['Mobilité', 'Réduire la voiture', ...row]),
        ...[
          ...fiche('Ouvrir un guichet unique de la rénovation', [
            'Local',
            'RH',
          ]),
          ...fiche('Former les artisans aux rénovations', ['Plan', 'Cours']),
        ].map((row) => ['Habitat', 'Rénover', ...row]),
      ])
    );

    expect(levels).toEqual([[1], [3]]);
  });

  it('lit des niveaux sans libellé aux intitulés courts, par emboîtement', async () => {
    const [grid] = await readTestGrids(await buildUnlabelledLevelsWorkbook());

    expect(levelColsOf(grid)).toEqual([[1], [2], [3]]);
  });

  it('ne trouve aucun niveau dans un tableau plat', () => {
    expect(
      levelColsOf(
        buildTextGrid('Plan', [
          ['Action', 'Porteur'],
          ['Créer une ligne express', 'Interco'],
          ['Ouvrir un guichet unique', 'Commune'],
          ['Installer des compteurs', 'Syndicat'],
        ])
      )
    ).toEqual([]);
  });
});
