import { describe, expect, it } from 'vitest';
import {
  buildFormWorkbook,
  buildHorizontalHierarchyWorkbook,
  buildTestWorkbook,
  readTestGrids,
} from '../__fixtures__/build-test-workbook';
import { inferSheetLayout } from './infer-sheet-layout';
import { buildTextGrid, SheetGrid } from './sheet-grid';

const suiviGrid = async (): Promise<SheetGrid> => {
  const grids = await readTestGrids(await buildHorizontalHierarchyWorkbook());
  return grids.find(({ name }) => name === 'Suivi') as SheetGrid;
};

describe('inferSheetLayout', () => {
  it('déduit les rôles du contenu, malgré des libellés décalés', async () => {
    const layout = inferSheetLayout(await suiviGrid());

    expect(layout).toMatchObject({
      shape: 'horizontale',
      confident: true,
      confidence: 1,
      sousActionCol: 7,
    });
    expect(
      layout.columns
        .filter(({ role }) => role !== 'vide')
        .map(({ letter, role, level }) => `${letter}:${role}:${level}`)
    ).toEqual([
      'B:hierarchie:axe',
      'C:hierarchie:axe',
      'D:numero:fiche',
      'E:structurePilote:fiche',
      'F:titre:fiche',
      'G:sousAction:row',
      'H:calendrier:row',
      'I:calendrier:row',
      'J:calendrier:row',
      'K:calendrier:row',
      'L:statut:row',
      'N:budget:fiche',
      'O:financements:fiche',
    ]);
    expect(
      layout.columns.filter(({ year }) => year).map(({ year }) => year)
    ).toEqual([2021, 2022, 2023, 2024]);
    expect(layout.warnings).toEqual([
      "Onglet « Suivi », colonne E : le libellé « Axes opérationnels » annonce niveau d'axe, mais le contenu est lu comme structure pilote.",
      'Onglet « Suivi », colonne G : le libellé « PILOTE » annonce structure pilote, mais le contenu est lu comme sous-actions.',
    ]);
  });

  it('découpe les fiches par blocs fusionnés, homonymes comprises', async () => {
    const { fiches } = inferSheetLayout(await suiviGrid());

    expect(
      fiches.map(({ numero, titre, rows }) => [numero, titre, rows.length])
    ).toEqual([
      ['1', 'Aménager deux pôles multimodaux', 3],
      ['2', 'Communiquer sur les aides à la mobilité', 2],
      ['3', 'Déployer des aires de covoiturage', 2],
      ['4', 'Faire monter en compétence les acteurs (EIT)', 2],
      ['5', 'Faire monter en compétence les acteurs (EIT)', 2],
      ['6', 'Réduire les fuites des réseaux', 2],
    ]);
    expect(fiches[4].path).toEqual([
      'AMBITION n°1 : Pour un territoire sobre en énergie',
      "Développer l'économie circulaire",
      'Accompagner les acteurs économiques',
    ]);
  });

  it('lit un tableau plat une rangée par fiche', () => {
    const layout = inferSheetLayout(
      buildTextGrid('Plan', [
        ['Action', 'Porteur', 'Statut'],
        ['Créer une ligne de bus express vers la gare', 'Interco', 'En cours'],
        [
          'Aménager des aires de covoiturage en entrée de ville',
          'Commune',
          'À venir',
        ],
        ['Ouvrir un guichet unique de la rénovation', 'Interco', 'Terminée'],
      ])
    );

    expect(layout).toMatchObject({ shape: 'plate', confident: true });
    expect(layout.fiches.map(({ path }) => path)).toEqual([[], [], []]);
  });

  it('ne lit pas avec confiance un tableau de nombres sans fiche', async () => {
    const [grid] = await readTestGrids(
      await buildTestWorkbook([
        {
          name: 'Émissions',
          rows: [
            ['Secteur', '2015', '2020'],
            ['Résidentiel', 120, 110],
            ['Transport', 300, 280],
            ['Agriculture', 90, 85],
          ],
        },
      ])
    );

    expect(inferSheetLayout(grid).confident).toBe(false);
  });

  it('signale les fiches restées sans axe parmi des fiches rangées', async () => {
    const [grid] = await readTestGrids(
      await buildTestWorkbook([
        {
          name: 'Plan',
          rows: [
            ['Axe', 'Fiche action', 'Sous-action'],
            [
              'Mobilité',
              'Créer une ligne de bus express vers la gare',
              'Étudier le tracé',
            ],
            [null, null, 'Acheter deux bus'],
            [
              null,
              'Aménager des aires de covoiturage aux entrées',
              'Choisir les sites',
            ],
            [null, null, 'Équiper les aires'],
            [
              null,
              'Ouvrir un guichet unique de la rénovation',
              'Recruter les conseillers',
            ],
            [null, null, 'Ouvrir au public'],
          ],
          // L'axe s'arrête avec sa fusion : la dernière fiche n'en a pas.
          merges: ['A2:A5', 'B2:B3', 'B4:B5', 'B6:B7'],
        },
      ])
    );

    const layout = inferSheetLayout(grid);

    expect(layout.fiches.map(({ path }) => path)).toEqual([
      ['Mobilité'],
      ['Mobilité'],
      [],
    ]);
    expect(layout.warnings).toContain(
      'Onglet « Plan » : 1 fiche(s) sans axe parmi des fiches rangées sous un axe, à vérifier : « Ouvrir un guichet unique de la rénovation » (ligne 6).'
    );
  });

  it('lit une fiche-formulaire en paires libellé / valeur', async () => {
    const [grid] = await readTestGrids(await buildFormWorkbook());

    const layout = inferSheetLayout(grid);

    expect(layout).toMatchObject({ shape: 'formulaire', confident: true });
    expect(layout.fiches).toEqual([
      expect.objectContaining({
        titre: 'Rénover l’éclairage public des zones d’activités',
        path: ['Sobriété énergétique'],
      }),
    ]);
    expect(layout.form?.find(({ role }) => role === 'sousAction')).toEqual({
      label: 'Étapes',
      role: 'sousAction',
      values: ['Réaliser un diagnostic du parc', 'Lancer le marché de travaux'],
    });
  });
});
