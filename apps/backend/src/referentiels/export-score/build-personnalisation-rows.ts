import { PersonnalisationReponsesPayload } from '@tet/domain/collectivites';
import { Alignment, Cell, Worksheet } from 'exceljs';
import * as Utils from '../../utils/excel/export-excel.utils';
import {
  ExportMode,
  PersonnalisationExportQuestion,
  ScoreComparisonData,
} from './load-score-comparison.service';

const WIDTH_THEMATIQUE = 30;
const WIDTH_QUESTION = 70;
const WIDTH_REPONSE = 40;
const WIDTH_MESURES_AFFECTEES = 50;

// alignements des colonnes (texte centré verticalement partout)
const ALIGN_THEMATIQUE = {
  vertical: 'middle',
  horizontal: 'left',
} as Partial<Alignment>;
const ALIGN_QUESTION = {
  vertical: 'middle',
  horizontal: 'left',
  wrapText: true,
} as Partial<Alignment>;
const ALIGN_REPONSE = {
  vertical: 'middle',
  horizontal: 'center',
} as Partial<Alignment>;
const ALIGN_REPONSE_WRAP = {
  ...ALIGN_REPONSE,
  wrapText: true,
} as Partial<Alignment>;
const ALIGN_MESURES_AFFECTEES = {
  vertical: 'middle',
  horizontal: 'left',
  wrapText: true,
} as Partial<Alignment>;

/**
 * Ajoute la feuille "Personnalisation" : la liste de toutes les questions de
 * personnalisation du référentiel exporté (groupées par thématique), avec une
 * colonne de réponse par snapshot exporté.
 */
export function buildPersonnalisationRows(
  data: ScoreComparisonData,
  worksheet: Worksheet
) {
  const { personnalisationQuestions, snapshot1, snapshot2 } = data;
  const withSecondSnapshot =
    data.exportMode !== ExportMode.SINGLE_SNAPSHOT && snapshot2 !== null;

  // configuration des colonnes : en mode "un snapshot" l'en-tête de réponse est
  // simplement "Réponse" ; en mode "deux snapshots" chaque libellé de snapshot
  // est rappelé entre parenthèses. La colonne "Mesures affectées" ferme le
  // tableau (contenu identique à la section du même nom sur la page
  // personnalisation, restreint aux mesures du référentiel exporté).
  const columns: {
    title: string;
    width: number;
    alignment: Partial<Alignment>;
  }[] = [
    { title: 'Thématique', width: WIDTH_THEMATIQUE, alignment: ALIGN_THEMATIQUE },
    { title: 'Question', width: WIDTH_QUESTION, alignment: ALIGN_QUESTION },
    {
      title: withSecondSnapshot
        ? `Réponse (${data.snapshot1Label})`
        : 'Réponse',
      width: WIDTH_REPONSE,
      alignment: ALIGN_REPONSE,
    },
  ];
  if (withSecondSnapshot) {
    columns.push({
      title: `Réponse (${data.snapshot2Label})`,
      width: WIDTH_REPONSE,
      alignment: ALIGN_REPONSE,
    });
  }
  columns.push({
    title: 'Mesures affectées',
    width: WIDTH_MESURES_AFFECTEES,
    alignment: ALIGN_MESURES_AFFECTEES,
  });
  const mesuresAffecteesColIndex = columns.length;

  // ligne d'en-tête
  columns.forEach((col, colIndex) => {
    const column = worksheet.getColumn(colIndex + 1);
    column.width = col.width;
    column.style = { alignment: col.alignment };
    const headCell = worksheet.getCell(1, colIndex + 1);
    headCell.value = col.title;
    headCell.style = { ...headCell.style, ...Utils.HEADING2 };
  });

  // une ligne par question (triées/groupées par thématique)
  const orderedQuestions = sortPersonnalisationQuestions(
    personnalisationQuestions
  );

  let rowIndex = 1;
  orderedQuestions.forEach((question) => {
    rowIndex++;

    worksheet.getCell(rowIndex, 1).value = question.thematiqueNom ?? '';
    worksheet.getCell(rowIndex, 2).value = question.formulation;

    setReponseCell(
      worksheet.getCell(rowIndex, 3),
      snapshot1.personnalisationReponses,
      question
    );
    if (withSecondSnapshot && snapshot2) {
      setReponseCell(
        worksheet.getCell(rowIndex, 4),
        snapshot2.personnalisationReponses,
        question
      );
    }

    const mesuresCell = worksheet.getCell(rowIndex, mesuresAffecteesColIndex);
    mesuresCell.value = formatMesuresAffectees(question.mesuresAffectees);
    mesuresCell.alignment = ALIGN_MESURES_AFFECTEES;
  });
}

/**
 * Met en forme la liste des mesures affectées : une mesure par ligne, sous la
 * forme « identifiant - libellé » (« libellé » seul si la mesure n'a pas de
 * numérotation, comme pour le référentiel CR).
 */
function formatMesuresAffectees(
  mesuresAffectees: PersonnalisationExportQuestion['mesuresAffectees']
): string {
  return mesuresAffectees
    .map(({ identifiant, nom }) =>
      identifiant ? `${identifiant} - ${nom}` : nom
    )
    .join('\n');
}

/**
 * Groupe les questions par thématique (tri alphabétique fr, questions sans
 * thématique en tête) puis, au sein de chaque thématique, reprend le même ordre
 * que la page personnalisation : `ordonnancement` croissant (questions sans
 * ordonnancement en fin), départagé par `questionId` — c'est l'ordre renvoyé par
 * `ListPersonnalisationQuestionsRepository.listQuestionsWithChoices`
 * (`ORDER BY ordonnancement, id`).
 */
export function sortPersonnalisationQuestions(
  questions: PersonnalisationExportQuestion[]
): PersonnalisationExportQuestion[] {
  return [...questions].sort((a, b) => {
    const thematiqueA = a.thematiqueNom ?? '';
    const thematiqueB = b.thematiqueNom ?? '';
    if (thematiqueA !== thematiqueB) {
      return thematiqueA.localeCompare(thematiqueB, 'fr');
    }
    const ordonnancementA = a.ordonnancement ?? Number.POSITIVE_INFINITY;
    const ordonnancementB = b.ordonnancement ?? Number.POSITIVE_INFINITY;
    if (ordonnancementA !== ordonnancementB) {
      return ordonnancementA - ordonnancementB;
    }
    return a.questionId.localeCompare(b.questionId);
  });
}

/** Renseigne une cellule de réponse à partir du payload d'un snapshot */
function setReponseCell(
  cell: Cell,
  reponses: PersonnalisationReponsesPayload,
  question: PersonnalisationExportQuestion
) {
  const value = reponses?.[question.questionId];

  if (value === null || value === undefined) {
    cell.value = '';
    return;
  }

  if (question.type === 'binaire') {
    cell.value = value === true ? 'Oui' : value === false ? 'Non' : '';
    return;
  }

  if (question.type === 'proportion') {
    if (typeof value === 'number') {
      cell.value = value;
      // format nombre pourcentage ; l'alignement centré est hérité de la colonne
      cell.numFmt = Utils.getNumberFormat(value, Utils.FORMAT_PERCENT);
    } else {
      cell.value = '';
    }
    return;
  }

  // type === 'choix' : la valeur stockée est l'id du choix
  const choix = question.choix.find((c) => c.id === value);
  cell.value = choix?.formulation ?? String(value);
  // libellé potentiellement long : reste centré mais ajusté (retour à la ligne)
  cell.alignment = ALIGN_REPONSE_WRAP;
}
