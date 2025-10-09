import ExcelJS from 'exceljs';
import { failure, Result, success } from '../types/result';

/** Column names ordered (order is important) */
export enum ColumnNames {
  Axe = 'Axe (x)',
  SousAxe = 'Sous-axe (x.x)',
  SousSousAxe = 'Sous-sous axe (x.x.x)',
  TitreFicheAction = 'Titre de la fiche action',
  Descriptif = 'Descriptif',
  InstancesGouvernance = 'Instances de gouvernance',
  Objectifs = 'Objectifs',
  IndicateursLies = 'Indicateurs liés',
  StructurePilote = 'Structure pilote',
  MoyensHumainsTechniques = 'Moyens humains et techniques',
  Partenaires = 'Partenaires',
  DirectionOuServicePilote = 'Direction ou service pilote',
  PersonnePilote = 'Personne pilote',
  EluReferent = 'Élu·e référent·e',
  ParticipationCitoyenne = 'Participation Citoyenne',
  Financements = 'Financements',
  Financeur1 = 'Financeur 1',
  Montant1 = 'Montant € HT',
  Financeur2 = 'Financeur 2',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  Montant2 = 'Montant € HT',
  Financeur3 = 'Financeur 3',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  Montant3 = 'Montant € HT',
  BudgetPrevisionnel = 'Budget prévisionnel total € HT',
  Statut = 'Statut',
  NiveauPriorite = 'Niveau de priorité',
  DateDebut = 'Date de début',
  DateFin = 'Date de fin',
  ActionAmeliorationContinue = 'Action en amélioration continue',
  Calendrier = 'Calendrier',
  ActionsLiees = 'Actions liées',
  FichesPlansLiees = 'Fiches des plans liées',
  NotesSuivi = 'Notes de suivi',
  EtapesFicheAction = 'Etapes de la fiche action',
  NotesComplementaires = 'Notes complémentaires',
  DocumentsLiens = 'Documents et liens',
}

/** Column names ordered in array */
const OrderedColumnNames: string[] = Object.values(ColumnNames);

export type ParsedRow = Record<
  ColumnNames,
  string | number | Date | boolean | null
>;

export interface ParsedPlanData {
  rows: ParsedRow[];
  columnIndexes: Record<ColumnNames, number>;
}

export interface ValidationError {
  row?: number;
  column?: string;
  message: string;
}

const FIRST_DATA_ROW = 4; // The first three rows are not data

/**
 * Find the worksheet containing plan data
 */
function findDataWorksheet(
  workbook: ExcelJS.Workbook
): ExcelJS.Worksheet | null {
  for (const worksheet of workbook.worksheets) {
    if (worksheet.getCell('A2').value === ColumnNames.Axe) {
      return worksheet;
    }
  }
  return null;
}

/**
 * Validate column headers match expected format
 */
function validateColumns(
  worksheet: ExcelJS.Worksheet
): Result<Record<ColumnNames, number>, ValidationError> {
  const header = worksheet.getRow(2).values as any[];
  header.shift(); // Remove null first element

  const columnIndexes: Partial<Record<ColumnNames, number>> = {};

  for (let columnId = 0; columnId < OrderedColumnNames.length; columnId++) {
    const expectedColumn = OrderedColumnNames[columnId];
    const actualColumn = String(header[columnId] ?? '').trim();

    if (expectedColumn.trim() !== actualColumn) {
      const columnLetter = worksheet.getColumn(columnId + 1).letter;
      return failure({
        column: columnLetter,
        message: `La colonne ${columnLetter} devrait être "${expectedColumn}" et non "${actualColumn}"`,
      });
    }

    columnIndexes[expectedColumn as ColumnNames] = columnId;
  }

  return success(columnIndexes as Record<ColumnNames, number>);
}

/**
 * Parse a single cell value
 */
function parseValue(value: any): string | number | Date | boolean | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object' && 'text' in value) {
    return String(value.text).trim();
  }

  if (typeof value === 'number') {
    return value;
  }

  return String(value).trim();
}

/**
 * Parse a single row of data
 */
function parseRow(
  rowData: any[],
  columnIndexes: Record<ColumnNames, number>
): ParsedRow {
  const row = {} as ParsedRow;

  for (const [columnName, index] of Object.entries(columnIndexes)) {
    const value = rowData[index];
    row[columnName as ColumnNames] = parseValue(value);
  }

  return row;
}

/**
 * Parse worksheet data into structured format
 */
function parseWorksheet(
  worksheet: ExcelJS.Worksheet,
  columnIndexes: Record<ColumnNames, number>
): ParsedPlanData {
  const rows: ParsedRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < FIRST_DATA_ROW) return; // Skip header rows

    const rowData = row.values as any[];
    rowData.shift(); // Remove null first element

    const parsedRow = parseRow(rowData, columnIndexes);
    rows.push(parsedRow);
  });

  return {
    rows,
    columnIndexes,
  };
}

/**
 * Parse an Excel file containing plan data
 */
export async function parsePlanExcel(
  file: string
): Promise<Result<ParsedPlanData, ValidationError>> {
  const fileBuffer = Buffer.from(file, 'base64');
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as unknown as ArrayBuffer);

    const worksheet = findDataWorksheet(workbook);
    if (!worksheet) {
      return failure({
        message:
          "L'onglet des données n'a pas été trouvé dans le fichier Excel",
      });
    }

    const headerValidation = validateColumns(worksheet);
    if (!headerValidation.success) {
      return headerValidation;
    }

    const parsedData = parseWorksheet(worksheet, headerValidation.data);
    return success(parsedData);
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    return failure({
      message: 'Une erreur est survenue lors de la lecture du fichier Excel',
    });
  }
}
