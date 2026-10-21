import { matchFieldLabel } from './match-column-label';
import {
  collapseSpaces,
  filledCells,
  getCellValueAt,
  isBlankGridRow,
  SheetGrid,
} from './sheet-grid';
import {
  FormField,
  MIN_TITLE_LENGTH,
  SheetLayout,
  summarizeChecks,
} from './sheet-layout';

const FORM_MAX_COLUMNS = 4;
export const FORM_MIN_ROLES = 3;
const FORM_LABEL_MAX_LENGTH = 60;

/**
 * Un onglet par fiche, en paires libellé / valeur : les libellés dans une
 * même colonne, la plupart reconnus par le synonymier, dont le titre.
 */
export const inferFormLayout = (grid: SheetGrid): SheetLayout | null => {
  const rows = grid.cells.flatMap((cells, index) =>
    isBlankGridRow(cells) ? [] : [index + 1]
  );
  const usedCols = new Set(
    rows.flatMap((row) =>
      filledCells(grid.cells[row - 1]).map(({ col }) => col)
    )
  );
  if (rows.length === 0 || usedCols.size > FORM_MAX_COLUMNS) {
    return null;
  }
  const { fields, titleTexts } = readFormFields(grid, rows);
  const recognizedRoles = countRecognizedRoles(fields);
  if (
    recognizedRoles < FORM_MIN_ROLES ||
    fields.filter(({ role }) => role !== 'autre').length < fields.length / 2
  ) {
    return null;
  }
  const settled = settleFormFields(fields);
  const titreField = settled.find(({ role }) => role === 'titre');
  const numero =
    settled.find(({ role }) => role === 'numero')?.values[0] ?? null;
  // Sans champ titre, seul un n° fait du titre de l'onglet celui d'une fiche :
  // une page de présentation a des pilotes et un budget, pas de fiche.
  const titre = collapseSpaces(
    titreField?.values.join(' ') ?? (numero ? titleTexts.at(-1) ?? '' : '')
  );
  const path = settled
    .filter(({ role, values }) => role === 'hierarchie' && values.length > 0)
    .map(({ values }) => collapseSpaces(values.join(' ')));
  return {
    sheet: grid.name,
    shape: 'formulaire',
    header: null,
    titleTexts,
    columns: [],
    fiches: titre
      ? [
          {
            rows,
            path,
            titre,
            numero: numero ? collapseSpaces(numero) : null,
          },
        ]
      : [],
    sousActionCol: null,
    form: settled,
    valueAt: (row, col) => getCellValueAt(grid, row, col),
    uncoveredRows: 0,
    ...summarizeChecks([
      [
        titre.length >= MIN_TITLE_LENGTH,
        titre
          ? `titre « ${titre} »`
          : titreField
          ? 'champ titre vide'
          : 'aucun champ titre ni n°',
      ],
      [recognizedRoles >= FORM_MIN_ROLES, `${recognizedRoles} champs reconnus`],
    ]),
    warnings: [],
  };
};

/**
 * Les paires libellé / valeur de ces rangées, libellés dans la première
 * colonne utilisée : une rangée sans libellé prolonge le champ du dessus, et
 * les libellés seuls d'avant le premier champ sont des titres.
 */
export const readFormFields = (
  grid: SheetGrid,
  rows: number[]
): { fields: FormField[]; titleTexts: string[] } => {
  const cellsOf = (row: number) => filledCells(grid.cells[row - 1] ?? []);
  const labelCol = Math.min(
    ...rows.flatMap((row) => cellsOf(row).map(({ col }) => col))
  );
  const fields: FormField[] = [];
  const titleTexts: string[] = [];
  for (const row of rows) {
    const own = cellsOf(row);
    const labelCell = own.find(({ col }) => col === labelCol);
    const values = own
      .filter((cell) => cell !== labelCell)
      .map(({ text }) => text);
    if (!labelCell) {
      fields.at(-1)?.values.push(...values);
    } else if (
      values.length > 0 &&
      labelCell.text.length <= FORM_LABEL_MAX_LENGTH
    ) {
      fields.push(toField(labelCell.text, values));
    } else if (fields.length === 0) {
      titleTexts.push(collapseSpaces(labelCell.text));
    } else {
      // Un libellé sans valeur annonce les rangées suivantes (« Étapes : »).
      fields.push(toField(labelCell.text, []));
    }
  }
  return { fields, titleTexts };
};

const toField = (label: string, values: string[]): FormField => ({
  label: collapseSpaces(label.replace(/\s*[:：]\s*$/, '')),
  role: matchFieldLabel(label) ?? 'autre',
  values,
});

export const countRecognizedRoles = (fields: FormField[]): number =>
  new Set(fields.map(({ role }) => role).filter((role) => role !== 'autre'))
    .size;

/**
 * « Intitulé de l'action » est le titre ; un autre champ « Actions… » à
 * plusieurs valeurs en donne les sous-actions.
 */
const settleFormFields = (fields: FormField[]): FormField[] => {
  const titres = fields.filter(({ role }) => role === 'titre');
  const main =
    titres.find(({ label }) => /intitul|titre|nom|fiche/i.test(label)) ??
    titres[0];
  return fields.map((field) =>
    field.role === 'titre' && field !== main
      ? {
          ...field,
          role: field.values.length > 1 ? 'sousAction' : 'description',
        }
      : field
  );
};
