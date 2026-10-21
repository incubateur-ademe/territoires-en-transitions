import { StatutEnum } from '@tet/domain/plans';
import { describe, expect, it } from 'vitest';
import {
  buildHorizontalHierarchyWorkbook,
  buildTestWorkbook,
  buildYearlyBudgetWorkbook,
  readTestGrids,
  TestSheet,
} from '../__fixtures__/build-test-workbook';
import {
  buildTabularActions,
  joinPilotes,
  numberedTitle,
  shortenTitle,
  TabularPlanSheet,
} from './build-tabular-actions';
import { inferSheetLayout } from './infer-sheet-layout';
import { SheetGrid } from './sheet-grid';

const planSheet = async (
  buffer: Promise<Buffer>,
  name: string
): Promise<TabularPlanSheet> => {
  const grids = await readTestGrids(await buffer);
  const grid = grids.find((candidate) => candidate.name === name) as SheetGrid;
  return { grid, layout: inferSheetLayout(grid), axisPrefix: [] };
};

/** Un plan à sous-actions, budget, budget consommé et commentaires. */
const budgetSheet = (total: number): TestSheet => ({
  name: 'Plan',
  rows: [
    [
      'Axe',
      'Fiche action',
      'Sous-action',
      'Avancement',
      'Commentaires',
      'Budget prévisionnel',
      'Budget consommé',
    ],
    [
      'Mobilité',
      'Créer une ligne de bus express vers la gare',
      'Étudier le tracé de la ligne',
      'Terminée',
      'Étude livrée en mars',
      10000,
      9000,
    ],
    [
      'Mobilité',
      'Créer une ligne de bus express vers la gare',
      'Acheter deux bus électriques',
      'À voir avec la Région',
      null,
      500000,
      null,
    ],
    [
      'Mobilité',
      'Aménager des aires de covoiturage en entrée de ville',
      'Équiper trois aires',
      'En cours',
      null,
      45000,
      null,
    ],
    [
      'Habitat',
      'Ouvrir un guichet unique de la rénovation',
      'Recruter deux conseillers',
      'Non engagée',
      null,
      80000,
      null,
    ],
    [
      null,
      null,
      null,
      null,
      'Total',
      { formula: 'SUM(F2:F5)', result: total },
      null,
    ],
  ],
});

describe('buildTabularActions', () => {
  it('construit chaque fiche d’un tableau de suivi sans le modèle', async () => {
    const sheet = await planSheet(buildHorizontalHierarchyWorkbook(), 'Suivi');

    const { fiches, warnings, budgetCheck } = buildTabularActions(sheet);

    expect(fiches).toHaveLength(6);
    expect(fiches[0].action).toEqual({
      axe: 'AMBITION n°1 : Pour un territoire sobre en énergie',
      sousAxe: 'Se déplacer moins et mieux',
      cheminAxes: [
        'AMBITION n°1 : Pour un territoire sobre en énergie',
        'Se déplacer moins et mieux',
        "Développer l'usage des transports collectifs",
      ],
      titre: '1 - Aménager deux pôles multimodaux',
      description: null,
      objectifs: null,
      structurePilote: 'Région, Interco',
      directionServicePilote: null,
      personnePilote: null,
      partenaires: null,
      budget: 300000,
      financements: '50 % Région',
      moyensHumains: null,
      priorite: null,
      dateDebut: '2021-01-01',
      dateFin: '2023-12-31',
      statut: StatutEnum.EN_COURS,
      confidence: null,
      sousActions: [
        {
          titre: 'Réaliser les aménagements du pôle nord',
          description: null,
          personnePilote: null,
          statut: StatutEnum.EN_COURS,
          dateDebut: '2022-01-01',
          dateFin: '2023-12-31',
        },
        {
          titre: 'Calibrer les navettes vers le pôle sud',
          description: null,
          personnePilote: null,
          statut: StatutEnum.A_VENIR,
          dateDebut: '2021-01-01',
          dateFin: '2022-12-31',
        },
        {
          titre: 'Étudier un pôle multi-activités',
          description: null,
          personnePilote: null,
          statut: StatutEnum.REALISE,
          dateDebut: null,
          dateFin: null,
        },
      ],
      sourceTableur: {
        onglet: 'Suivi',
        premiereLigne: 6,
        derniereLigne: 8,
        numero: '1',
      },
    });
    expect(fiches[2].action).toMatchObject({
      structurePilote: null,
      statut: StatutEnum.REALISE,
    });
    expect(budgetCheck).toEqual({
      total: 465000,
      expected: 465000,
      cell: 'N22',
    });
    expect(warnings).toEqual([]);
  });

  it('contrôle le budget contre la formule de total et signale le budget consommé', async () => {
    const sheet = await planSheet(
      buildTestWorkbook([budgetSheet(600000)]),
      'Plan'
    );

    const { fiches, warnings } = buildTabularActions(sheet);

    expect(fiches.map(({ action }) => action.budget)).toEqual([
      510000, 45000, 80000,
    ]);
    expect(fiches[0].action.description).toBe(
      'Commentaires : Étude livrée en mars'
    );
    expect(fiches[0].action.sousActions.map(({ statut }) => statut)).toEqual([
      StatutEnum.REALISE,
      null,
    ]);
    expect(warnings).toEqual([
      'Onglet « Plan » : avancements non reconnus, laissés sans statut : « À voir avec la Région ».',
      "Onglet « Plan », colonne G « Budget consommé » : le budget consommé n'est pas importé.",
      // Le séparateur de milliers est une espace fine insécable.
      'Onglet « Plan » : la somme des budgets des fiches (635\u202f000) diffère du total F6 (600\u202f000).',
    ]);
  });

  it('n’avertit pas quand la somme des budgets tombe juste', async () => {
    const sheet = await planSheet(
      buildTestWorkbook([budgetSheet(635000)]),
      'Plan'
    );

    expect(
      buildTabularActions(sheet).warnings.some((warning) =>
        warning.includes('diffère du total')
      )
    ).toBe(false);
  });

  it('ajoute les indicateurs des compléments aux objectifs', async () => {
    const sheet = await planSheet(buildHorizontalHierarchyWorkbook(), 'Suivi');
    const [first] = sheet.layout.fiches;

    const { fiches } = buildTabularActions(sheet, {
      complements: new Map([
        [first, ['- Fréquentation des pôles (cible : 900)']],
      ]),
    });

    expect(fiches[0].action.objectifs).toBe(
      '- Fréquentation des pôles (cible : 900)'
    );
  });

  it('laisse vides les champs désactivés, sous-actions comprises', async () => {
    const sheet = await planSheet(buildHorizontalHierarchyWorkbook(), 'Suivi');

    const { fiches } = buildTabularActions(sheet, {
      disabledFields: ['statut', 'date de début', 'date de fin', 'budget'],
    });

    expect(fiches[0].action).toMatchObject({
      statut: null,
      dateDebut: null,
      dateFin: null,
      budget: null,
      structurePilote: 'Région, Interco',
    });
    expect(fiches[0].action.sousActions[0]).toMatchObject({
      statut: null,
      dateDebut: null,
      dateFin: null,
    });
  });

  it('prend le total d’un budget par année, et garde le détail en description', async () => {
    const sheet = await planSheet(
      buildYearlyBudgetWorkbook({ withTotal: true }),
      'Plan'
    );

    const [{ action }] = buildTabularActions(sheet).fiches;

    expect(action).toMatchObject({ budget: 36000, financements: null });
    expect(action.description).toContain('Budget 2021 : 1000');
    expect(action.description).toContain('Budget 2028 : 8000');
  });

  it('préfixe le chemin par l’axe de l’onglet', async () => {
    const sheet = await planSheet(buildHorizontalHierarchyWorkbook(), 'Suivi');

    const { fiches } = buildTabularActions({
      ...sheet,
      axisPrefix: ['Plan climat'],
    });

    expect(fiches[0].action.cheminAxes?.[0]).toBe('Plan climat');
    expect(fiches[0].action.axe).toBe('Plan climat');
  });
});

describe('shortenTitle', () => {
  it('garde un titre court tel quel', () => {
    expect(shortenTitle('Équiper trois aires')).toEqual({
      titre: 'Équiper trois aires',
      rest: null,
    });
  });

  it('coupe un texte long à la dernière phrase et garde tout en description', () => {
    const text =
      `Réaliser une étude de faisabilité du réseau de chaleur urbain du centre-bourg. ${'Associer les communes et les bailleurs à chaque étape du projet, '.repeat(
        6
      )}`.trim();

    const { titre, rest } = shortenTitle(text);

    expect(titre).toBe(
      'Réaliser une étude de faisabilité du réseau de chaleur urbain du centre-bourg.'
    );
    expect(rest).toBe(text);
  });
});

describe('numberedTitle', () => {
  it.each([
    ['12', 'Mettre en place un PLH', '12 - Mettre en place un PLH'],
    ['2.3', 'Isoler les écoles', '2.3 Isoler les écoles'],
    ['MOB-4', 'Créer une ligne', 'Créer une ligne'],
    ['12', '12 - Mettre en place un PLH', '12 - Mettre en place un PLH'],
    [null, 'Créer une ligne', 'Créer une ligne'],
  ])('n°%s', (numero, titre, expected) => {
    expect(numberedTitle(numero, titre)).toBe(expected);
  });
});

describe('joinPilotes', () => {
  it('coupe sur « / » et oublie « à définir »', () => {
    expect(joinPilotes(['Région (AOM) /CCPG / Communes'])).toBe(
      'Région (AOM), CCPG, Communes'
    );
    expect(joinPilotes(['à définir'])).toBeNull();
    expect(joinPilotes(['Interco', 'Interco'])).toBe('Interco');
  });
});
