import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import ExcelJS, {
  CellFormulaValue,
  CellHyperlinkValue,
  CellRichTextValue,
  CellSharedFormulaValue,
  CellValue,
} from 'exceljs';
import { extractTextFromRichText } from '../utils/rich-text.utils';

/**
 * All column names that can appear in a parsed Excel row.
 */
type ColumnKeys =
  | 'Axe'
  | 'SousAxe'
  | 'SousSousAxe'
  | 'titre'
  | 'sousTitreAction'
  | 'description'
  | 'instanceGouvernance'
  | 'objectifs'
  | 'indicateurs'
  | 'structures'
  | 'resources'
  | 'partenaires'
  | 'services'
  | 'pilotes'
  | 'referents'
  | 'participation'
  | 'financements'
  | 'Financeur1'
  | 'Montant1'
  | 'Financeur2'
  | 'Montant2'
  | 'Financeur3'
  | 'Montant3'
  | 'budget'
  | 'status'
  | 'priorite'
  | 'dateDebut'
  | 'dateFin';

const OrderedColumns: Array<{ name: ColumnKeys; label: string }> = [
  { name: 'Axe', label: 'Axe (x)' },
  { name: 'SousAxe', label: 'Sous-axe (x.x)' },
  { name: 'SousSousAxe', label: 'Sous-sous axe (x.x.x)' },
  { name: 'titre', label: "Titre de l'action" },
  { name: 'sousTitreAction', label: 'Titre de la sous-action' },
  { name: 'description', label: 'Descriptif' },
  { name: 'instanceGouvernance', label: 'Instances de gouvernance' },
  { name: 'objectifs', label: 'Objectifs' },
  { name: 'indicateurs', label: 'Indicateurs liés' },
  { name: 'structures', label: 'Structure pilote' },
  { name: 'resources', label: 'Moyens humains et techniques' },
  { name: 'partenaires', label: 'Partenaires' },
  { name: 'services', label: 'Direction ou service pilote' },
  { name: 'pilotes', label: 'Personne pilote' },
  { name: 'referents', label: 'Élu·e référent·e' },
  { name: 'participation', label: 'Participation Citoyenne' },
  { name: 'financements', label: 'Financements' },
  { name: 'Financeur1', label: 'Financeur 1' },
  { name: 'Montant1', label: 'Montant € HT' },
  { name: 'Financeur2', label: 'Financeur 2' },
  { name: 'Montant2', label: 'Montant € HT' },
  { name: 'Financeur3', label: 'Financeur 3' },
  { name: 'Montant3', label: 'Montant € HT' },
  { name: 'budget', label: 'Budget prévisionnel total € HT' },
  { name: 'status', label: 'Statut' },
  { name: 'priorite', label: 'Niveau de priorité' },
  { name: 'dateDebut', label: 'Date de début' },
  { name: 'dateFin', label: 'Date de fin' },
];

type ColumnNames = (typeof OrderedColumns)[number]['name'];

const OrderedColumnLabels: string[] = OrderedColumns.map(
  (column) => column.label
);

export type ParsedRow = Record<ColumnNames, unknown>;

export type PlanDataParsedFromExcel = ParsedRow[];

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
  const axeColumnLabel = OrderedColumns[0].label;
  const AXE_TITLE_CELL = 'A2';

  return (
    workbook.worksheets.find(
      (worksheet) => worksheet.getCell(AXE_TITLE_CELL).value === axeColumnLabel
    ) ?? null
  );
}

function validateColumns(
  worksheet: ExcelJS.Worksheet
): Result<boolean, ValidationError> {
  const header = worksheet.getRow(2).values as (string | null)[];
  header.shift(); // Remove null first element

  const columnOrderValidationResults = OrderedColumnLabels.map(
    (column, columnIndex) => {
      const expectedColumn = OrderedColumnLabels[columnIndex];
      const actualColumn = String(header[columnIndex] ?? '').trim();
      if (expectedColumn === actualColumn) {
        return success(true);
      }
      const columnLetter = worksheet.getColumn(columnIndex + 1).letter;
      return failure({
        column: columnLetter,
        message: `La colonne ${columnLetter} devrait être "${expectedColumn}" et non "${actualColumn}"`,
      });
    }
  );

  const combinedResults = combineResults(columnOrderValidationResults);
  if (!combinedResults.success) {
    return combinedResults;
  }
  return success(true);
}

function extractValue(
  cell: CellValue
): string | boolean | number | Date | undefined | null {
  if (cell === null || cell === undefined) {
    return cell;
  }
  if (
    typeof cell === 'string' ||
    typeof cell === 'boolean' ||
    typeof cell === 'number' ||
    cell instanceof Date
  ) {
    return cell;
  }
  // RichText: flatten richText segments to a single string
  if (
    typeof cell === 'object' &&
    'richText' in cell &&
    Array.isArray((cell as CellRichTextValue).richText)
  ) {
    return extractTextFromRichText(cell) ?? '';
  }
  // Hyperlink: use display text
  if (typeof cell === 'object' && 'hyperlink' in cell && 'text' in cell) {
    return (cell as CellHyperlinkValue).text;
  }
  // Formula / shared formula: use result (skip error results)
  if (
    typeof cell === 'object' &&
    ('formula' in cell || 'sharedFormula' in cell)
  ) {
    const withResult = cell as CellFormulaValue | CellSharedFormulaValue;
    const result = withResult.result;
    if (result !== undefined && result !== null) {
      if (typeof result === 'object' && 'error' in result) {
        return undefined;
      }
      return result as string | number | boolean | Date;
    }
    return undefined;
  }
  // CellErrorValue
  if (typeof cell === 'object' && 'error' in cell) {
    return undefined;
  }
  return undefined;
}

function parseRow(rowData: CellValue[]): ParsedRow {
  return OrderedColumns.reduce((acc, columnProperties, index) => {
    acc[columnProperties.name] = extractValue(rowData[index]);
    return acc;
  }, {} as ParsedRow);
}

function parseWorksheet(worksheet: ExcelJS.Worksheet): PlanDataParsedFromExcel {
  const rows: ParsedRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < FIRST_DATA_ROW) return; // Skip header rows
    const [_ignoredFirstColumn, ...rowData] = row.values as CellValue[];
    rows.push(parseRow(rowData));
  });

  return rows;
}

/**
 * Parse an Excel file containing plan data
 */
export async function parsePlanExcel(
  file: string
): Promise<Result<PlanDataParsedFromExcel, ValidationError>> {
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

    const parsedData = parseWorksheet(worksheet);
    return success(parsedData);
  } catch {
    return failure({
      message: 'Une erreur est survenue lors de la lecture du fichier Excel',
    });
  }
}
