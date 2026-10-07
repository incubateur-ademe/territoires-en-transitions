import { PersonnalisationReponsesPayload } from '@tet/domain/collectivites';
import { ScoreSnapshot } from '@tet/domain/referentiels';
import { CellValue, Workbook, Worksheet } from 'exceljs';
import {
  buildPersonnalisationRows,
  sortPersonnalisationQuestions,
} from './build-personnalisation-rows';
import {
  ExportMode,
  PersonnalisationExportQuestion,
  ScoreComparisonData,
} from './load-score-comparison.service';

const snap = (reponses: PersonnalisationReponsesPayload): ScoreSnapshot =>
  ({ personnalisationReponses: reponses } as unknown as ScoreSnapshot);

const questions: PersonnalisationExportQuestion[] = [
  {
    questionId: 'q_mobilite',
    thematiqueNom: 'Mobilité',
    formulation: 'Zone à faibles émissions ?',
    ordonnancement: 1,
    type: 'binaire',
    choix: [],
    mesuresAffectees: [
      {
        actionId: 'cae_1.2.3',
        identifiant: '1.2.3',
        nom: 'Développer les mobilités douces',
      },
      { actionId: 'cae_1.2.4', identifiant: '1.2.4', nom: 'Créer une ZFE' },
    ],
  },
  {
    questionId: 'q_dechets_choix',
    thematiqueNom: 'Déchets',
    formulation: 'Mode de gestion des déchets ?',
    ordonnancement: 1,
    type: 'choix',
    choix: [
      { id: 'regie', formulation: 'Régie directe' },
      { id: 'delegation', formulation: 'Délégation de service public' },
    ],
    mesuresAffectees: [
      {
        actionId: 'cae_3.1.1',
        identifiant: '3.1.1',
        nom: 'Optimiser la collecte',
      },
    ],
  },
  {
    questionId: 'q_dechets_part',
    thematiqueNom: 'Déchets',
    formulation: 'Autre question déchets',
    ordonnancement: 2,
    type: 'proportion',
    choix: [],
    mesuresAffectees: [],
  },
  {
    questionId: 'q_sans_thematique',
    thematiqueNom: null,
    formulation: 'Question sans thématique',
    ordonnancement: 1,
    type: 'binaire',
    choix: [],
    mesuresAffectees: [],
  },
];

function createData(
  overrides: Partial<ScoreComparisonData> = {}
): ScoreComparisonData {
  return {
    exportMode: ExportMode.SINGLE_SNAPSHOT,
    snapshot1Label: 'État des lieux 2024',
    snapshot2Label: '',
    snapshot1: snap({}),
    snapshot2: null,
    personnalisationQuestions: questions,
    ...overrides,
  } as ScoreComparisonData;
}

function rowValues(
  worksheet: Worksheet,
  rowIndex: number,
  columnCount: number
): CellValue[] {
  return Array.from(
    { length: columnCount },
    (_, i) => worksheet.getCell(rowIndex, i + 1).value
  );
}

describe('sortPersonnalisationQuestions', () => {
  it('groupe par thématique (alpha asc, sans thématique en tête) puis par ordonnancement', () => {
    const ordered = sortPersonnalisationQuestions(questions).map(
      (q) => q.questionId
    );
    expect(ordered).toEqual([
      'q_sans_thematique', // thématique nulle => en tête
      'q_dechets_choix', // Déchets, ordonnancement 1
      'q_dechets_part', // Déchets, ordonnancement 2
      'q_mobilite', // Mobilité
    ]);
  });

  it('relègue les questions sans ordonnancement en fin de thématique', () => {
    const sansOrdonnancement: PersonnalisationExportQuestion[] = [
      { ...questions[1], questionId: 'q_a', ordonnancement: null },
      { ...questions[1], questionId: 'q_b', ordonnancement: 5 },
    ];
    const ordered = sortPersonnalisationQuestions(sansOrdonnancement).map(
      (q) => q.questionId
    );
    expect(ordered).toEqual(['q_b', 'q_a']);
  });
});

describe('buildPersonnalisationRows', () => {
  let worksheet: Worksheet;

  const build = (data: ScoreComparisonData) => {
    worksheet = new Workbook().addWorksheet('Personnalisation');
    buildPersonnalisationRows(data, worksheet);
  };

  it('une seule colonne de réponse pour un export simple', () => {
    build(
      createData({
        snapshot1: snap({
          q_mobilite: true,
          q_dechets_choix: 'delegation',
          q_dechets_part: 0.42,
        }),
      })
    );

    expect(rowValues(worksheet, 1, 4)).toEqual([
      'Thématique',
      'Question',
      'Réponse', // un seul snapshot : pas de rappel du libellé
      'Mesures affectées',
    ]);

    // ordre groupé/trié + valeurs formatées
    expect(rowValues(worksheet, 2, 4)).toEqual([
      '',
      'Question sans thématique',
      '', // pas de réponse => cellule vide
      '', // aucune mesure affectée => cellule vide
    ]);
    expect(rowValues(worksheet, 3, 4)).toEqual([
      'Déchets',
      'Mode de gestion des déchets ?',
      'Délégation de service public',
      '3.1.1 - Optimiser la collecte',
    ]);
    expect(rowValues(worksheet, 4, 4)).toEqual([
      'Déchets',
      'Autre question déchets',
      0.42,
      '',
    ]);
    expect(rowValues(worksheet, 5, 4)).toEqual([
      'Mobilité',
      'Zone à faibles émissions ?',
      'Oui',
      // une mesure par ligne, format "identifiant - libellé"
      '1.2.3 - Développer les mobilités douces\n1.2.4 - Créer une ZFE',
    ]);

    // colonne "Mesures affectées" : alignée à gauche, centrée verticalement,
    // retour à la ligne
    expect(worksheet.getCell(5, 4).alignment).toEqual(
      expect.objectContaining({
        horizontal: 'left',
        vertical: 'middle',
        wrapText: true,
      })
    );

    // proportion => cellule numérique avec format pourcentage
    const proportionCell = worksheet.getCell(4, 3);
    expect(proportionCell.value).toBe(0.42);
    // pourcentage entier : pas de décimale => pas de séparateur décimal orphelin
    expect(proportionCell.numFmt).toBe('0%');

    // toutes les réponses sont centrées (h + v) dans leur colonne
    expect(worksheet.getColumn(3).style.alignment).toEqual(
      expect.objectContaining({ horizontal: 'center', vertical: 'middle' })
    );
    expect(worksheet.getCell(5, 3).alignment).toEqual(
      expect.objectContaining({ horizontal: 'center', vertical: 'middle' })
    );
    expect(proportionCell.alignment).toEqual(
      expect.objectContaining({ horizontal: 'center', vertical: 'middle' })
    );

    // réponse "choix" : centrée + retour à la ligne
    expect(worksheet.getCell(3, 3).alignment).toEqual(
      expect.objectContaining({
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      })
    );

    // texte centré verticalement aussi dans les colonnes Thématique et Question
    expect(worksheet.getCell(3, 1).alignment).toEqual(
      expect.objectContaining({ vertical: 'middle' })
    );
    expect(worksheet.getCell(3, 2).alignment).toEqual(
      expect.objectContaining({ vertical: 'middle' })
    );
  });

  it('proportion non entière : format avec décimale optionnelle', () => {
    build(
      createData({
        snapshot1: snap({ q_dechets_part: 0.175 }),
      })
    );

    const proportionCell = worksheet.getCell(4, 3);
    expect(proportionCell.value).toBe(0.175);
    expect(proportionCell.numFmt).toBe('0.#%');
  });

  it('deux colonnes de réponse en mode comparaison, vides si sans réponse', () => {
    build(
      createData({
        exportMode: ExportMode.COMPARISON,
        snapshot2Label: 'État des lieux 2023',
        snapshot1: snap({ q_mobilite: true }),
        snapshot2: snap({ q_mobilite: false }),
      })
    );

    expect(rowValues(worksheet, 1, 5)).toEqual([
      'Thématique',
      'Question',
      'Réponse (État des lieux 2024)',
      'Réponse (État des lieux 2023)',
      'Mesures affectées',
    ]);

    expect(rowValues(worksheet, 5, 5)).toEqual([
      'Mobilité',
      'Zone à faibles émissions ?',
      'Oui',
      'Non',
      '1.2.3 - Développer les mobilités douces\n1.2.4 - Créer une ZFE',
    ]);
    // question sans réponse dans les deux snapshots : la colonne "Mesures
    // affectées" reste renseignée (indépendante des réponses)
    expect(rowValues(worksheet, 3, 5)).toEqual([
      'Déchets',
      'Mode de gestion des déchets ?',
      '',
      '',
      '3.1.1 - Optimiser la collecte',
    ]);
  });
});
