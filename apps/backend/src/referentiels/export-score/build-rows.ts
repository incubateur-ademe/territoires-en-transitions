import { ActionTypeEnum } from '@/backend/referentiels/models/action-type.enum';
import { ReferentielId } from '@/backend/referentiels/models/referentiel-id.enum';
import { getLevelFromActionId } from '@/backend/referentiels/referentiels.utils';
import { toMerged } from 'es-toolkit';
import { Row, Worksheet } from 'exceljs';
import * as Utils from '../../utils/excel/export-excel.utils';
import { buildColumns, Column, getColumnIndex } from './build-columns';
import {
  Auditeur,
  ExportMode,
  ScoreComparisonData,
} from './load-score-comparison.service';

// ajoute le tableau des scores à la feuille de calcul
export function buildRows(data: ScoreComparisonData, worksheet: Worksheet) {
  const {
    auditeurs,
    collectiviteName,
    exportMode,
    referentielId,
    scoreRows,
    isScoreIndicatifEnabled,
  } = data;

  // génère la configuration des colonnes
  const columns = buildColumns(exportMode, isScoreIndicatifEnabled);

  // ajoute les lignes d'en-tête du tableau des scores
  let currentRow = addHeaderRows(worksheet, collectiviteName, auditeurs, 1);

  // ajoute l'en-tête du/des groupe(s) de colonnes points/scores
  currentRow = addScoreGroupHeaderRow(data, worksheet, columns, currentRow);

  // ajoute les attributs les colonnes
  columns.forEach(({ colProps, headCellProps, title }, colIndex) => {
    // fixe le styles par défaut et la largeur des colonnes
    const column = worksheet.getColumn(colIndex + 1);
    if (colProps?.style) {
      column.style = colProps.style;
    }
    if (colProps?.width !== undefined) {
      column.width = colProps.width;
    }

    // ajoute les intitulés de colonnes
    const headCell = worksheet.getCell(currentRow, colIndex + 1);
    headCell.value = title;
    if (headCellProps?.style) {
      headCell.style = toMerged(headCell.style, headCellProps.style);
    }
  });

  // pour chaque ligne de scores/mesure du référentiel...
  scoreRows.forEach((scoreRow) => {
    currentRow++;

    // fixe les styles pour la ligne
    if (scoreRow.score1.actionType === ActionTypeEnum.REFERENTIEL) {
      // fixe le style de la ligne "Total" en haut du tableau
      Utils.setCellsStyle(worksheet, currentRow, 1, columns.length, {
        font: Utils.BOLD,
      });
    } else {
      // ou celui des autres lignes
      const row = worksheet.getRow(currentRow);
      setRowStyles(
        row,
        scoreRow.actionId,
        scoreRow.score1.identifiant,
        referentielId
      );
    }

    // rempli chaque cellule avec sa valeur et le formatage/style approprié
    columns.forEach(({ cellProps, getValue }, colIndex) => {
      const cell = worksheet.getCell(currentRow, colIndex + 1);
      cell.value = getValue(scoreRow, data, currentRow);
      if (cellProps?.format === 'percent') {
        Utils.setCellNumFormat(cell, Utils.FORMAT_PERCENT);
      } else if (cellProps?.format === 'number') {
        Utils.setCellNumFormat(cell);
      }
      if (cellProps?.style) {
        cell.style = toMerged(cell.style, cellProps.style);
      }
    });
  });
}

// ajoute les lignes d'en-tête du tableau des scores
function addHeaderRows(
  worksheet: Worksheet,
  collectiviteName: string | null,
  auditeurs: Auditeur[] | null,
  rowNumber: number
) {
  let currentRow = rowNumber;

  // nom de la collectivité
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  const cellA1 = worksheet.getCell(`A${currentRow}`);
  cellA1.value = collectiviteName;
  cellA1.fill = Utils.FILL.grey;
  currentRow++;

  // auditeurs
  if (auditeurs?.length) {
    worksheet.getCell(`A${currentRow}`).value = 'Audit';
    const cellB2 = worksheet.getCell(`B${currentRow}`);
    cellB2.value = auditeurs
      .map(({ prenom, nom }) => `${prenom} ${nom}`)
      .join(' / ');
    cellB2.fill = Utils.FILL.yellow;
  }
  currentRow++;

  // date d'export
  worksheet.getCell(`A${currentRow}`).value = "Date d'export";
  const cellB3 = worksheet.getCell(`B${currentRow}`);
  cellB3.value = new Date();
  cellB3.fill = Utils.FILL.yellow;
  cellB3.alignment = { horizontal: 'left' };
  cellB3.numFmt = 'dd/mm/yyyy';

  return currentRow + 3;
}

// ajoute l'en-tête du/des groupe(s) de colonnes points/scores
function addScoreGroupHeaderRow(
  data: ScoreComparisonData,
  worksheet: Worksheet,
  columns: Column[],
  currentRow: number
) {
  const { exportMode, snapshot1Label, snapshot2Label } = data;
  const row = worksheet.getRow(currentRow);

  // index de la colonne du 1er groupe de colonnes de points/scores
  const beginIndex1 = getColumnIndex(columns, 'potentiel1') + 1;
  // index de la colonne après la ou les sections
  const afterIndex = getColumnIndex(columns, 'pilotes');

  // libellé/style de l'en-tête du 1er groupe
  const headCell1 = row.getCell(beginIndex1);
  headCell1.value = snapshot1Label;
  headCell1.style = Utils.HEADING1;

  if (exportMode === ExportMode.SINGLE_SNAPSHOT) {
    // fusionne les cellules de l'en-tête du 1er groupe
    worksheet.mergeCells(currentRow, beginIndex1, currentRow, afterIndex);
  } else {
    // index de la 1ère colonne du 2ème groupe
    const beginIndex2 = getColumnIndex(columns, 'potentiel2') + 1;

    // libellé/style de l'en-tête du 2ème groupe
    const headCell2 = row.getCell(beginIndex2);
    headCell2.value = snapshot2Label;
    headCell2.style = Utils.HEADING1;

    // fusionne les cellules de l'en-tête du 1er groupe
    worksheet.mergeCells(currentRow, beginIndex1, currentRow, beginIndex2 - 1);
    // fusionne les cellules de l'en-tête du 2ème groupe
    worksheet.mergeCells(currentRow, beginIndex2, currentRow, afterIndex);
  }

  return currentRow + 1;
}

// fixe les styles d'une ligne du tableau de scores
function setRowStyles(
  row: Row,
  actionId: string,
  identifiant: string,
  referentielId: ReferentielId
) {
  // niveau de profondeur (case plier/déplier)
  const depth = getLevelFromActionId(actionId);
  if (depth > 1) {
    row.outlineLevel = depth;
  }

  // couleur de fond
  const color = getRowColor({ depth, identifiant }, referentielId);

  if (color) {
    row.fill = Utils.makeSolidFill(color);
  }
}

// couleurs de fond des lignes par axe et sous-axe
const BG_COLORS: Record<number, string[]> = {
  1: ['f7caac', 'fbe4d5'],
  2: ['9bc1e5', 'bdd7ee'],
  3: ['70ae47', 'a9d08e'],
  4: ['fdd966', 'fee699'],
  5: ['8ea9db', 'b5c6e7'],
  6: ['9f5fce', 'bc8fdd'],
};

// couleur de fond des sous-sous-axes
const BG_COLOR3 = 'bfbfbf'; // niveau 3
const BG_COLOR4 = 'd8d8d8'; // niveau 4 (CAE seulement)

// détermine la couleur de fond d'une ligne en fonction de son niveau dans l'arbre
export function getRowColor(
  action: { depth: number; identifiant: string },
  referentiel: ReferentielId
) {
  if (!action) {
    return;
  }

  const { depth, identifiant } = action;
  if (depth === 3) return BG_COLOR3;
  if (depth === 4 && referentiel === 'cae') return BG_COLOR4;

  const axe = parseInt(identifiant.split('.')[0]);
  const colors = BG_COLORS[axe];
  if (colors && depth <= colors.length) return colors[depth - 1];
}
