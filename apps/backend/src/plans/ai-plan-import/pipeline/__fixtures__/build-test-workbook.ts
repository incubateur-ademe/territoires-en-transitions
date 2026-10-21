/**
 * Classeurs de test écrits en mémoire par exceljs : rien à committer en
 * binaire. Une fonction par forme de plan rencontrée dans les tableurs des
 * collectivités, toutes anonymisées et réduites à ce qui les caractérise.
 */
import ExcelJS from 'exceljs';
import { readWorkbookGrids } from '../analyze-workbook/read-workbook-grid';
import { SheetGrid } from '../analyze-workbook/sheet-grid';

export type TestCellValue =
  | string
  | number
  | Date
  | null
  | { formula: string; result?: number | string }
  | { error: '#REF!' | '#N/A' | '#VALUE!' | '#DIV/0!' };

export type TestSheet = {
  name: string;
  state?: 'visible' | 'hidden' | 'veryHidden';
  /** Rangées depuis A1 ; `null` laisse la cellule vide. */
  rows: TestCellValue[][];
  /** Plages fusionnées (« B6:B12 ») : seule la valeur du coin haut gauche compte. */
  merges?: string[];
};

export const buildTestWorkbook = async (
  sheets: TestSheet[]
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name, {
      state: sheet.state ?? 'visible',
    });
    sheet.rows.forEach((row, rowIndex) =>
      row.forEach((value, colIndex) => {
        if (value !== null) {
          worksheet.getCell(rowIndex + 1, colIndex + 1).value = value;
        }
      })
    );
    for (const range of sheet.merges ?? []) {
      worksheet.mergeCells(range);
    }
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
};

/** Les grilles d'un classeur de test ; un classeur illisible fait échouer le test. */
export const readTestGrids = async (buffer: Buffer): Promise<SheetGrid[]> => {
  const result = await readWorkbookGrids(buffer);
  if (!result.success) {
    throw new Error(`Classeur de test illisible : ${result.error.kind}`);
  }
  return result.data;
};

type HorizontalSousAction = {
  titre: string;
  /** Années cochées du calendrier, croix en majuscule ou minuscule. */
  annees: Partial<Record<2021 | 2022 | 2023 | 2024, 'X' | 'x'>>;
  avancement: string;
};

type HorizontalFiche = {
  numero: number;
  pilote: string;
  titre: string;
  budget?: number;
  sousActions: HorizontalSousAction[];
};

type HorizontalObjectif = {
  strategique: string;
  operationnels: { titre: string; fiches: HorizontalFiche[] }[];
};

const CALENDAR_YEARS = [2021, 2022, 2023, 2024] as const;

/**
 * Le plan d'un tableau de suivi de PCAET : bandeaux d'ambition, puis
 * objectif stratégique, objectif opérationnel, n°, pilote et fiche en
 * colonnes de cellules fusionnées sur les rangées de leurs sous-actions.
 */
export const HORIZONTAL_HIERARCHY_PLAN: {
  bandeau: string;
  objectifs: HorizontalObjectif[];
}[] = [
  {
    bandeau: 'AMBITION n°1 : Pour un territoire sobre en énergie',
    objectifs: [
      {
        strategique: 'Se déplacer moins et mieux',
        operationnels: [
          {
            titre: "Développer l'usage des transports collectifs",
            fiches: [
              {
                numero: 1,
                pilote: 'Région / Interco',
                titre: 'Aménager deux pôles multimodaux',
                budget: 300000,
                sousActions: [
                  {
                    titre: 'Réaliser les aménagements du pôle nord',
                    annees: { 2022: 'X', 2023: 'X' },
                    avancement: 'En cours',
                  },
                  {
                    titre: 'Calibrer les navettes vers le pôle sud',
                    annees: { 2021: 'X', 2022: 'x' },
                    avancement: 'En projet',
                  },
                  {
                    titre: 'Étudier un pôle multi-activités',
                    annees: {},
                    avancement: 'Terminée',
                  },
                ],
              },
              {
                numero: 2,
                pilote: 'Interco',
                titre: 'Communiquer sur les aides à la mobilité',
                sousActions: [
                  {
                    titre: 'Lancer une campagne annuelle',
                    annees: { 2024: 'X' },
                    avancement: 'Non engagée',
                  },
                  {
                    titre: 'Publier un guide des aides',
                    annees: { 2022: 'X' },
                    avancement: '',
                  },
                ],
              },
            ],
          },
          {
            titre: 'Favoriser le covoiturage',
            fiches: [
              {
                numero: 3,
                pilote: 'à définir',
                titre: 'Déployer des aires de covoiturage',
                budget: 45000,
                sousActions: [
                  {
                    titre: 'Recenser les aires informelles',
                    annees: { 2021: 'X' },
                    avancement: 'Terminée',
                  },
                  {
                    titre: 'Équiper trois aires',
                    annees: { 2023: 'X', 2024: 'X' },
                    avancement: 'Annulée',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        strategique: "Développer l'économie circulaire",
        operationnels: [
          {
            titre: "Limiter l'usage des ressources",
            fiches: [
              {
                numero: 4,
                pilote: 'Interco',
                titre: 'Faire monter en compétence les acteurs (EIT)',
                sousActions: [
                  {
                    titre: 'Former les entreprises de la zone',
                    annees: { 2022: 'X' },
                    avancement: 'En cours',
                  },
                  {
                    titre: 'Animer un club EIT',
                    annees: { 2023: 'x' },
                    avancement: 'Non engagée',
                  },
                ],
              },
            ],
          },
          {
            titre: 'Accompagner les acteurs économiques',
            fiches: [
              {
                numero: 5,
                pilote: 'CCI / Interco',
                titre: 'Faire monter en compétence les acteurs (EIT)',
                sousActions: [
                  {
                    titre: 'Organiser des visites de sites',
                    annees: { 2024: 'X' },
                    avancement: 'En projet',
                  },
                  {
                    titre: 'Diffuser les retours d’expérience',
                    annees: {},
                    avancement: '',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    bandeau: 'AMBITION n°2 Pour un territoire préservé',
    objectifs: [
      {
        strategique: 'Maîtriser la ressource en eau',
        operationnels: [
          {
            // Même titre que son unique fiche : un niveau à retirer.
            titre: 'Réduire les fuites des réseaux',
            fiches: [
              {
                numero: 6,
                pilote: 'Syndicat des eaux',
                titre: 'Réduire les fuites des réseaux',
                budget: 120000,
                sousActions: [
                  {
                    titre: 'Sectoriser le réseau',
                    annees: { 2021: 'X', 2022: 'X' },
                    avancement: 'En cours',
                  },
                  {
                    titre: 'Remplacer les conduites fuyardes',
                    annees: { 2023: 'X' },
                    avancement: 'Non engagée',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

/** Colonnes de « Suivi », de A à O. */
const SUIVI_HEADER_TOP: TestCellValue[] = [
  null,
  'Objectifs stratégiques',
  'Objectifs opérationnels',
  'n°',
  // Libellés décalés d'une colonne, comme dans le classeur d'origine : la
  // colonne « Axes opérationnels » porte les pilotes, « PILOTE » les sous-actions.
  'Axes opérationnels',
  "Propositions d'actions",
  'PILOTE',
  'CALENDRIER',
  null,
  null,
  null,
  'AVANCEMENT',
  'COMMENTAIRES',
  'SUIVI BUDGETAIRE',
  null,
];
const SUIVI_HEADER_BOTTOM: TestCellValue[] = [
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  ...CALENDAR_YEARS,
  null,
  null,
  'Budget prévisionnel',
  'Part subventionnable',
];

/** Première rangée de données de « Suivi », sous le titre et l'en-tête. */
export const SUIVI_FIRST_DATA_ROW = 5;

const buildSuiviSheet = (): TestSheet & {
  lastDataRow: number;
  crosses2021: number;
} => {
  const rows: TestCellValue[][] = [
    ['TABLEAU DE SUIVI DE MISE EN OEUVRE'],
    [],
    SUIVI_HEADER_TOP,
    SUIVI_HEADER_BOTTOM,
  ];
  const merges = [
    'B3:B4',
    'C3:C4',
    'D3:D4',
    'E3:E4',
    'F3:F4',
    'G3:G4',
    'H3:K3',
    'L3:L4',
    'M3:M4',
    'N3:O3',
  ];
  const rowNumber = () => rows.length + 1;
  const mergeDown = (column: string, from: number, to: number) => {
    if (to > from) {
      merges.push(`${column}${from}:${column}${to}`);
    }
  };

  for (const { bandeau, objectifs } of HORIZONTAL_HIERARCHY_PLAN) {
    rows.push([null, bandeau]);
    for (const { strategique, operationnels } of objectifs) {
      const strategiqueFrom = rowNumber();
      for (const operationnel of operationnels) {
        const operationnelFrom = rowNumber();
        for (const fiche of operationnel.fiches) {
          const ficheFrom = rowNumber();
          fiche.sousActions.forEach((sousAction, index) => {
            const first = rowNumber() === ficheFrom;
            rows.push([
              null,
              rowNumber() === strategiqueFrom ? strategique : null,
              rowNumber() === operationnelFrom ? operationnel.titre : null,
              first ? fiche.numero : null,
              first ? fiche.pilote : null,
              first ? fiche.titre : null,
              sousAction.titre,
              ...CALENDAR_YEARS.map((year) => sousAction.annees[year] ?? null),
              sousAction.avancement || null,
              null,
              index === 0 ? fiche.budget ?? null : null,
              index === 0 && fiche.budget ? '50 % Région' : null,
            ]);
          });
          const ficheTo = rowNumber() - 1;
          for (const column of ['D', 'E', 'F']) {
            mergeDown(column, ficheFrom, ficheTo);
          }
        }
        mergeDown('C', operationnelFrom, rowNumber() - 1);
      }
      mergeDown('B', strategiqueFrom, rowNumber() - 1);
    }
  }

  const lastDataRow = rowNumber() - 1;
  const budget = HORIZONTAL_HIERARCHY_PLAN.flatMap(({ objectifs }) =>
    objectifs.flatMap(({ operationnels }) =>
      operationnels.flatMap(({ fiches }) =>
        fiches.map((fiche) => fiche.budget ?? 0)
      )
    )
  ).reduce((total, amount) => total + amount, 0);
  const crossesOf = (year: (typeof CALENDAR_YEARS)[number]) =>
    rows
      .slice(SUIVI_FIRST_DATA_ROW - 1)
      .filter((row) =>
        /^x$/i.test(String(row[7 + CALENDAR_YEARS.indexOf(year)]))
      ).length;
  rows.push([]);
  rows.push([
    null,
    null,
    null,
    null,
    null,
    null,
    "Nombre total d'actions planifiées",
    ...CALENDAR_YEARS.map((year, index) => ({
      formula: `COUNTIF(${'HIJK'[index]}${SUIVI_FIRST_DATA_ROW}:${
        'HIJK'[index]
      }${lastDataRow},"X")`,
      result: crossesOf(year),
    })),
  ]);
  rows.push([
    ...Array<null>(13).fill(null),
    {
      formula: `SUM(N${SUIVI_FIRST_DATA_ROW}:N${rowNumber() - 1})`,
      result: budget,
    },
  ]);
  return {
    name: 'Suivi',
    rows,
    merges,
    lastDataRow,
    crosses2021: crossesOf(2021),
  };
};

/**
 * Un onglet d'indicateurs par thème, rattachés aux fiches par leur n° ; son
 * bandeau ne reprend pas mot pour mot celui du plan.
 */
const buildIndicateursSheet = (): TestSheet => ({
  name: 'Mobilité',
  rows: [
    [null, 'AMITION n°1 : Pour un territoire sobre et économe'],
    [],
    [
      null,
      'Orientations stratégiques',
      'n°',
      'Axes opérationnels',
      'Indicateurs de suivi',
      'Valeurs cibles',
    ],
    [
      null,
      'Se déplacer moins et mieux',
      1,
      'Aménager deux pôles multimodaux',
      'Fréquentation des pôles',
      900,
    ],
    [null, null, null, null, 'Part modale des transports collectifs', 0.035],
    [
      null,
      null,
      3,
      'Déployer des aires de covoiturage',
      "Nombre d'aires équipées",
      3,
    ],
    [
      null,
      'Maîtriser la ressource en eau',
      6,
      'Réduire les fuites des réseaux',
      'Rendement du réseau de distribution',
      0.85,
    ],
  ],
  merges: ['B4:B6', 'C4:C5', 'D4:D5'],
});

const buildSyntheseSheet = (suivi: {
  lastDataRow: number;
  crosses2021: number;
}): TestSheet => ({
  name: 'Synthèse',
  rows: [
    ['SYNTHESE SUIVI DES ACTIONS'],
    [],
    [
      null,
      "Nombre d'actions prévues en 2021",
      {
        formula: `Suivi!H${suivi.lastDataRow + 2}`,
        result: suivi.crosses2021,
      },
    ],
    [
      null,
      "Nombre d'actions en projet",
      {
        formula: `COUNTIF(Suivi!L${SUIVI_FIRST_DATA_ROW}:L${suivi.lastDataRow},"En projet")`,
        result: 2,
      },
    ],
    [
      null,
      'Indicateurs suivis',
      { formula: "COUNTA('Mobilité'!E4:E7)", result: 4 },
    ],
  ],
  merges: ['A1:D1'],
});

const buildListeSheet = (): TestSheet => ({
  name: 'Feuil2',
  rows: [
    ['Avancement'],
    [],
    ['Non engagée'],
    ['En projet'],
    ['En cours'],
    ['Terminée'],
    ['Annulée'],
  ],
});

/**
 * Hiérarchie horizontale (forme du classeur de suivi d'un PCAET) : une
 * synthèse en tête, le plan, un onglet d'indicateurs, la liste des statuts.
 */
export const buildHorizontalHierarchyWorkbook = (): Promise<Buffer> => {
  const suivi = buildSuiviSheet();
  return buildTestWorkbook([
    buildSyntheseSheet(suivi),
    suivi,
    buildIndicateursSheet(),
    buildListeSheet(),
  ]);
};

/**
 * La même hiérarchie horizontale sans aucune fusion : chaque rangée répète
 * ses regroupements, comme un export de base de données.
 */
export const buildRepeatedHierarchyWorkbook = (): Promise<Buffer> => {
  const rows: TestCellValue[][] = [
    [
      'Ambition',
      'Objectif stratégique',
      'Objectif opérationnel',
      'N°',
      'Porteur',
      'Fiche action',
      'Sous-action',
      'Avancement',
    ],
  ];
  for (const { bandeau, objectifs } of HORIZONTAL_HIERARCHY_PLAN) {
    for (const { strategique, operationnels } of objectifs) {
      for (const operationnel of operationnels) {
        for (const fiche of operationnel.fiches) {
          for (const sousAction of fiche.sousActions) {
            rows.push([
              bandeau,
              strategique,
              operationnel.titre,
              fiche.numero,
              fiche.pilote,
              fiche.titre,
              sousAction.titre,
              sousAction.avancement || null,
            ]);
          }
        }
      }
    }
  }
  return buildTestWorkbook([{ name: 'Plan', rows }]);
};

/**
 * Hiérarchie verticale : des rangées de titre isolées (« Axe 1 – … »,
 * « 1.2 … ») au-dessus des rangées d'actions.
 */
export const VERTICAL_HIERARCHY_PLAN = [
  {
    axe: 'Axe 1 – Mobilité durable',
    sousAxes: [
      {
        titre: '1.1 Développer les transports collectifs',
        actions: [
          [
            'Créer une ligne de bus express vers la gare',
            'Interco',
            'En cours',
            '2025',
          ],
          [
            'Cadencer les navettes du marché hebdomadaire',
            'Commune',
            'À venir',
            '2026',
          ],
        ],
      },
      {
        titre: '1.2 Encourager les modes actifs',
        actions: [
          [
            'Aménager une piste cyclable entre les deux bourgs',
            'Département',
            'Réalisé',
            '2024',
          ],
        ],
      },
    ],
  },
  {
    axe: 'Axe 2 – Habitat économe',
    sousAxes: [
      {
        titre: '2.1 Rénover le parc privé',
        actions: [
          [
            'Ouvrir un guichet unique de la rénovation',
            'Interco',
            'En cours',
            '2025',
          ],
          [
            'Former les artisans aux rénovations globales',
            'Chambre des métiers',
            'À venir',
            '2027',
          ],
        ],
      },
    ],
  },
] as const;

export const buildVerticalHierarchyWorkbook = (): Promise<Buffer> => {
  const rows: TestCellValue[][] = [
    ["Plan d'actions climat"],
    [],
    ['Action', 'Pilote', 'État', 'Échéance'],
  ];
  for (const { axe, sousAxes } of VERTICAL_HIERARCHY_PLAN) {
    rows.push([axe]);
    for (const { titre, actions } of sousAxes) {
      rows.push([titre]);
      for (const action of actions) {
        rows.push([...action]);
      }
    }
  }
  return buildTestWorkbook([{ name: 'Actions', rows }]);
};

/**
 * Hiérarchie par numérotation : une colonne « N° » qui vaut 1, 1.2, 1.2.3 ;
 * les rangées les moins profondes nomment les axes.
 */
export const buildNumberedHierarchyWorkbook = (): Promise<Buffer> =>
  buildTestWorkbook([
    {
      name: 'Programme',
      rows: [
        ['N°', 'Intitulé', 'Responsable', 'Statut'],
        ['1', 'Réduire les consommations du patrimoine public', null, null],
        ['1.1', 'Connaître et suivre les consommations', null, null],
        [
          '1.1.1',
          'Installer des compteurs communicants dans les écoles',
          'Service technique',
          'En cours',
        ],
        [
          '1.1.2',
          'Publier un bilan énergétique annuel des bâtiments',
          'Direction des finances',
          'À venir',
        ],
        ['1.2', 'Rénover les bâtiments les plus énergivores', null, null],
        [
          '1.2.1',
          "Isoler les combles de l'hôtel de ville",
          'Service technique',
          'Réalisé',
        ],
        ['2', 'Développer les énergies renouvelables locales', null, null],
        ['2.1', 'Produire de l’électricité solaire', null, null],
        [
          '2.1.1',
          'Équiper de panneaux solaires les toitures des gymnases',
          'Service technique',
          'À venir',
        ],
        [
          '2.1.2',
          'Créer une société citoyenne de production solaire',
          'Direction générale',
          'En cours',
        ],
      ],
    },
  ]);

/** Un onglet par axe : le nom de l'onglet donne le premier niveau. */
export const buildSheetPerAxisWorkbook = (): Promise<Buffer> =>
  buildTestWorkbook([
    {
      name: 'Mobilité',
      rows: [
        ['Intitulé de l’action', 'Porteur', 'Statut', 'Budget (€)'],
        [
          'Créer une ligne de bus express vers la gare',
          'Interco',
          'En cours',
          120000,
        ],
        [
          'Aménager des aires de covoiturage aux entrées de ville',
          'Commune',
          'À venir',
          45000,
        ],
        [
          'Développer un service de location de vélos électriques',
          'Interco',
          'Réalisé',
          30000,
        ],
      ],
    },
    {
      name: 'Habitat',
      rows: [
        ['Intitulé de l’action', 'Porteur', 'Statut', 'Budget (€)'],
        [
          'Ouvrir un guichet unique de la rénovation énergétique',
          'Interco',
          'En cours',
          80000,
        ],
        [
          'Former les artisans aux rénovations globales',
          'Chambre des métiers',
          'À venir',
          15000,
        ],
        [
          'Repérer les logements indignes avec les communes',
          'Commune',
          'À venir',
          null,
        ],
      ],
    },
  ]);

type FormFiche = {
  onglet: string;
  /** Libellé puis valeurs ; sans libellé, la rangée prolonge le champ du dessus. */
  champs: [label: string | null, ...values: string[]][];
};

/** Fiches-formulaires : un onglet par fiche, en paires libellé / valeur. */
export const FORM_FICHES: FormFiche[] = [
  {
    onglet: 'Fiche 1',
    champs: [
      ['Axe :', 'Sobriété énergétique'],
      [
        'Intitulé de l’action :',
        'Rénover l’éclairage public des zones d’activités',
      ],
      ['Pilote :', 'Service technique'],
      ['Statut :', 'En cours'],
      ['Budget :', '250 000 €'],
      ['Description :', 'Remplacer les lampadaires par des LED pilotées.'],
      ['Étapes :', 'Réaliser un diagnostic du parc'],
      [null, 'Lancer le marché de travaux'],
    ],
  },
  {
    onglet: 'Fiche 2',
    champs: [
      ['Axe :', 'Sobriété énergétique'],
      [
        'Intitulé de l’action :',
        'Former les agents aux gestes économes en énergie',
      ],
      ['Pilote :', 'Direction des ressources humaines'],
      ['Statut :', 'À venir'],
      ['Description :', 'Deux sessions par an pour chaque service.'],
    ],
  },
  {
    onglet: 'Fiche 3',
    champs: [
      ['Axe :', 'Énergies renouvelables'],
      [
        'Intitulé de l’action :',
        'Installer une chaufferie bois au centre aquatique',
      ],
      ['Pilote :', 'Direction des équipements'],
      ['Statut :', 'Terminée'],
      ['Budget :', '1 200 000 €'],
    ],
  },
];

export const buildFormWorkbook = (): Promise<Buffer> =>
  buildTestWorkbook(
    FORM_FICHES.map(({ onglet, champs }) => ({
      name: onglet,
      rows: champs.map(([label, ...values]) => [label ?? null, ...values]),
    }))
  );

/** Tableau plat : une rangée par fiche, l'axe répété en texte. */
export const FLAT_TABLE_ROWS: TestCellValue[][] = [
  ['Axe', 'Action', 'Porteur', 'Échéance', 'État d’avancement'],
  [
    'Mobilité',
    'Créer une ligne de bus express vers la gare',
    'Interco',
    '2025',
    'En cours',
  ],
  [
    'Mobilité',
    'Aménager des aires de covoiturage aux entrées de ville',
    'Commune',
    '2026',
    'À venir',
  ],
  [
    'Habitat',
    'Ouvrir un guichet unique de la rénovation énergétique',
    'Interco',
    '2024',
    'Réalisé',
  ],
  [
    'Habitat',
    'Former les artisans aux rénovations globales',
    'Chambre des métiers',
    '2027',
    'À venir',
  ],
  [
    'Agriculture',
    'Accompagner la conversion des exploitations en bio',
    'Chambre d’agriculture',
    '2026',
    'En cours',
  ],
];

export const buildFlatTableWorkbook = (): Promise<Buffer> =>
  buildTestWorkbook([{ name: 'Feuil1', rows: FLAT_TABLE_ROWS }]);

/**
 * Le même tableau en CSV, séparé par des points-virgules : l'axe n'est écrit
 * qu'à sa première rangée, il faut le reporter vers le bas.
 */
export const buildFlatTableCsv = (): Buffer => {
  let previousAxe = '';
  const lines = FLAT_TABLE_ROWS.map((row, index) => {
    const [axe, ...rest] = row.map((value) => String(value ?? ''));
    const shown = index > 0 && axe === previousAxe ? '' : axe;
    previousAxe = axe;
    return [shown, ...rest]
      .map((value) => (value.includes(';') ? `"${value}"` : value))
      .join(';');
  });
  return Buffer.from(`\ufeff${lines.join('\r\n')}\r\n`, 'utf-8');
};

/**
 * Le modèle d'import de la plateforme : une rangée par action, suivie d'une
 * rangée par sous-action qui répète le titre de l'action.
 */
export const buildTetTemplateWorkbook = (): Promise<Buffer> => {
  const header = [
    'Axe (x)',
    'Sous-axe (x.x)',
    'Sous-sous axe (x.x.x)',
    "Titre de l'action",
    'Titre de la sous-action',
    'Descriptif',
    'Structure pilote',
    'Personne pilote',
    'Budget prévisionnel total € HT',
    'Statut',
    'Date de début',
    'Date de fin',
  ];
  const axe1 = '1. Sobriété énergétique';
  const axe2 = '2. Énergies renouvelables';
  const sousAxe11 = '1.1 Patrimoine public';
  const action1 = 'Rénover l’éclairage public des zones d’activités';
  const action2 = 'Former les agents aux gestes économes en énergie';
  const action3 = 'Installer une chaufferie bois au centre aquatique';
  return buildTestWorkbook([
    {
      name: 'Plan',
      rows: [
        ['Plan climat de la collectivité'],
        header,
        [
          'Champ texte',
          'Champ texte',
          'Champ texte',
          'Champ texte',
          'Champ texte',
          'Champ texte',
          'Champ texte',
          'Champ texte',
          'Champ numérique',
          'Champ liste déroulante',
          'Champ date',
          'Champ date',
        ],
        [
          axe1,
          sousAxe11,
          null,
          action1,
          null,
          'Remplacer les lampadaires par des LED.',
          'Service technique',
          'Jeanne Martin',
          250000,
          'En cours',
          '01/01/2025',
          '31/12/2026',
        ],
        [
          axe1,
          sousAxe11,
          null,
          action1,
          'Réaliser un diagnostic du parc',
          null,
          null,
          null,
          null,
          'Réalisé',
          null,
          '30/06/2025',
        ],
        [
          axe1,
          sousAxe11,
          null,
          action1,
          'Lancer le marché de travaux',
          null,
          null,
          null,
          null,
          'À venir',
          null,
          null,
        ],
        [
          axe1,
          null,
          null,
          action2,
          null,
          'Deux sessions par an pour chaque service.',
          'Ressources humaines',
          null,
          null,
          'À venir',
          null,
          null,
        ],
        [
          axe2,
          null,
          null,
          action3,
          null,
          null,
          'Direction des équipements',
          null,
          1200000,
          'En cours',
          '01/09/2025',
          null,
        ],
        [
          axe2,
          null,
          null,
          action3,
          'Choisir le maître d’œuvre',
          null,
          null,
          null,
          null,
          'En cours',
          null,
          null,
        ],
      ],
    },
  ]);
};

/**
 * Un classeur mixte : un plan lisible et un onglet de notes libres, que le
 * code ne sait pas lire et confie au modèle.
 */
export const buildMixedWorkbook = (): Promise<Buffer> =>
  buildTestWorkbook([
    { name: 'Feuil1', rows: FLAT_TABLE_ROWS },
    {
      name: 'Notes du comité',
      rows: [
        ['Compte rendu du comité de pilotage du 12 mars'],
        [
          'Les élus souhaitent ajouter une action sur la sobriété numérique, à préciser avec la direction des systèmes d’information.',
        ],
        [
          'Le budget de la rénovation énergétique sera revu au prochain conseil.',
        ],
      ],
    },
  ]);

/**
 * Des onglets qui ont l'allure d'un plan sans en être un : un annuaire (un
 * service répété, des courriels), un budget par poste de dépense, un
 * planning de réunions, un catalogue d'indicateurs par thème.
 */
export const buildLookalikeSheetsWorkbook = (): Promise<Buffer> => {
  const noms = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit'];
  const services = [
    'Direction générale',
    'Direction générale',
    'Urbanisme',
    'Urbanisme',
    'Environnement',
    'Environnement',
  ];
  return buildTestWorkbook([
    {
      name: 'Annuaire',
      rows: [
        ['Service', 'Nom', 'Fonction', 'Courriel'],
        ...noms.map((nom, index) => [
          services[index],
          nom,
          index % 2
            ? 'Chargé de mission transition énergétique'
            : 'Responsable du service aménagement',
          `${nom.toLowerCase()}@cc-exemple.fr`,
        ]),
      ],
    },
    {
      name: 'Budget 2025',
      rows: [
        ['Chapitre', 'Article', 'Libellé du poste de dépense', 'Montant'],
        [
          '011 Charges générales',
          '6061',
          'Fournitures non stockables (eau, énergie)',
          120000,
        ],
        [
          '011 Charges générales',
          '6063',
          'Fournitures d’entretien et petit équipement',
          30000,
        ],
        [
          '011 Charges générales',
          '615221',
          'Entretien des bâtiments publics',
          80000,
        ],
        [
          '012 Charges de personnel',
          '64111',
          'Rémunération principale des titulaires',
          900000,
        ],
        [
          '012 Charges de personnel',
          '64131',
          'Rémunérations des non-titulaires',
          150000,
        ],
      ],
    },
    {
      name: 'Réunions',
      rows: [
        ['Date', 'Objet de la réunion', 'Lieu'],
        ['12/03/2025', 'Comité de pilotage du plan climat', 'Mairie'],
        ['04/04/2025', 'Atelier de concertation mobilité', 'Salle des fêtes'],
        ['20/05/2025', 'Comité technique énergie renouvelable', 'Siège'],
        ['17/06/2025', 'Restitution publique du diagnostic', 'Médiathèque'],
      ],
    },
    {
      name: 'Catalogue indicateurs',
      rows: [
        ['Thème', 'Indicateur', 'Unité', 'Responsable'],
        [
          'Énergie',
          'Consommation d’énergie finale du territoire',
          'GWh',
          'Chargé de mission',
        ],
        [
          'Énergie',
          'Production d’énergie renouvelable locale',
          'GWh',
          'Chargé de mission',
        ],
        [
          'Climat',
          'Émissions de gaz à effet de serre par habitant',
          'tCO2e',
          'Chargé de mission',
        ],
        [
          'Air',
          'Concentration annuelle moyenne en dioxyde d’azote',
          'µg/m3',
          'Chargé de mission',
        ],
      ],
    },
  ]);
};

/**
 * Une hiérarchie fusionnée sans rangée d'en-tête : la première rangée est
 * déjà une donnée.
 */
export const buildHeaderlessWorkbook = (): Promise<Buffer> =>
  buildTestWorkbook([
    {
      name: 'Feuil1',
      rows: [
        [
          'Se déplacer autrement',
          'Créer une ligne de bus express vers la gare',
          'Réaliser l’étude d’opportunité de la ligne',
          'Interco',
          'En cours',
        ],
        [
          null,
          null,
          'Mettre en service la première phase',
          'Interco',
          'À venir',
        ],
        [
          null,
          'Aménager des aires de covoiturage aux entrées',
          'Choisir les sites avec les communes',
          'Commune',
          'Réalisé',
        ],
        [
          null,
          null,
          'Réaliser les travaux des trois aires',
          'Commune',
          'À venir',
        ],
        [
          'Mieux se loger',
          'Ouvrir un guichet unique de la rénovation',
          'Recruter deux conseillers en rénovation',
          'Interco',
          'Réalisé',
        ],
        [
          null,
          null,
          'Ouvrir le guichet au public au siège',
          'Interco',
          'En cours',
        ],
        [
          null,
          'Former les artisans aux rénovations globales',
          'Organiser la première session de formation',
          'CMA',
          'En cours',
        ],
        [
          null,
          null,
          'Organiser la seconde session de formation',
          'CMA',
          'À venir',
        ],
      ],
      merges: ['A1:A4', 'A5:A8', 'B1:B2', 'B3:B4', 'B5:B6', 'B7:B8'],
    },
  ]);

/** Une fiche-action par onglet : un formulaire, puis le tableau de ses étapes. */
export const buildFormWithStepsWorkbook = (): Promise<Buffer> =>
  buildTestWorkbook(
    [
      ['Solariser les toitures des bâtiments publics', 'Énergie'],
      ['Créer un réseau de chaleur bois au centre-bourg', 'Énergie'],
    ].map(([titre, axe], index) => ({
      name: `Fiche ${index + 1}`,
      rows: [
        [`Fiche action n°${index + 1}`],
        ['Axe', axe],
        ['Intitulé', titre],
        ['Pilote', 'Service environnement'],
        ['Budget', '250 000 €'],
        [],
        ['Étape', 'Responsable', 'Début', 'Fin', 'Statut'],
        [
          'Réaliser le diagnostic technique des sites',
          'Bureau d’études',
          '2025',
          '2025',
          'Réalisé',
        ],
        [
          'Organiser la concertation avec les habitants',
          'Service environnement',
          '2025',
          '2026',
          'En cours',
        ],
        [
          'Lancer le marché de travaux et le chantier',
          'Entreprises',
          '2026',
          '2027',
          'À venir',
        ],
      ],
    }))
  );

/**
 * Une numérotation à quatre profondeurs : la fiche est la moins profonde à
 * porter pilote et statut, ses étapes sont numérotées en dessous.
 */
export const buildDeepNumberingWorkbook = (): Promise<Buffer> =>
  buildTestWorkbook([
    {
      name: 'Programme',
      rows: [
        ['Code', 'Libellé', 'Pilote', 'Statut'],
        ['1', 'Sobriété énergétique', null, null],
        ['1.1', 'Patrimoine public', null, null],
        ['1.1.1', 'Rénover les écoles du territoire', 'Bâtiments', 'En cours'],
        ['1.1.1.1', 'Réaliser les audits énergétiques', 'Bâtiments', 'Réalisé'],
        ['1.1.1.2', 'Engager les travaux d’isolation', 'Bâtiments', 'À venir'],
        ['1.1.2', 'Passer l’éclairage public en LED', 'Voirie', 'À venir'],
        ['2', 'Énergies renouvelables', null, null],
        ['2.1', 'Solaire', null, null],
        ['2.1.1', 'Solariser les toitures des gymnases', 'Énergie', 'À venir'],
        ['2.1.1.1', 'Étude de faisabilité', 'Énergie', 'À venir'],
      ],
    },
  ]);

/**
 * Une hiérarchie que les libellés ne désignent pas : la fiche en première
 * colonne, un « Objectif » fusionné entre l'orientation et la fiche.
 */
export const buildMislabelledHierarchyWorkbook = (): Promise<Buffer> =>
  buildTestWorkbook([
    {
      name: 'PCAET',
      rows: [
        ['Mesure', 'Orientation', 'Objectif', 'Étape', 'Responsable'],
        [
          'Rénover les écoles maternelles du territoire',
          'Sobriété',
          'Bâtiments publics',
          'Audit énergétique',
          'Service bâtiments',
        ],
        [null, null, null, 'Travaux d’isolation', null],
        [
          'Optimiser le chauffage des gymnases municipaux',
          null,
          null,
          'Remplacer les chaudières',
          'Service bâtiments',
        ],
        [null, null, null, 'Installer une régulation', null],
        [
          'Moderniser l’éclairage public des centres-bourgs',
          null,
          'Éclairage',
          'Inventaire du parc',
          'Service voirie',
        ],
        [null, null, null, 'Passage en LED', null],
        [
          'Réduire les fuites des réseaux d’eau potable',
          'Adaptation',
          'Ressource en eau',
          'Sectoriser le réseau',
          'Syndicat des eaux',
        ],
        [null, null, null, 'Renouveler les canalisations', null],
        [
          'Récupérer les eaux pluviales des bâtiments publics',
          null,
          null,
          'Étudier le potentiel',
          'Service bâtiments',
        ],
        [null, null, null, 'Installer des cuves', null],
      ],
      merges: [
        'A2:A3',
        'A4:A5',
        'A6:A7',
        'A8:A9',
        'A10:A11',
        'B2:B7',
        'B8:B11',
        'C2:C5',
        'C6:C7',
        'C8:C11',
        'E2:E3',
        'E4:E5',
        'E6:E7',
        'E8:E9',
        'E10:E11',
      ],
    },
  ]);

/**
 * Un tableau plat à trois niveaux répétés en texte, sans libellé : les deux
 * premiers, aux intitulés courts, ressemblent à des listes fermées.
 */
export const buildUnlabelledLevelsWorkbook = (): Promise<Buffer> => {
  const tree = [
    [
      'Territoire sobre',
      'Mobilité',
      'Transports collectifs',
      'Créer une ligne express vers la gare TER',
    ],
    [
      'Territoire sobre',
      'Mobilité',
      'Transports collectifs',
      'Renforcer la fréquence de la ligne 2',
    ],
    [
      'Territoire sobre',
      'Mobilité',
      'Modes actifs',
      'Réaliser le schéma directeur cyclable',
    ],
    [
      'Territoire sobre',
      'Habitat',
      'Rénovation',
      'Ouvrir un guichet unique de la rénovation',
    ],
    [
      'Territoire sobre',
      'Habitat',
      'Rénovation',
      'Accompagner les bailleurs sociaux',
    ],
    [
      'Territoire résilient',
      'Eau',
      'Économies',
      'Installer des compteurs dans les bâtiments',
    ],
    [
      'Territoire résilient',
      'Eau',
      'Économies',
      'Accompagner les irrigants vers le goutte-à-goutte',
    ],
    [
      'Territoire résilient',
      'Biodiversité',
      'Trame verte',
      'Replanter vingt kilomètres de haies',
    ],
    [
      'Territoire résilient',
      'Biodiversité',
      'Zones humides',
      'Restaurer les mares communales',
    ],
  ];
  return buildTestWorkbook([
    {
      name: 'Feuil1',
      rows: [
        ['', '', '', 'Intitulé', 'Porteur', 'Avancement'],
        ...tree.map((row, index) => [
          ...row,
          index % 2 ? 'Communauté de communes' : 'Syndicat des eaux',
          ['En cours', 'Non démarré', 'Réalisée', 'En retard'][index % 4],
        ]),
      ],
    },
  ]);
};

/**
 * Des valeurs écrites en clair : échéances en texte, avancement en
 * pourcentage, budgets en « M€ », et une date de mise à jour qui n'est pas
 * une échéance.
 */
export const buildFreeFormValuesWorkbook = (): Promise<Buffer> =>
  buildTestWorkbook([
    {
      name: 'Plan',
      rows: [
        [
          'Axe',
          'Action',
          'Pilote',
          'Échéance',
          'Avancement',
          'Budget',
          'Date de mise à jour',
        ],
        [
          'Mobilité',
          'Créer une ligne de bus express vers la gare',
          'Interco',
          'Fin 2026',
          0.5,
          '15 k€',
          new Date(Date.UTC(2024, 2, 1)),
        ],
        [
          'Mobilité',
          'Aménager des aires de covoiturage aux entrées',
          'Commune',
          'Juin 2025',
          1,
          '1,2 M€',
          new Date(Date.UTC(2024, 2, 2)),
        ],
        [
          'Habitat',
          'Ouvrir un guichet unique de la rénovation',
          'Interco',
          '2025-2027',
          0,
          'à chiffrer',
          new Date(Date.UTC(2024, 2, 3)),
        ],
        [
          'Habitat',
          'Former les artisans aux rénovations globales',
          'CMA',
          '2026',
          0.25,
          null,
          new Date(Date.UTC(2024, 2, 4)),
        ],
      ],
    },
  ]);

/** Un avancement rédigé, que la table des statuts ne lit pas. */
export const buildWrittenProgressWorkbook = (): Promise<Buffer> =>
  buildTestWorkbook([
    {
      name: 'Plan',
      rows: [
        ['Axe', 'Action', 'Porteur', 'État d’avancement'],
        [
          'Mobilité',
          'Créer une ligne de bus express vers la gare',
          'Interco',
          'Étude de faisabilité rendue en mars, consultation à venir',
        ],
        [
          'Mobilité',
          'Aménager des aires de covoiturage aux entrées de ville',
          'Commune',
          'Deux aires livrées, la troisième attend le foncier',
        ],
        [
          'Habitat',
          'Ouvrir un guichet unique de la rénovation énergétique',
          'Interco',
          'Guichet ouvert en 2023 avec deux conseillers',
        ],
        [
          'Habitat',
          'Former les artisans aux rénovations globales',
          'Chambre des métiers',
          'À venir',
        ],
      ],
    },
  ]);

/** Un budget par année, avec ou sans colonne de total. */
export const buildYearlyBudgetWorkbook = ({
  withTotal,
}: {
  withTotal: boolean;
}): Promise<Buffer> => {
  const years = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028];
  const titles = [
    'Créer une ligne de bus express vers la gare',
    'Aménager des aires de covoiturage aux entrées',
    'Ouvrir un guichet unique de la rénovation',
    'Former les artisans aux rénovations globales',
  ];
  return buildTestWorkbook([
    {
      name: 'Plan',
      rows: [
        [
          'Axe',
          'Action',
          'Pilote',
          ...years.map((year) => `Budget ${year}`),
          ...(withTotal ? ['Budget total'] : []),
        ],
        ...titles.map((titre, index) => [
          index < 2 ? 'Mobilité' : 'Habitat',
          titre,
          'Interco',
          ...years.map((_, offset) => 1000 * (offset + 1)),
          ...(withTotal
            ? [{ formula: `SUM(D${index + 2}:K${index + 2})`, result: 36000 }]
            : []),
        ]),
      ],
    },
  ]);
};

/**
 * Des cas de lecture : une plage de `SUM` restée courte au-dessus de
 * rangées ajoutées, une fusion irrégulière dans une colonne de hiérarchie,
 * des cellules en erreur, le même montant sur chaque sous-action, des
 * objectifs répétés sur les rangées d'une fiche.
 */
export const buildShortSumRangeSheet = (): TestSheet => ({
  name: 'Plan',
  rows: [
    ['Axe', 'Action', 'Porteur', 'État d’avancement', 'Budget'],
    [
      'Mobilité',
      'Créer une ligne de bus express vers la gare',
      'Interco',
      'En cours',
      1000,
    ],
    [
      'Mobilité',
      'Aménager des aires de covoiturage aux entrées',
      'Commune',
      'À venir',
      2000,
    ],
    [
      'Habitat',
      'Ouvrir un guichet unique de la rénovation',
      'Interco',
      'Réalisé',
      3000,
    ],
    [
      'Habitat',
      'Former les artisans aux rénovations globales',
      'CMA',
      'À venir',
      4000,
    ],
    [
      'Énergie',
      'Installer des panneaux solaires sur les écoles',
      'Commune',
      'À venir',
      5000,
    ],
    ['Total', null, null, null, { formula: 'SUM(E2:E4)', result: 6000 }],
  ],
});

export const buildIrregularMergeSheet = (): TestSheet => ({
  name: 'Plan',
  rows: [
    ['Objectif stratégique', 'N°', 'Fiche action', 'Sous-action', 'Avancement'],
    [
      'Réduire les consommations des bâtiments',
      1,
      'Rénover les écoles maternelles',
      'Réaliser un audit énergétique',
      'En cours',
    ],
    [null, null, null, 'Isoler les combles de l’école', 'En projet'],
    [
      null,
      2,
      'Installer des chaudières bois',
      'Étudier la faisabilité',
      'Terminée',
    ],
    [null, null, null, 'Lancer le marché de travaux', 'Non engagée'],
    [
      'Préserver la ressource en eau',
      3,
      'Réduire les fuites du réseau d’eau',
      'Équiper le réseau de compteurs',
      'En cours',
    ],
    [null, null, null, 'Remplacer les canalisations', 'En projet'],
    [
      null,
      4,
      'Sensibiliser aux économies d’eau',
      'Distribuer des kits hydro-économes',
      'Terminée',
    ],
    [null, null, null, 'Organiser des ateliers', 'Non engagée'],
  ],
  // Le second objectif est écrit une fois, sans fusion : il vaut jusqu'en bas.
  merges: [
    'A2:A5',
    'B2:B3',
    'C2:C3',
    'B4:B5',
    'C4:C5',
    'B6:B7',
    'C6:C7',
    'B8:B9',
    'C8:C9',
  ],
});

export const buildErrorCellsSheet = (): TestSheet => ({
  name: 'Plan',
  rows: [
    ['Axe', 'Action', 'Porteur', 'État d’avancement'],
    [
      'Mobilité',
      'Créer une ligne de bus express vers la gare',
      'Interco',
      'En cours',
    ],
    [
      'Mobilité',
      'Aménager des aires de covoiturage aux entrées',
      { error: '#REF!' },
      { error: '#N/A' },
    ],
    [
      'Habitat',
      'Ouvrir un guichet unique de la rénovation',
      'Interco',
      { formula: 'Feuil2!A1' },
    ],
    [
      'Habitat',
      'Former les artisans aux rénovations globales',
      'CMA',
      'À venir',
    ],
  ],
});

export const buildRepeatedValuesSheet = (): TestSheet => ({
  name: 'Plan',
  rows: [
    ['Axe', 'Fiche', 'Sous-action', 'Objectifs', 'Budget'],
    [
      'Mobilité',
      'Développer le covoiturage sur le territoire',
      'Créer des aires de covoiturage',
      'Réduire de 10 % les trajets solo',
      10000,
    ],
    [
      'Mobilité',
      'Développer le covoiturage sur le territoire',
      'Animer une plateforme en ligne',
      'Réduire de 10 % les trajets solo',
      10000,
    ],
    [
      'Mobilité',
      'Développer le covoiturage sur le territoire',
      'Communiquer auprès des entreprises',
      'Réduire de 10 % les trajets solo',
      10000,
    ],
    [
      'Habitat',
      'Rénover les logements anciens du territoire',
      'Ouvrir un guichet unique',
      'Rénover 500 logements',
      5000,
    ],
    [
      'Habitat',
      'Rénover les logements anciens du territoire',
      'Former les artisans locaux',
      'Rénover 500 logements',
      8000,
    ],
    [
      'Habitat',
      'Accompagner les copropriétés dégradées',
      'Diagnostiquer dix copropriétés',
      'Traiter dix copropriétés',
      2000,
    ],
    [
      'Habitat',
      'Accompagner les copropriétés dégradées',
      'Monter les dossiers de subvention',
      'Traiter dix copropriétés',
      3000,
    ],
  ],
});

/** Une page de présentation (pilote, budget, statut) devant le plan. */
export const buildCoverPageWorkbook = (): Promise<Buffer> =>
  buildTestWorkbook([
    {
      name: 'Présentation',
      rows: [
        ['Plan Climat Air Énergie Territorial 2021-2026'],
        ['Collectivité', 'Communauté de communes du Val'],
        ['Pilote', 'Service environnement'],
        ['Partenaires', 'ADEME, Région'],
        ['Budget', '5 000 000 €'],
        ['Statut', 'En cours'],
      ],
    },
    { name: 'PCAET', rows: FLAT_TABLE_ROWS },
  ]);
