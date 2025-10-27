import {
  ExportMode,
  ScoreComparisonData,
  ScoreRow,
} from '@/backend/referentiels/export-score/load-score-comparison.service';
import { ActionTypeEnum } from '@/backend/referentiels/models/action-type.enum';
import { getLibelleScoreIndicatif } from '@/backend/referentiels/score-indicatif/format-score-indicatif.utils';
import { ComputeScoreMode } from '@/backend/referentiels/snapshots/compute-score-mode.enum';
import { htmlToText } from '@/backend/utils/html-to-text.utils';
import { roundTo } from '@/backend/utils/number.utils';
import { toMerged } from 'es-toolkit';
import { CellFormulaValue, Style } from 'exceljs';
import { PreuveEssential } from '../../collectivites/documents/models/preuve.dto';
import * as Utils from '../../utils/excel/export-excel.utils';
import {
  StatutAvancement,
  StatutAvancementEnum,
} from '../models/action-statut.table';
import {
  getIdentifiantFromActionId,
  getParentIdFromActionId,
} from '../referentiels.utils';

/** Clé permettant de retrouver l'index d'une colonne points/scores */
type ColumnScoreKey =
  | 'potentiel1'
  | 'potentiel2'
  | 'Fait1'
  | 'Fait2'
  | 'Programme1'
  | 'Programme2'
  | 'PasFait1'
  | 'PasFait2'
  | 'pointFait1'
  | 'pointFait2'
  | 'pointProgramme1'
  | 'pointProgramme2'
  | 'pointPasFait1'
  | 'pointPasFait2';

/** Clé permettant de retrouver l'index d'une colonne */
type ColumnKey = ColumnScoreKey | 'pilotes';

/** Correspondance entre clé et index de colonne */
type ColumnLetterByKey = Partial<Record<ColumnKey, string>>;

/** Donne l'index (ou -1 si non trouvé) d'une colonne en fonction de sa clé */
export function getColumnIndex(columns: Column[], key: ColumnKey) {
  return columns.findIndex((col) => col.key === key);
}

/** Définition d'une colonne */
export type Column = {
  /** libellé de l'en-tête de colonne */
  title: string;
  /** attributs de la colonne */
  colProps?: {
    style?: Partial<Style>;
    width?: number;
  };
  /** attributs d'une cellule */
  cellProps?: {
    format?: 'number' | 'percent';
    style?: Partial<Style>;
  };
  /** attributs de la cellule d'en-tête uniquement */
  headCellProps?: {
    style?: Partial<Style>;
  };
  /** clé permetttant de référencer la colonne */
  key?: ColumnKey;
  /** fonction permettant de générer la valeur/formule d'une cellule */
  getValue: (
    args: GetValueArgs
  ) => string | number | null | undefined | CellFormulaValue;
};

type GetValueArgs = {
  data: ScoreComparisonData;
  scoreRow: ScoreRow;
  scoreRowIndex: number;
  rowIndex: number;
};

/** Détermine si une ligne est la ligne "Total" présente en haut de l'export  */
function isTotalRow(scoreRow: ScoreRow) {
  return scoreRow.actionType === ActionTypeEnum.REFERENTIEL;
}

// largeurs des colonnes
const WIDTH_SMALL = 12;
const WIDTH_MEDIUM = 50;

const AVANCEMENT_TO_LABEL: Record<StatutAvancement | 'non_concerne', string> = {
  [StatutAvancementEnum.NON_RENSEIGNE]: 'Non renseigné',
  [StatutAvancementEnum.FAIT]: 'Fait',
  [StatutAvancementEnum.PAS_FAIT]: 'Pas fait',
  [StatutAvancementEnum.DETAILLE]: 'Détaillé',
  [StatutAvancementEnum.PROGRAMME]: 'Programmé',
  [StatutAvancementEnum.NON_CONCERNE]: 'Non concerné',
};

/** Génère la liste des colonnes */
export function buildColumns(
  exportMode: ExportMode,
  isScoreIndicatifEnabled?: boolean
): Column[] {
  // va contenir la table de correspondances entre clé de colonne et lettre associée
  // pour pouvoir les utiliser dans les formules
  const columnLetterByKey: ColumnLetterByKey = {};

  // colonnes au début du tableau
  const columns: Column[] = [
    {
      title: 'N°',
      colProps: { width: WIDTH_SMALL },
      headCellProps: { style: Utils.HEADING2 },
      getValue: ({ scoreRow: row }) =>
        isTotalRow(row)
          ? 'Total'
          : row.score1.identifiant ||
            row.score2?.identifiant ||
            getIdentifiantFromActionId(row.actionId) ||
            '',
    },
    {
      title: 'Intitulé',
      colProps: {
        style: { alignment: Utils.ALIGN_LEFT_WRAP },
        width: WIDTH_MEDIUM,
      },
      headCellProps: { style: Utils.HEADING2 },
      getValue: ({ scoreRow: row }) =>
        isTotalRow(row) ? '' : row.score1.nom || row.score2?.nom,
    },
    {
      title: 'Description',
      colProps: {
        style: { alignment: Utils.ALIGN_LEFT_WRAP },
        width: WIDTH_MEDIUM,
      },
      headCellProps: { style: Utils.HEADING2 },
      getValue: ({ scoreRow: row, data }) => data.descriptions[row.actionId],
    },
    {
      title: 'Phase',
      colProps: {
        style: { alignment: Utils.ALIGN_CENTER },
        width: WIDTH_SMALL,
      },
      headCellProps: { style: Utils.HEADING2 },
      getValue: ({ scoreRow: row }) =>
        Utils.capitalize(row.score1.categorie || row.score2?.categorie),
    },
    {
      title: 'Potentiel max',
      cellProps: {
        style: { alignment: Utils.ALIGN_CENTER, font: Utils.ITALIC },
        format: 'number',
      },
      colProps: {
        style: { alignment: Utils.ALIGN_CENTER, font: Utils.ITALIC },
        width: WIDTH_SMALL,
      },
      headCellProps: {
        style: toMerged(Utils.HEADING2, { font: Utils.ITALIC }),
      },
      getValue: ({ scoreRow: row }) =>
        row.score1.score.pointReferentiel || row.score2?.score.pointReferentiel,
    },

    // 1er groupe de colonnes "points/scores"
    ...buildScoreColumns(1, columnLetterByKey, isScoreIndicatifEnabled),
  ];

  // ajoute le 2ème de groupe de colonnes "points/scores" quand il y a 2 snapshots dans l'export
  if (exportMode !== ExportMode.SINGLE_SNAPSHOT) {
    columns.push(
      ...buildScoreColumns(2, columnLetterByKey, isScoreIndicatifEnabled)
    );
  }

  // puis les colonnes de fin du tableau
  columns.push(
    {
      key: 'pilotes',
      title: 'Personnes pilotes',
      colProps: {
        style: { alignment: Utils.ALIGN_LEFT_WRAP },
        width: WIDTH_MEDIUM,
      },
      headCellProps: { style: Utils.HEADING2 },
      getValue: ({ scoreRow: row, data }) =>
        isTotalRow(row) ? '' : formatNoms(data.pilotes[row.actionId]),
    },
    {
      title: 'Services ou Directions pilotes',
      colProps: {
        style: { alignment: Utils.ALIGN_LEFT_WRAP },
        width: WIDTH_MEDIUM,
      },
      headCellProps: { style: Utils.HEADING2 },
      getValue: ({ scoreRow: row, data }) =>
        isTotalRow(row) ? '' : formatNoms(data.services[row.actionId]),
    },
    {
      title: 'Documents liés',
      colProps: {
        style: { alignment: Utils.ALIGN_LEFT_WRAP },
        width: WIDTH_MEDIUM,
      },
      headCellProps: { style: Utils.HEADING2 },
      getValue: ({ scoreRow: row }) =>
        formatPreuves(row.score1.preuves || row.score2?.preuves),
    },
    {
      title: 'Fiches actions liées',
      colProps: {
        style: { alignment: Utils.ALIGN_LEFT_WRAP },
        width: WIDTH_MEDIUM,
      },
      headCellProps: { style: Utils.HEADING2 },
      getValue: ({ scoreRow: row, data }) =>
        isTotalRow(row) ? '' : data.fichesActionLiees[row.actionId],
    }
  );

  // rempli la table de correspondance entre la clé d'une colonne et sa lettre
  columns.forEach((col, colIndex) => {
    if (col.key) {
      columnLetterByKey[col.key] = Utils.getColumLetter(colIndex);
    }
  });

  return columns;
}

type SnapshotIndex = 1 | 2;

/** Génère la liste des colonnes points/score/statut/état d'avancement */
function buildScoreColumns(
  snapshotIndex: SnapshotIndex,
  columnLetterByKey: ColumnLetterByKey,
  isScoreIndicatifEnabled?: boolean
): Column[] {
  const {
    getScoreByIndex,
    getScoreValueAndFormula,
    getPointValueAndFormula,
    scoreKey,
  } = buildScoreRowUtils(snapshotIndex, columnLetterByKey);

  // propriétés communes
  const colProps = {
    style: { alignment: Utils.ALIGN_CENTER },
    width: WIDTH_SMALL,
  };
  const headCellProps = { style: Utils.HEADING_SCORES };
  const lastHeadCellProps = toMerged(headCellProps, {
    style: { border: { right: Utils.BORDER_MEDIUM } },
  });
  const cellPropsPoints = {
    style: { alignment: Utils.ALIGN_CENTER },
    format: 'number' as const,
  };
  const cellPropsScore = {
    style: { alignment: Utils.ALIGN_CENTER },
    format: 'percent' as const,
  };

  const columns: Column[] = [
    {
      key: `potentiel${snapshotIndex}`,
      title: 'Potentiel collectivité',
      colProps,
      cellProps: cellPropsPoints,
      headCellProps,
      getValue: ({ scoreRow: row }) =>
        getScoreByIndex(row)?.pointPotentiel || null,
    },
    {
      key: `pointFait${snapshotIndex}`,
      title: 'Points réalisés',
      colProps,
      cellProps: cellPropsPoints,
      headCellProps,
      getValue: (args) => getPointValueAndFormula(args, 'Fait'),
    },
    {
      key: `Fait${snapshotIndex}`,
      title: '% réalisé',
      colProps,
      cellProps: cellPropsScore,
      headCellProps,
      getValue: (args) => getScoreValueAndFormula(args, 'Fait'),
    },
    {
      key: `pointProgramme${snapshotIndex}`,
      title: 'Points programmés',
      colProps,
      cellProps: cellPropsPoints,
      headCellProps,
      getValue: (args) => getPointValueAndFormula(args, 'Programme'),
    },
    {
      key: `Programme${snapshotIndex}`,
      title: '% programmé',
      colProps,
      cellProps: cellPropsScore,
      headCellProps,
      getValue: (args) => getScoreValueAndFormula(args, 'Programme'),
    },
    {
      key: `pointPasFait${snapshotIndex}`,
      title: 'Points pas faits',
      colProps,
      cellProps: cellPropsPoints,
      headCellProps,
      getValue: (args) => getPointValueAndFormula(args, 'PasFait'),
    },
    {
      title: '% pas fait',
      key: `PasFait${snapshotIndex}`,
      colProps,
      cellProps: cellPropsScore,
      headCellProps,
      getValue: (args) => getScoreValueAndFormula(args, 'PasFait'),
    },
    {
      title: 'Statut',
      colProps,
      headCellProps,
      getValue: ({ scoreRow: row, data }) => {
        return formatActionStatut(row, data, snapshotIndex);
      },
    },
    {
      title: "Champs de précision de l'état d'avancement",
      colProps: {
        style: { alignment: Utils.ALIGN_LEFT_WRAP },
        width: WIDTH_MEDIUM,
      },
      headCellProps: isScoreIndicatifEnabled
        ? headCellProps
        : lastHeadCellProps,
      getValue: ({ scoreRow: row }) =>
        htmlToText(getScoreByIndex(row)?.explication || ''),
    },
  ];

  if (isScoreIndicatifEnabled) {
    columns.push({
      title: 'Score lié à un indicateur',
      colProps: {
        style: { alignment: Utils.ALIGN_LEFT_WRAP },
        width: WIDTH_MEDIUM,
      },
      headCellProps: lastHeadCellProps,
      getValue: ({ scoreRow: row }) => {
        const scoreIndicatif = row[scoreKey]?.scoreIndicatif;
        if (scoreIndicatif) {
          return getLibelleScoreIndicatif(scoreIndicatif);
        }
      },
    });
  }

  return columns;
}

/** Génère la clé du champ score correspondant à un index du snapshot */
function getScoreKey(snapshotIndex: SnapshotIndex) {
  return `score${snapshotIndex}` as const;
}

/** Génère des fonctions utilitaires pour accéder aux propriétés d'une ligne de
 * score pour un index du snapshot */
function buildScoreRowUtils(
  snapshotIndex: SnapshotIndex,
  columnLetterByKey: ColumnLetterByKey
) {
  const scoreKey = getScoreKey(snapshotIndex);

  /** Extrait le scores de la ligne en fonction de l'index du snapshot */
  function getScoreByIndex(scoreRow: ScoreRow) {
    return scoreRow[scoreKey]?.score;
  }

  type ScoreType = 'Fait' | 'Programme' | 'PasFait';

  /** Génère la valeur/formule associée à une cellule score (en %) */
  function getScoreValueAndFormula(
    { scoreRow, rowIndex }: GetValueArgs,
    type: ScoreType
  ) {
    const score = getScoreByIndex(scoreRow);
    const point = score?.[`point${type}`];
    let value =
      point && score.pointPotentiel
        ? roundTo(point / score.pointPotentiel, 3)
        : undefined;

    // dans certains cas (sous-mesures 5.2.1 et 5.3.1 de ECi) la somme des scores
    // dépasse 100% (probablement à cause des arrondis et au
    // fait que les sous-mesures sont sur 6 points, divisés en 7 tâches)
    // on force donc ici la valeur exportée pour corriger cela
    value = value && value > 1 ? 1 : value;

    // le score en % "Faits/Programmé/Pas Fait” d'un axe/sous-axe/mesure est
    // calculé à partir des points "Faits/Programmé/Pas Fait” et du potentiel de
    // cet axe/sous-axe/mesures
    if (
      scoreRow.actionType === ActionTypeEnum.AXE ||
      scoreRow.actionType === ActionTypeEnum.SOUS_AXE ||
      scoreRow.actionType === ActionTypeEnum.ACTION
    ) {
      const colPotentiel = columnLetterByKey[`potentiel${snapshotIndex}`];
      const colPoint = columnLetterByKey[`point${type}${snapshotIndex}`];
      if (colPotentiel && colPoint) {
        return {
          result: value,
          formula: `IFERROR(${colPoint}${rowIndex}/${colPotentiel}${rowIndex},"")`,
        };
      }
      // pour les tâches avec un statut détaillé, on arrondi la valeur a 2 décimales
      // pour éviter d'afficher par exemple 74,9% au lieu de 75%
    } else if (
      scoreRow.actionType === ActionTypeEnum.TACHE &&
      score?.avancement === 'detaille' &&
      value !== undefined
    ) {
      return roundTo(value, 2);
    }
    return value;
  }

  /** Génère la valeur/formule associée à une cellule points */
  function getPointValueAndFormula(
    { data, scoreRow, scoreRowIndex, rowIndex }: GetValueArgs,
    type: ScoreType
  ) {
    const score = getScoreByIndex(scoreRow);
    if (!score) return null;

    // valeur en point (résultat initial pour la formule)
    const value = score[`point${type}`] ?? null;

    // les points "Faits/Programmé/Pas Fait" de l'axe/sous-axe/mesure sont la
    // somme des points "Faits/Programmé/Pas Fait" des
    // sous-axes/mesures/sous-mesures
    if (
      scoreRow.actionType === ActionTypeEnum.AXE ||
      scoreRow.actionType === ActionTypeEnum.SOUS_AXE ||
      scoreRow.actionType === ActionTypeEnum.ACTION
    ) {
      const childIds = scoreRow.score1.actionsEnfant.map(
        (child) => child.actionId
      );
      const colPoint = columnLetterByKey[`point${type}${snapshotIndex}`];
      const offsetRowIndex = rowIndex - scoreRowIndex;
      if (childIds.length && colPoint) {
        const childIndexes = childIds
          .map((childId) =>
            data.scoreRows.findIndex((r) => r.actionId === childId)
          )
          .filter((index) => index !== -1);
        if (childIndexes.length === childIds.length) {
          return {
            result: value,
            formula: `${childIndexes
              .map((index) => `${colPoint}${index + offsetRowIndex}`)
              .join('+')}`,
          };
        }
      }
    }
    // les points "Faits/Programmé/Pas Fait” de la sous-mesure sont calculés à
    // partir du potentiel et du score en % de la sous-mesure
    else if (scoreRow.actionType === ActionTypeEnum.SOUS_ACTION) {
      const colPotentiel = columnLetterByKey[`potentiel${snapshotIndex}`];
      const colScore = columnLetterByKey[`${type}${snapshotIndex}`];
      if (colPotentiel && colScore) {
        return {
          result: value,
          formula: `${colPotentiel}${rowIndex}*${colScore}${rowIndex}`,
        };
      }
    }
    return value;
  }

  return {
    getScoreByIndex,
    getScoreValueAndFormula,
    getPointValueAndFormula,
    scoreKey,
  };
}

/** Formate les noms de fichiers/url des documents preuves associés au ligne */
function formatPreuves(preuves?: PreuveEssential[]): string | undefined {
  return preuves
    ?.map((p) => p?.url || p?.filename || null)
    .filter((s): s is string => !!s)
    .join('\n');
}

/** Formate les nom/prénom des personnes */
function formatNoms(personnes: { nom: string }[]) {
  return personnes?.map((p) => p.nom).join(', ');
}

/** Formate l'état d'avancement associé à une ligne */
export function formatActionStatut(
  row: ScoreRow,
  data: ScoreComparisonData,
  snapshotIndex: SnapshotIndex
): string {
  const mode = data[`snapshot${snapshotIndex}`]?.scoresPayload.mode;

  if (mode === ComputeScoreMode.DEPUIS_SAUVEGARDE) {
    return 'Non disponible';
  }

  // les données ne sont pas disponibles
  const scoreKey = getScoreKey(snapshotIndex);
  const actionScore = row[scoreKey];
  if (!actionScore) {
    return '';
  }

  const { actionType, score } = actionScore;
  const { concerne, desactive, avancement } = score;

  // affiche un statut que pour les items qui ne sont pas des sous-actions ou des tâches
  if (
    actionType !== ActionTypeEnum.SOUS_ACTION &&
    actionType !== ActionTypeEnum.TACHE
  ) {
    return '';
  }

  // affiche "non concerné" pour les items ayant ce statut ou étant désactivé
  if (!concerne || desactive) {
    return 'Non concerné';
  }

  // uniquement pour les tâches sans statut
  if (actionType === ActionTypeEnum.TACHE && !avancement) {
    // récupère l'item parent et le score associé
    const actionId = row.actionId;
    const parentId = getParentIdFromActionId(actionId);
    const parentRow = data.scoreRows.find((r) => r.actionId === parentId);
    const parentActionScore = parentRow?.[scoreKey];

    // n'affiche pas "non renseigné" si la sous-action parente a soit un statut
    // autre que "non renseigné" ou "détaillé" soit est en "non concerné"
    if (
      (parentActionScore &&
        parentActionScore?.score?.avancement !== 'non_renseigne' &&
        parentActionScore?.score?.avancement !== 'detaille') ||
      !parentActionScore?.score?.concerne
    ) {
      return '';
    }
  }

  // n'affiche pas "non renseigné" pour une sous-action dont au moins une des tâches a un statut
  if (
    actionType === ActionTypeEnum.SOUS_ACTION &&
    (!avancement || avancement === 'non_renseigne' || avancement === 'detaille')
  ) {
    const hasChildrenAvancement = actionScore.actionsEnfant?.some(
      (actionScoreEnfant) =>
        actionScoreEnfant.score?.avancement &&
        actionScoreEnfant.score?.avancement !== 'non_renseigne'
    );
    if (hasChildrenAvancement) {
      return AVANCEMENT_TO_LABEL.detaille;
    }
  }

  // affiche "non renseigné" si le statut n'est pas renseigné ou non valide
  if (!avancement || !AVANCEMENT_TO_LABEL[avancement]) {
    return AVANCEMENT_TO_LABEL.non_renseigne;
  }

  // affiche le libellé correspondant au statut
  return AVANCEMENT_TO_LABEL[avancement];
}
