import { describe, expect, it } from 'vitest';
import {
  buildHeaderlessWorkbook,
  buildHorizontalHierarchyWorkbook,
  buildTetTemplateWorkbook,
  readTestGrids,
} from '../__fixtures__/build-test-workbook';
import { detectTableHeader } from './detect-table-header';
import { buildTextGrid, SheetGrid } from './sheet-grid';

const sheetOf = async (buffer: Promise<Buffer>, name: string) => {
  const grid = (await readTestGrids(await buffer)).find(
    (candidate) => candidate.name === name
  );
  if (!grid) {
    throw new Error(`Onglet absent : ${name}`);
  }
  return grid;
};

describe('detectTableHeader', () => {
  it('trouve le titre puis un en-tête sur deux rangées, libellés composés', async () => {
    const grid = await sheetOf(buildHorizontalHierarchyWorkbook(), 'Suivi');

    const header = detectTableHeader(grid);

    expect(header).toMatchObject({
      titleRows: [1],
      headerRows: [3, 4],
      noteRows: [],
    });
    expect(header?.labels.slice(1, 7)).toEqual([
      'Objectifs stratégiques',
      'Objectifs opérationnels',
      'n°',
      'Axes opérationnels',
      "Propositions d'actions",
      'PILOTE',
    ]);
    expect(header?.labels.slice(7, 11)).toEqual([
      'CALENDRIER · 2021',
      'CALENDRIER · 2022',
      'CALENDRIER · 2023',
      'CALENDRIER · 2024',
    ]);
    expect(header?.labels[13]).toBe('SUIVI BUDGETAIRE · Budget prévisionnel');
  });

  it('écarte la rangée de consignes sous l’en-tête du modèle d’import', async () => {
    const grid = await sheetOf(buildTetTemplateWorkbook(), 'Plan');

    expect(detectTableHeader(grid)).toMatchObject({
      titleRows: [1],
      headerRows: [2],
      noteRows: [3],
    });
  });

  it('ne prend pas une rangée de données pour une seconde rangée d’en-tête', () => {
    const grid: SheetGrid = buildTextGrid('Plan', [
      ['Action', 'Pilote', 'Statut'],
      ['Créer une ligne de bus express', 'Interco', 'En cours'],
      ['Aménager des aires de covoiturage', 'Commune', 'À venir'],
    ]);

    expect(detectTableHeader(grid)).toMatchObject({
      titleRows: [],
      headerRows: [1],
      noteRows: [],
      labels: ['Action', 'Pilote', 'Statut'],
    });
  });

  it('ne prend pas pour en-tête une rangée prise dans les fusions des données', async () => {
    const grid = await sheetOf(buildHeaderlessWorkbook(), 'Feuil1');

    expect(detectTableHeader(grid)).toBeNull();
  });

  it('ne prend pas pour en-tête une rangée qui écrit un statut', () => {
    const grid = buildTextGrid('Plan', [
      ['Créer une ligne de bus express vers la gare', 'Interco', 'En cours'],
      ['Aménager des aires de covoiturage', 'Commune', 'À venir'],
      ['Ouvrir un guichet unique de la rénovation', 'Interco', 'Réalisé'],
    ]);

    expect(detectTableHeader(grid)).toBeNull();
  });

  it('ne trouve aucun en-tête dans un texte libre', () => {
    const grid = buildTextGrid('Notes', [
      ['Compte rendu du comité de pilotage'],
      ['Les élus souhaitent ajouter une action sur la sobriété numérique.'],
    ]);

    expect(detectTableHeader(grid)).toBeNull();
  });
});
