import { StatutEnum } from '@tet/domain/plans';
import { describe, expect, it } from 'vitest';
import { axisPathOf, ExtractedAction } from '../../models/extracted-action';
import {
  buildCoverPageWorkbook,
  buildDeepNumberingWorkbook,
  buildErrorCellsSheet,
  buildFlatTableCsv,
  buildFlatTableWorkbook,
  buildFormWithStepsWorkbook,
  buildFormWorkbook,
  buildFreeFormValuesWorkbook,
  buildHeaderlessWorkbook,
  buildHorizontalHierarchyWorkbook,
  buildIrregularMergeSheet,
  buildLookalikeSheetsWorkbook,
  buildMislabelledHierarchyWorkbook,
  buildMixedWorkbook,
  buildNumberedHierarchyWorkbook,
  buildRepeatedHierarchyWorkbook,
  buildRepeatedValuesSheet,
  buildSheetPerAxisWorkbook,
  buildShortSumRangeSheet,
  buildTestWorkbook,
  buildTetTemplateWorkbook,
  buildUnlabelledLevelsWorkbook,
  buildVerticalHierarchyWorkbook,
  buildWrittenProgressWorkbook,
  buildYearlyBudgetWorkbook,
  readTestGrids,
} from '../__fixtures__/build-test-workbook';
import { analyzeWorkbook, WorkbookAnalysis } from './analyze-workbook';
import { readCsvGrid } from './read-csv-grid';

const analyze = async (buffer: Promise<Buffer>): Promise<WorkbookAnalysis> =>
  analyzeWorkbook(await readTestGrids(await buffer));

/** L'arbre lu : chemin d'axes puis titre, une ligne par fiche. */
const treeOf = (actions: ExtractedAction[]): string[] =>
  actions.map((action) => [...axisPathOf(action), action.titre].join(' > '));

const rolesOf = ({ sheets }: WorkbookAnalysis) =>
  Object.fromEntries(sheets.map(({ name, role }) => [name, role]));

const columnRoles = (analysis: WorkbookAnalysis, sheet: string) =>
  Object.fromEntries(
    (analysis.sheets.find(({ name }) => name === sheet)?.columns ?? [])
      .filter(({ role }) => role !== 'vide')
      .map(({ letter, role }) => [letter, role])
  );

describe('analyzeWorkbook', () => {
  describe('hiérarchie horizontale par colonnes fusionnées', () => {
    it('donne un rôle à chaque onglet et à chaque colonne du plan', async () => {
      const analysis = await analyze(buildHorizontalHierarchyWorkbook());

      expect(rolesOf(analysis)).toEqual({
        Synthèse: 'synthese',
        Suivi: 'plan',
        Mobilité: 'complement',
        Feuil2: 'liste',
      });
      expect(columnRoles(analysis, 'Suivi')).toEqual({
        B: 'hierarchie',
        C: 'hierarchie',
        D: 'numero',
        E: 'structurePilote',
        F: 'titre',
        G: 'sousAction',
        H: 'calendrier',
        I: 'calendrier',
        J: 'calendrier',
        K: 'calendrier',
        L: 'statut',
        N: 'budget',
        O: 'financements',
      });
    });

    it('construit l’arbre bandeau > objectif stratégique > objectif opérationnel > fiche', async () => {
      const analysis = await analyze(buildHorizontalHierarchyWorkbook());

      expect(treeOf(analysis.actions)).toEqual([
        "AMBITION n°1 : Pour un territoire sobre en énergie > Se déplacer moins et mieux > Développer l'usage des transports collectifs > 1 - Aménager deux pôles multimodaux",
        "AMBITION n°1 : Pour un territoire sobre en énergie > Se déplacer moins et mieux > Développer l'usage des transports collectifs > 2 - Communiquer sur les aides à la mobilité",
        'AMBITION n°1 : Pour un territoire sobre en énergie > Se déplacer moins et mieux > Favoriser le covoiturage > 3 - Déployer des aires de covoiturage',
        "AMBITION n°1 : Pour un territoire sobre en énergie > Développer l'économie circulaire > Limiter l'usage des ressources > 4 - Faire monter en compétence les acteurs (EIT)",
        "AMBITION n°1 : Pour un territoire sobre en énergie > Développer l'économie circulaire > Accompagner les acteurs économiques > 5 - Faire monter en compétence les acteurs (EIT)",
        'AMBITION n°2 Pour un territoire préservé > Maîtriser la ressource en eau > Réduire les fuites des réseaux > 6 - Réduire les fuites des réseaux',
      ]);
      expect(
        analysis.actions.map(({ sousActions }) => sousActions.length)
      ).toEqual([3, 2, 2, 2, 2, 2]);
    });

    it('signale les libellés décalés et les onglets ignorés', async () => {
      const { warnings } = await analyze(buildHorizontalHierarchyWorkbook());

      expect(warnings).toEqual(
        expect.arrayContaining([
          expect.stringMatching(
            /colonne G : le libellé « PILOTE » annonce structure pilote, mais le contenu est lu comme sous-actions/
          ),
          expect.stringMatching(/« Synthèse » ignoré : tableau de synthèse/),
          expect.stringMatching(/« Feuil2 » ignoré/),
        ])
      );
    });

    it('ajoute les indicateurs du complément aux objectifs des fiches', async () => {
      const { actions } = await analyze(buildHorizontalHierarchyWorkbook());

      expect(actions[0].objectifs).toBe(
        '- Fréquentation des pôles (cible : 900)\n- Part modale des transports collectifs (cible : 0.035)'
      );
      expect(actions[2].objectifs).toBe(
        "- Nombre d'aires équipées (cible : 3)"
      );
      expect(actions[1].objectifs).toBeNull();
    });

    it('donne une tranche de texte source par action, sans modèle', async () => {
      const { actions, source, modelPages } = await analyze(
        buildHorizontalHierarchyWorkbook()
      );

      expect(modelPages).toEqual([]);
      expect(source.chunks).toHaveLength(actions.length);
      expect(source.chunkIndexByAction).toEqual(actions.map((_, i) => i));
      expect(source.chunks[0]).toContain('Fiche n°1 : Aménager deux pôles');
    });
  });

  it('lit la même hiérarchie répétée sur chaque rangée, sans fusion', async () => {
    const merged = await analyze(buildHorizontalHierarchyWorkbook());
    const repeated = await analyze(buildRepeatedHierarchyWorkbook());

    expect(rolesOf(repeated)).toEqual({ Plan: 'plan' });
    expect(columnRoles(repeated, 'Plan')).toMatchObject({
      A: 'hierarchie',
      B: 'hierarchie',
      C: 'hierarchie',
      D: 'numero',
      F: 'titre',
      G: 'sousAction',
      H: 'statut',
    });
    expect(treeOf(repeated.actions)).toEqual(treeOf(merged.actions));
    expect(repeated.actions.map(({ sousActions }) => sousActions)).toEqual(
      merged.actions.map(({ sousActions }) =>
        sousActions.map((sousAction) => ({
          ...sousAction,
          dateDebut: null,
          dateFin: null,
        }))
      )
    );
  });

  it('lit une hiérarchie verticale faite de rangées de titre', async () => {
    const analysis = await analyze(buildVerticalHierarchyWorkbook());

    expect(analysis.sheets[0]).toMatchObject({
      role: 'plan',
      shape: 'verticale',
    });
    expect(treeOf(analysis.actions)).toEqual([
      'Axe 1 – Mobilité durable > 1.1 Développer les transports collectifs > Créer une ligne de bus express vers la gare',
      'Axe 1 – Mobilité durable > 1.1 Développer les transports collectifs > Cadencer les navettes du marché hebdomadaire',
      'Axe 1 – Mobilité durable > 1.2 Encourager les modes actifs > Aménager une piste cyclable entre les deux bourgs',
      'Axe 2 – Habitat économe > 2.1 Rénover le parc privé > Ouvrir un guichet unique de la rénovation',
      'Axe 2 – Habitat économe > 2.1 Rénover le parc privé > Former les artisans aux rénovations globales',
    ]);
    expect(analysis.actions[0]).toMatchObject({
      structurePilote: 'Interco',
      statut: StatutEnum.EN_COURS,
      dateFin: '2025-12-31',
    });
  });

  it('lit une hiérarchie numérotée 1 / 1.1 / 1.1.1', async () => {
    const analysis = await analyze(buildNumberedHierarchyWorkbook());

    expect(analysis.sheets[0]).toMatchObject({
      role: 'plan',
      shape: 'numerotation',
    });
    expect(treeOf(analysis.actions)).toEqual([
      'Réduire les consommations du patrimoine public > Connaître et suivre les consommations > 1.1.1 Installer des compteurs communicants dans les écoles',
      'Réduire les consommations du patrimoine public > Connaître et suivre les consommations > 1.1.2 Publier un bilan énergétique annuel des bâtiments',
      "Réduire les consommations du patrimoine public > Rénover les bâtiments les plus énergivores > 1.2.1 Isoler les combles de l'hôtel de ville",
      'Développer les énergies renouvelables locales > Produire de l’électricité solaire > 2.1.1 Équiper de panneaux solaires les toitures des gymnases',
      'Développer les énergies renouvelables locales > Produire de l’électricité solaire > 2.1.2 Créer une société citoyenne de production solaire',
    ]);
  });

  it('prend le nom de l’onglet comme axe quand chaque onglet est un axe', async () => {
    const analysis = await analyze(buildSheetPerAxisWorkbook());

    expect(rolesOf(analysis)).toEqual({ Mobilité: 'plan', Habitat: 'plan' });
    expect(columnRoles(analysis, 'Habitat')).toEqual({
      A: 'titre',
      B: 'structurePilote',
      C: 'statut',
      D: 'budget',
    });
    expect(treeOf(analysis.actions)).toEqual([
      'Mobilité > Créer une ligne de bus express vers la gare',
      'Mobilité > Aménager des aires de covoiturage aux entrées de ville',
      'Mobilité > Développer un service de location de vélos électriques',
      'Habitat > Ouvrir un guichet unique de la rénovation énergétique',
      'Habitat > Former les artisans aux rénovations globales',
      'Habitat > Repérer les logements indignes avec les communes',
    ]);
    expect(analysis.actions.map(({ budget }) => budget)).toEqual([
      120000,
      45000,
      30000,
      80000,
      15000,
      null,
    ]);
  });

  it('lit une fiche-formulaire par onglet', async () => {
    const analysis = await analyze(buildFormWorkbook());

    expect(analysis.sheets.map(({ role, shape }) => [role, shape])).toEqual([
      ['plan', 'formulaire'],
      ['plan', 'formulaire'],
      ['plan', 'formulaire'],
    ]);
    expect(treeOf(analysis.actions)).toEqual([
      'Sobriété énergétique > Rénover l’éclairage public des zones d’activités',
      'Sobriété énergétique > Former les agents aux gestes économes en énergie',
      'Énergies renouvelables > Installer une chaufferie bois au centre aquatique',
    ]);
    expect(analysis.actions[0]).toMatchObject({
      structurePilote: 'Service technique',
      statut: StatutEnum.EN_COURS,
      budget: 250000,
      description: 'Remplacer les lampadaires par des LED pilotées.',
      sousActions: [
        expect.objectContaining({ titre: 'Réaliser un diagnostic du parc' }),
        expect.objectContaining({ titre: 'Lancer le marché de travaux' }),
      ],
    });
    expect(analysis.actions[2].statut).toBe(StatutEnum.REALISE);
  });

  describe('tableau plat, une rangée par fiche', () => {
    const expectedTree = [
      'Mobilité > Créer une ligne de bus express vers la gare',
      'Mobilité > Aménager des aires de covoiturage aux entrées de ville',
      'Habitat > Ouvrir un guichet unique de la rénovation énergétique',
      'Habitat > Former les artisans aux rénovations globales',
      'Agriculture > Accompagner la conversion des exploitations en bio',
    ];

    it('lit l’axe répété en texte', async () => {
      const analysis = await analyze(buildFlatTableWorkbook());

      expect(columnRoles(analysis, 'Feuil1')).toEqual({
        A: 'hierarchie',
        B: 'titre',
        C: 'structurePilote',
        D: 'dateFin',
        E: 'statut',
      });
      expect(treeOf(analysis.actions)).toEqual(expectedTree);
    });

    it('reporte vers le bas l’axe laissé vide d’un CSV', () => {
      const analysis = analyzeWorkbook([readCsvGrid(buildFlatTableCsv())]);

      expect(analysis.sheets[0].role).toBe('plan');
      expect(treeOf(analysis.actions)).toEqual(expectedTree);
      expect(analysis.actions[1]).toMatchObject({
        structurePilote: 'Commune',
        statut: StatutEnum.A_VENIR,
        dateFin: '2026-12-31',
      });
    });
  });

  it('lit le modèle d’import de la plateforme, sous-actions et sous-axe facultatif compris', async () => {
    const analysis = await analyze(buildTetTemplateWorkbook());

    expect(columnRoles(analysis, 'Plan')).toEqual({
      A: 'hierarchie',
      B: 'hierarchie',
      D: 'titre',
      E: 'sousAction',
      F: 'description',
      G: 'structurePilote',
      H: 'personnePilote',
      I: 'budget',
      J: 'statut',
      K: 'dateDebut',
      L: 'dateFin',
    });
    expect(treeOf(analysis.actions)).toEqual([
      '1. Sobriété énergétique > 1.1 Patrimoine public > Rénover l’éclairage public des zones d’activités',
      '1. Sobriété énergétique > Former les agents aux gestes économes en énergie',
      '2. Énergies renouvelables > Installer une chaufferie bois au centre aquatique',
    ]);
    expect(analysis.actions[0]).toMatchObject({
      statut: StatutEnum.EN_COURS,
      budget: 250000,
      dateDebut: '2025-01-01',
      dateFin: '2026-12-31',
      personnePilote: 'Jeanne Martin',
      sousActions: [
        expect.objectContaining({
          titre: 'Réaliser un diagnostic du parc',
          statut: StatutEnum.REALISE,
          dateFin: '2025-06-30',
        }),
        expect.objectContaining({
          titre: 'Lancer le marché de travaux',
          statut: StatutEnum.A_VENIR,
        }),
      ],
    });
  });

  it('confie au modèle l’onglet qu’il ne sait pas lire, sans le perdre', async () => {
    const analysis = await analyze(buildMixedWorkbook());

    expect(rolesOf(analysis)).toEqual({
      Feuil1: 'plan',
      'Notes du comité': 'modele',
    });
    expect(analysis.actions).toHaveLength(5);
    expect(analysis.modelPages).toHaveLength(1);
    expect(analysis.modelPages[0]).toMatchObject({
      index: 1,
      label: 'Notes du comité',
    });
    expect(analysis.modelPages[0].text).toContain('sobriété numérique');
    expect(analysis.warnings).toContainEqual(
      expect.stringMatching(/« Notes du comité » confié au modèle/)
    );
  });

  it('reprend les colonnes non reconnues en description et les signale', async () => {
    const analysis = await analyze(
      buildTestWorkbook([
        {
          name: 'Plan',
          rows: [
            ['Axe', 'Action', 'Porteur', 'Gain carbone estimé'],
            [
              'Mobilité',
              'Créer une ligne de bus express vers la gare',
              'Interco',
              'Fort',
            ],
            [
              'Mobilité',
              'Aménager des aires de covoiturage en entrée de ville',
              'Commune',
              'Moyen',
            ],
            [
              'Habitat',
              'Ouvrir un guichet unique de la rénovation',
              'Interco',
              'Fort',
            ],
          ],
        },
      ])
    );

    expect(analysis.actions[0].description).toBe('Gain carbone estimé : Fort');
    expect(analysis.warnings).toContainEqual(
      'Onglet « Plan » : colonnes non reconnues, reprises dans la description des fiches : D « Gain carbone estimé ».'
    );
  });

  it('applique les champs désactivés', async () => {
    const analysis = analyzeWorkbook(
      await readTestGrids(await buildHorizontalHierarchyWorkbook()),
      { disabledFields: ['statut', 'budget', 'structure pilote'] }
    );

    expect(analysis.actions[0]).toMatchObject({
      statut: null,
      budget: null,
      structurePilote: null,
    });
    expect(
      analysis.actions[0].sousActions.every(({ statut }) => statut === null)
    ).toBe(true);
  });

  it('ignore un onglet masqué', async () => {
    const analysis = await analyze(
      buildTestWorkbook([
        {
          name: 'Plan',
          rows: [
            ['Axe', 'Action', 'Porteur'],
            [
              'Mobilité',
              'Créer une ligne de bus express vers la gare',
              'Interco',
            ],
            [
              'Mobilité',
              'Aménager des aires de covoiturage en entrée de ville',
              'Commune',
            ],
            ['Habitat', 'Ouvrir un guichet unique de la rénovation', 'Interco'],
          ],
        },
        {
          name: 'Brouillon',
          state: 'hidden',
          rows: [['Une ancienne version du plan, à ne pas importer']],
        },
      ])
    );

    expect(rolesOf(analysis)).toEqual({ Plan: 'plan', Brouillon: 'masque' });
    expect(analysis.modelPages).toEqual([]);
    expect(analysis.warnings).toContainEqual(
      'Onglet « Brouillon » ignoré : il est masqué.'
    );
  });

  describe('onglets qui ne sont pas des plans', () => {
    it('confie au modèle un annuaire, un budget par poste, un planning et un catalogue d’indicateurs', async () => {
      const analysis = await analyze(buildLookalikeSheetsWorkbook());

      expect(rolesOf(analysis)).toEqual({
        Annuaire: 'modele',
        'Budget 2025': 'modele',
        Réunions: 'modele',
        'Catalogue indicateurs': 'modele',
      });
      expect(analysis.actions).toEqual([]);
      const checksOf = (name: string) =>
        analysis.sheets.find((sheet) => sheet.name === name)?.checks ?? [];
      expect(checksOf('Annuaire')).toContain('✗ 0/6 titres rédigés');
      expect(checksOf('Catalogue indicateurs')).toContain(
        '✗ le libellé des titres annonce indicateurs'
      );
    });

    it('ne fait pas d’une page de présentation une fiche, ni un axe de l’onglet du plan', async () => {
      const analysis = await analyze(buildCoverPageWorkbook());

      expect(rolesOf(analysis)).toEqual({
        Présentation: 'modele',
        PCAET: 'plan',
      });
      expect(treeOf(analysis.actions)[0]).toBe(
        'Mobilité > Créer une ligne de bus express vers la gare'
      );
    });

    it('confie au modèle une fiche-formulaire suivie du tableau de ses étapes', async () => {
      const analysis = await analyze(buildFormWithStepsWorkbook());

      expect(rolesOf(analysis)).toEqual({
        'Fiche 1': 'modele',
        'Fiche 2': 'modele',
      });
      expect(analysis.sheets[0].checks).toContain(
        '✗ formulaire de fiche (4 champs) au-dessus du tableau'
      );
    });

    it('lit un plan riche en budgets annuels, sans le prendre pour une synthèse', async () => {
      const analysis = await analyze(
        buildYearlyBudgetWorkbook({ withTotal: false })
      );

      expect(rolesOf(analysis)).toEqual({ Plan: 'plan' });
      // Budget 2021 à 2028 : 1 000 + 2 000 + … + 8 000.
      expect(analysis.actions.map(({ budget }) => budget)).toEqual([
        36000, 36000, 36000, 36000,
      ]);
      expect(analysis.actions[0].financements).toBeNull();
    });

    it('confie au modèle une synthèse quand rien d’autre ne se lit', async () => {
      const analysis = await analyze(
        buildTestWorkbook([
          {
            name: 'Tableau de bord',
            rows: [
              ['Nombre d’actions', 12],
              ['Budget engagé', 450000],
              ['Actions réalisées', 4],
            ],
          },
        ])
      );

      expect(rolesOf(analysis)).toEqual({ 'Tableau de bord': 'modele' });
      expect(analysis.modelPages).toHaveLength(1);
    });
  });

  describe('structures que le contenu révèle', () => {
    it('lit une hiérarchie fusionnée sans rangée d’en-tête', async () => {
      const analysis = await analyze(buildHeaderlessWorkbook());

      expect(rolesOf(analysis)).toEqual({ Feuil1: 'plan' });
      expect(treeOf(analysis.actions)).toEqual([
        'Se déplacer autrement > Créer une ligne de bus express vers la gare',
        'Se déplacer autrement > Aménager des aires de covoiturage aux entrées',
        'Mieux se loger > Ouvrir un guichet unique de la rénovation',
        'Mieux se loger > Former les artisans aux rénovations globales',
      ]);
      expect(analysis.actions[0].sousActions.map(({ titre }) => titre)).toEqual(
        [
          'Réaliser l’étude d’opportunité de la ligne',
          'Mettre en service la première phase',
        ]
      );
    });

    it('lit une numérotation plus profonde que la fiche comme ses sous-actions', async () => {
      const analysis = await analyze(buildDeepNumberingWorkbook());

      expect(treeOf(analysis.actions)).toEqual([
        'Sobriété énergétique > Patrimoine public > 1.1.1 Rénover les écoles du territoire',
        'Sobriété énergétique > Patrimoine public > 1.1.2 Passer l’éclairage public en LED',
        'Énergies renouvelables > Solaire > 2.1.1 Solariser les toitures des gymnases',
      ]);
      expect(analysis.actions[0]).toMatchObject({
        structurePilote: 'Bâtiments',
        statut: StatutEnum.EN_COURS,
        sousActions: [
          expect.objectContaining({
            titre: 'Réaliser les audits énergétiques',
            statut: StatutEnum.REALISE,
          }),
          expect.objectContaining({
            titre: 'Engager les travaux d’isolation',
            statut: StatutEnum.A_VENIR,
          }),
        ],
      });
      expect(analysis.actions[1].sousActions).toEqual([]);
    });

    it('lit en niveau d’axe un « Objectif » fusionné entre l’orientation et la fiche, et le signale', async () => {
      const analysis = await analyze(buildMislabelledHierarchyWorkbook());

      expect(treeOf(analysis.actions)).toEqual([
        'Sobriété > Bâtiments publics > Rénover les écoles maternelles du territoire',
        'Sobriété > Bâtiments publics > Optimiser le chauffage des gymnases municipaux',
        'Sobriété > Éclairage > Moderniser l’éclairage public des centres-bourgs',
        'Adaptation > Ressource en eau > Réduire les fuites des réseaux d’eau potable',
        'Adaptation > Ressource en eau > Récupérer les eaux pluviales des bâtiments publics',
      ]);
      expect(analysis.actions[0].objectifs).toBeNull();
      expect(analysis.warnings).toContain(
        "Onglet « PCAET », colonne C : le libellé « Objectif » annonce objectifs, mais le contenu est lu comme niveau d'axe."
      );
    });

    it('garde les niveaux sans libellé aux intitulés courts', async () => {
      const analysis = await analyze(buildUnlabelledLevelsWorkbook());

      expect(treeOf(analysis.actions).slice(0, 2)).toEqual([
        'Territoire sobre > Mobilité > Transports collectifs > Créer une ligne express vers la gare TER',
        'Territoire sobre > Mobilité > Transports collectifs > Renforcer la fréquence de la ligne 2',
      ]);
      expect(analysis.actions[1].statut).toBe(StatutEnum.A_VENIR);
      expect(analysis.actions[0].description).toBeNull();
    });

    it('prolonge une valeur écrite une fois sous une colonne de fusions', async () => {
      const analysis = await analyze(
        buildTestWorkbook([buildIrregularMergeSheet()])
      );

      expect(analysis.actions.map((action) => axisPathOf(action))).toEqual([
        ['Réduire les consommations des bâtiments'],
        ['Réduire les consommations des bâtiments'],
        ['Préserver la ressource en eau'],
        ['Préserver la ressource en eau'],
      ]);
      expect(
        analysis.warnings.some((warning) => warning.includes('sans axe'))
      ).toBe(false);
    });
  });

  describe('valeurs gardées, jamais jetées', () => {
    it('lit échéances en texte, avancement chiffré et budgets en M€, et garde le texte d’origine', async () => {
      const analysis = await analyze(buildFreeFormValuesWorkbook());

      expect(
        analysis.actions.map(({ dateFin, statut, budget }) => [
          dateFin,
          statut,
          budget,
        ])
      ).toEqual([
        ['2026-12-31', StatutEnum.EN_COURS, 15000],
        ['2025-06-30', StatutEnum.REALISE, 1200000],
        ['2027-12-31', StatutEnum.A_VENIR, null],
        ['2026-12-31', StatutEnum.EN_COURS, null],
      ]);
      expect(analysis.actions[0].description).toBe(
        'Date de mise à jour : 2024-03-01\n\nÉchéance : Fin 2026'
      );
      expect(analysis.actions[2].description).toBe(
        'Date de mise à jour : 2024-03-03\n\nÉchéance : 2025-2027\n\nBudget : à chiffrer'
      );
      expect(analysis.warnings).toContain(
        "Onglet « Plan » : dates ou montants lus d'après l'année ou pas du tout, gardés tels quels en description : Échéance « Fin 2026 », Échéance « Juin 2025 », Échéance « 2025-2027 », Budget « à chiffrer »."
      );
    });

    it('garde en description un avancement rédigé', async () => {
      const analysis = await analyze(buildWrittenProgressWorkbook());

      expect(analysis.actions[0]).toMatchObject({
        statut: null,
        description:
          'État d’avancement : Étude de faisabilité rendue en mars, consultation à venir',
      });
      expect(analysis.actions[3].description).toBe(
        'État d’avancement : À venir'
      );
    });

    it('garde une donnée ajoutée sous la plage d’un total, et signale l’écart', async () => {
      const analysis = await analyze(
        buildTestWorkbook([buildShortSumRangeSheet()])
      );

      expect(analysis.actions).toHaveLength(5);
      expect(analysis.warnings).toContain(
        'Onglet « Plan » : la somme des budgets des fiches (15\u202f000) diffère du total E7 (6\u202f000).'
      );
    });

    it('lit vides les cellules en erreur et les formules sans valeur, en le signalant', async () => {
      const analysis = await analyze(
        buildTestWorkbook([buildErrorCellsSheet()])
      );

      expect(analysis.actions[1]).toMatchObject({
        structurePilote: null,
        statut: null,
      });
      expect(analysis.warnings).toEqual(
        expect.arrayContaining([
          'Onglet « Plan » : 2 cellule(s) en erreur (#REF!, #N/A…) lues comme vides.',
          'Onglet « Plan » : 1 formule(s) sans valeur calculée, lues comme vides ; ouvrir et enregistrer le fichier dans un tableur les calcule.',
        ])
      );
      expect(
        analysis.warnings.some((warning) => warning.includes('non reconnus'))
      ).toBe(false);
    });

    it('lit un objectif répété une fois, et chaque montant d’une colonne par sous-action', async () => {
      const analysis = await analyze(
        buildTestWorkbook([buildRepeatedValuesSheet()])
      );

      expect(
        analysis.actions.map(({ objectifs, budget }) => [objectifs, budget])
      ).toEqual([
        ['Réduire de 10 % les trajets solo', 30000],
        ['Rénover 500 logements', 13000],
        ['Traiter dix copropriétés', 5000],
      ]);
    });
  });
});
