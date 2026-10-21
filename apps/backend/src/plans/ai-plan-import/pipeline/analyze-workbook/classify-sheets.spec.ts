import { describe, expect, it } from 'vitest';
import {
  buildFormWorkbook,
  buildHorizontalHierarchyWorkbook,
  buildTestWorkbook,
  FLAT_TABLE_ROWS,
  readTestGrids,
} from '../__fixtures__/build-test-workbook';
import { classifySheets } from './classify-sheets';

const classify = async (buffer: Promise<Buffer>) =>
  classifySheets(await readTestGrids(await buffer)).map(
    ({ name, role, complementOf, matches }) => ({
      name,
      role,
      ...(complementOf ? { complementOf, matches } : {}),
    })
  );

describe('classifySheets', () => {
  it('trie plan, complément, synthèse et liste d’un tableau de suivi', async () => {
    expect(await classify(buildHorizontalHierarchyWorkbook())).toEqual([
      { name: 'Synthèse', role: 'synthese' },
      { name: 'Suivi', role: 'plan' },
      {
        name: 'Mobilité',
        role: 'complement',
        complementOf: 'Suivi',
        matches: [0, 2, 5],
      },
      { name: 'Feuil2', role: 'liste' },
    ]);
  });

  it('reconnaît un onglet de plusieurs listes déroulantes', async () => {
    const sheets = await classify(
      buildTestWorkbook([
        { name: 'Plan', rows: FLAT_TABLE_ROWS },
        {
          name: 'Listes',
          rows: [
            ['Statut', 'Priorité', 'Cible'],
            ['En cours', 'Élevée', 'Grand public'],
            ['À venir', 'Moyenne', 'Entreprises'],
            ['Réalisé', 'Basse', 'Agents'],
          ],
        },
      ])
    );

    expect(sheets).toEqual([
      { name: 'Plan', role: 'plan' },
      { name: 'Listes', role: 'liste' },
    ]);
  });

  it('ne prend pas pour une liste un petit plan aux valeurs toutes distinctes', async () => {
    const sheets = await classify(
      buildTestWorkbook([
        {
          name: 'Actions',
          rows: [
            ['Action', 'Pilote', 'État'],
            [
              'Créer une ligne de bus express vers la gare',
              'Interco',
              'En cours',
            ],
            [
              'Ouvrir un guichet unique de la rénovation',
              'Interco / ADIL',
              'Terminée',
            ],
            [
              'Former les artisans aux rénovations globales',
              'à définir',
              'Annulée',
            ],
          ],
        },
        { name: 'Listes', rows: [['En cours'], ['Terminée'], ['Annulée']] },
      ])
    );

    expect(sheets).toEqual([
      { name: 'Actions', role: 'plan' },
      { name: 'Listes', role: 'liste' },
    ]);
  });

  it('ne prend pas des fiches-formulaires aux mêmes libellés pour des listes', async () => {
    const sheets = await classify(buildFormWorkbook());

    expect(sheets.map(({ role }) => role)).toEqual(['plan', 'plan', 'plan']);
  });

  it('ne fait jamais un plan d’un tableau de bord calculé', async () => {
    const sheets = await classify(
      buildTestWorkbook([
        { name: 'Plan', rows: FLAT_TABLE_ROWS },
        {
          name: 'Tableau de bord',
          rows: [
            ['Indicateur', 'Valeur'],
            [
              "Nombre d'actions engagées sur le territoire",
              { formula: 'COUNTA(Plan!B2:B6)', result: 5 },
            ],
            [
              "Nombre d'actions en cours de réalisation",
              { formula: 'COUNTIF(Plan!E2:E6,"En cours")', result: 2 },
            ],
            [
              "Nombre d'actions réalisées depuis le lancement",
              { formula: 'COUNTIF(Plan!E2:E6,"Réalisé")', result: 1 },
            ],
          ],
        },
      ])
    );

    expect(sheets).toEqual([
      { name: 'Plan', role: 'plan' },
      { name: 'Tableau de bord', role: 'synthese' },
    ]);
  });

  it('confie au modèle ce qu’il ne reconnaît pas avec confiance', async () => {
    const sheets = await classify(
      buildTestWorkbook([
        {
          name: 'Plan',
          rows: [
            ['Action', 'Porteur'],
            ['Créer une ligne de bus', 'Interco'],
            ['Isoler les écoles', 'Commune'],
          ],
        },
      ])
    );

    expect(sheets).toEqual([{ name: 'Plan', role: 'modele' }]);
  });
});
