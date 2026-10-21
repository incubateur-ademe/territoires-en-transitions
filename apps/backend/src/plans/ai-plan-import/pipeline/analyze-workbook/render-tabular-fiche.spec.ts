import { describe, expect, it } from 'vitest';
import {
  buildFormWorkbook,
  buildHorizontalHierarchyWorkbook,
  buildTetTemplateWorkbook,
  readTestGrids,
} from '../__fixtures__/build-test-workbook';
import { TabularPlanSheet } from './build-tabular-actions';
import { inferSheetLayout } from './infer-sheet-layout';
import { renderTabularFiche } from './render-tabular-fiche';
import { SheetGrid } from './sheet-grid';

const planSheet = async (
  buffer: Promise<Buffer>,
  name: string
): Promise<TabularPlanSheet> => {
  const grids = await readTestGrids(await buffer);
  const grid = grids.find((candidate) => candidate.name === name) as SheetGrid;
  return { grid, layout: inferSheetLayout(grid), axisPrefix: [] };
};

describe('renderTabularFiche', () => {
  it('écrit une fiche une seule fois, ses sous-actions en liste', async () => {
    const sheet = await planSheet(buildHorizontalHierarchyWorkbook(), 'Suivi');

    expect(renderTabularFiche(sheet, sheet.layout.fiches[0])).toBe(
      [
        '[Onglet « Suivi »]',
        "Axes : AMBITION n°1 : Pour un territoire sobre en énergie > Se déplacer moins et mieux > Développer l'usage des transports collectifs",
        'Fiche n°1 : Aménager deux pôles multimodaux',
        // « Axes opérationnels » au-dessus des pilotes : le rôle lu remplace
        // un libellé qui le contredit.
        'Structure pilote : Région / Interco',
        'SUIVI BUDGETAIRE · Budget prévisionnel : 300000',
        'SUIVI BUDGETAIRE · Part subventionnable : 50 % Région',
        'Sous-actions :',
        '- Réaliser les aménagements du pôle nord (AVANCEMENT : En cours ; calendrier : 2022, 2023)',
        '- Calibrer les navettes vers le pôle sud (AVANCEMENT : En projet ; calendrier : 2021, 2022)',
        '- Étudier un pôle multi-activités (AVANCEMENT : Terminée)',
      ].join('\n')
    );
  });

  it('écrit les champs d’une fiche-formulaire', async () => {
    const sheet = await planSheet(buildFormWorkbook(), 'Fiche 1');

    expect(renderTabularFiche(sheet, sheet.layout.fiches[0])).toContain(
      'Étapes : Réaliser un diagnostic du parc ; Lancer le marché de travaux'
    );
  });

  it('sépare les valeurs de la fiche de celles de ses sous-actions', async () => {
    const sheet = await planSheet(buildTetTemplateWorkbook(), 'Plan');

    const text = renderTabularFiche(sheet, sheet.layout.fiches[0]);

    expect(text).toContain('Statut : En cours\n');
    expect(text).toContain(
      '- Réaliser un diagnostic du parc (Statut : Réalisé ; Date de fin : 30/06/2025)'
    );
  });
});
