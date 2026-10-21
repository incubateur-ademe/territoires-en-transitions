import { describe, expect, it } from 'vitest';
import {
  buildCoverPageWorkbook,
  buildFormWorkbook,
  readTestGrids,
} from '../__fixtures__/build-test-workbook';
import { inferFormLayout } from './infer-form-layout';
import { buildTextGrid, SheetGrid } from './sheet-grid';

const formGrid = async (name: string): Promise<SheetGrid> => {
  const grids = await readTestGrids(await buildFormWorkbook());
  return grids.find((grid) => grid.name === name) as SheetGrid;
};

describe('inferFormLayout', () => {
  it('lit une fiche-formulaire : titre, axe et champs reconnus', async () => {
    const layout = inferFormLayout(await formGrid('Fiche 1'));

    expect(layout).toMatchObject({
      sheet: 'Fiche 1',
      shape: 'formulaire',
      header: null,
      columns: [],
      confident: true,
      fiches: [
        {
          rows: [1, 2, 3, 4, 5, 6, 7, 8],
          path: ['Sobriété énergétique'],
          titre: 'Rénover l’éclairage public des zones d’activités',
          numero: null,
        },
      ],
    });
    expect(layout?.form?.map(({ label, role }) => `${label}:${role}`)).toEqual([
      'Axe:hierarchie',
      'Intitulé de l’action:titre',
      'Pilote:structurePilote',
      'Statut:statut',
      'Budget:budget',
      'Description:description',
      'Étapes:sousAction',
    ]);
  });

  it('prolonge le champ du dessus par une rangée sans libellé', async () => {
    const layout = inferFormLayout(await formGrid('Fiche 1'));

    expect(layout?.form?.at(-1)?.values).toEqual([
      'Réaliser un diagnostic du parc',
      'Lancer le marché de travaux',
    ]);
  });

  it('remplit un libellé sans valeur avec les rangées suivantes', () => {
    const layout = inferFormLayout(
      buildTextGrid('Fiche', [
        ['Intitulé', 'Créer une ligne de bus express vers la gare'],
        ['Pilote', 'Service mobilité'],
        ['Statut', 'En cours'],
        ['Étapes :'],
        ['', 'Étudier le tracé'],
        ['', 'Acheter deux bus'],
      ])
    );

    expect(layout?.form?.at(-1)).toEqual({
      label: 'Étapes',
      role: 'sousAction',
      values: ['Étudier le tracé', 'Acheter deux bus'],
    });
  });

  it('range les textes d’avant le premier champ en titres d’onglet', () => {
    const layout = inferFormLayout(
      buildTextGrid('Fiche', [
        ['Plan climat   de la communauté'],
        ['Intitulé', 'Créer une ligne de bus express vers la gare'],
        ['Pilote', 'Service mobilité'],
        ['Statut', 'En cours'],
      ])
    );

    expect(layout?.titleTexts).toEqual(['Plan climat de la communauté']);
    expect(layout?.fiches[0].rows).toEqual([1, 2, 3, 4]);
  });

  it('lit le n° et, sans champ titre, prend le titre de l’onglet', () => {
    const layout = inferFormLayout(
      buildTextGrid('Fiche', [
        ['Rénover les écoles maternelles du territoire'],
        ['N° :', ' 4 '],
        ['Pilote', 'Service bâtiments'],
        ['Statut', 'En cours'],
      ])
    );

    expect(layout?.fiches).toEqual([
      expect.objectContaining({
        titre: 'Rénover les écoles maternelles du territoire',
        numero: '4',
      }),
    ]);
  });

  it('fait d’un second champ « Actions » les sous-actions, ou la description', () => {
    const withSteps = inferFormLayout(
      buildTextGrid('Fiche', [
        ['Intitulé de l’action', 'Créer une ligne de bus express'],
        ['Actions', 'Étudier le tracé'],
        ['', 'Acheter deux bus'],
        ['Pilote', 'Service mobilité'],
        ['Statut', 'En cours'],
      ])
    );
    const withText = inferFormLayout(
      buildTextGrid('Fiche', [
        ['Intitulé de l’action', 'Créer une ligne de bus express'],
        ['Actions', 'Une ligne cadencée à la demi-heure'],
        ['Pilote', 'Service mobilité'],
        ['Statut', 'En cours'],
      ])
    );

    expect(withSteps?.form?.[1].role).toBe('sousAction');
    expect(withText?.form?.[1].role).toBe('description');
    expect(withText?.fiches[0].titre).toBe('Créer une ligne de bus express');
  });

  it('ne crée pas de fiche pour une page de présentation', async () => {
    const [cover] = await readTestGrids(await buildCoverPageWorkbook());

    const layout = inferFormLayout(cover);

    expect(layout).toMatchObject({ fiches: [], confident: false });
    expect(layout?.reasons).toContain('✗ aucun champ titre ni n°');
  });

  it('n’est pas confiant devant un titre trop court', () => {
    const layout = inferFormLayout(
      buildTextGrid('Fiche', [
        ['Intitulé', 'Vélos'],
        ['Pilote', 'Service mobilité'],
        ['Statut', 'En cours'],
      ])
    );

    expect(layout).toMatchObject({ confident: false, confidence: 0.5 });
    expect(layout?.fiches[0].titre).toBe('Vélos');
  });

  it('écarte un onglet de plus de quatre colonnes : c’est un tableau', () => {
    expect(
      inferFormLayout(
        buildTextGrid('Plan', [
          ['Axe', 'Action', 'Pilote', 'Statut', 'Budget'],
          ['Mobilité', 'Créer une ligne de bus', 'Interco', 'En cours', '12'],
        ])
      )
    ).toBeNull();
  });

  it('écarte un onglet aux libellés trop peu reconnus', () => {
    expect(
      inferFormLayout(
        buildTextGrid('Notes', [
          ['Intitulé', 'Créer une ligne de bus express'],
          ['Pilote', 'Service mobilité'],
          ['Couleur', 'Bleu'],
        ])
      )
    ).toBeNull();
    expect(
      inferFormLayout(
        buildTextGrid('Notes', [
          ['Intitulé', 'Créer une ligne de bus express'],
          ['Pilote', 'Service mobilité'],
          ['Statut', 'En cours'],
          ['Couleur', 'Bleu'],
          ['Forme', 'Ronde'],
          ['Taille', 'Grande'],
          ['Humeur', 'Joyeuse'],
        ])
      )
    ).toBeNull();
  });

  it('écarte un onglet vide', () => {
    expect(inferFormLayout(buildTextGrid('Vide', []))).toBeNull();
  });
});
