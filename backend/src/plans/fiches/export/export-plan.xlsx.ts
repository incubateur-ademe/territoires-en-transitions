/**
 * Export d'un plan d'action au format Excel
 */
import { FILL } from '@/backend/utils/excel/export-excel.utils';
import { isNotNil } from 'es-toolkit';
import { Workbook } from 'exceljs';
import {
  normalizeWorksheetName,
  NUM_FORMAT_EURO,
} from '../../../utils/excel/export-excel.utils';
import { Plan } from '../plan-actions.service';
import { SECTIONS } from './sections';

const HEADER_ROW = 1;
const SUB_HEADER_ROW = HEADER_ROW + 1;

// styles pour les en-têtes
const HEADER_FILL = FILL.primary;
const SUB_HEADER_FILL = FILL.grey;
const HEADER_FONT = { color: { argb: 'FFFFFF' } } as const;

export const exportPlanXLSX = async (plan: Plan) => {
  // crée le classeur et la feuille
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet(normalizeWorksheetName('Plan'));

  // ajoute les sections, colonnes et cellules dans la feuille
  let currentCol = 1;
  const sections = getSections(plan);
  sections.forEach(({ sectionLabel, cols }) => {
    const cell = worksheet.getCell(HEADER_ROW, currentCol);
    cell.value = sectionLabel;
    cell.style.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    worksheet.mergeCells(
      HEADER_ROW,
      currentCol,
      HEADER_ROW,
      currentCol + cols.length - 1
    );

    cols.forEach(({ colLabel, cellValues, format }, colIndex) => {
      const cell = worksheet.getCell(SUB_HEADER_ROW, currentCol + colIndex);
      cell.value = colLabel;
      cell.style.fill = SUB_HEADER_FILL;

      cellValues.forEach((value, i) => {
        const cell = worksheet.getCell(
          SUB_HEADER_ROW + 1 + i,
          currentCol + colIndex
        );
        cell.value = value;
        if (format === 'euro') {
          cell.numFmt = NUM_FORMAT_EURO;
        }
      });
    });

    currentCol += cols.length;
  });

  // applique les styles
  for (let colIndex = 1; colIndex <= currentCol; colIndex++) {
    const col = worksheet.getColumn(colIndex);
    col.width = 60;
    col.alignment = { wrapText: true };
  }

  return workbook.xlsx.writeBuffer();
};

// génère la liste des sections/colonnes/cellules à partir des données du plan
const getSections = (plan: Plan) =>
  SECTIONS.map(({ sectionLabel, cols }) => ({
    sectionLabel,
    cols: cols(plan)
      .map(({ colLabel, cellValue, format }) => ({
        colLabel,
        format,
        cellValues: plan.rows.map((row) => {
          const value = cellValue(row);
          return Array.isArray(value) ? value.join('\n') : value;
        }),
      }))
      // enlève les colonnes pour lesquelles toutes les valeurs sont vides
      .filter(
        ({ cellValues }) =>
          cellValues.filter((v) => isNotNil(v) && v !== '').length !== 0
      ),
  }))
    // enlève les sections qui n'ont pas de colonnes
    .filter(({ cols }) => cols.length);
