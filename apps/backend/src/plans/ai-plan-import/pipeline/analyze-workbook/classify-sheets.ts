import { maxBy } from 'es-toolkit';
import { titlesMatch } from '../extract-actions/similar-titles';
import { inferSheetLayout } from './infer-sheet-layout';
import { ColumnRole } from './match-column-label';
import {
  getCellValue,
  isBlankGridRow,
  isInVerticalMerge,
  SheetGrid,
} from './sheet-grid';
import { FicheBlock, SheetLayout } from './sheet-layout';

export type SheetRole =
  | 'plan'
  | 'complement'
  | 'synthese'
  | 'liste'
  | 'masque'
  | 'modele';

export type SheetClassification = {
  /** Position de l'onglet dans le classeur, et de sa page dans le document. */
  index: number;
  name: string;
  role: SheetRole;
  reason: string;
  layout: SheetLayout | null;
  /** Un complément : l'onglet plan dont il complète les fiches. */
  complementOf?: string;
  /** Pour chaque fiche d'un complément, l'index de la fiche du plan. */
  matches?: (number | null)[];
};

const COMPLEMENT_MIN_SHARE = 0.6;
const COMPUTED_MIN_FORMULA_SHARE = 0.5;
const COMPUTED_MIN_NUMERIC_SHARE = 0.8;
const LIST_MAX_COLUMNS = 8;
const LIST_MAX_ROWS = 100;
const LIST_MAX_LENGTH = 60;
const LIST_MIN_FOUND = 0.6;
const SYNTHESE_MIN_FORMULA_SHARE = 0.2;
const SYNTHESE_MIN_NUMERIC_SHARE = 0.5;

// Des colonnes qu'une fiche porte en nombres : un plan riche en budgets
// annuels n'est pas un tableau de bord pour autant.
const NUMERIC_FICHE_ROLES: ReadonlySet<ColumnRole> = new Set([
  'titre',
  'numero',
  'budget',
  'budgetConsomme',
  'financements',
  'cible',
]);

/**
 * Le rôle de chaque onglet :
 * - `masque` : un onglet caché, ignoré ;
 * - `liste` : une colonne courte de valeurs reprises ailleurs (les statuts) ;
 * - `plan` : des fiches reconnues avec confiance ;
 * - `complement` : des fiches déjà dans un plan, par n° et titre (indicateurs
 *   d'un thème) : il complète ces fiches, n'en crée jamais ;
 * - `synthese` : surtout des formules ou des nombres ;
 * - `modele` : rien de sûr, l'onglet part au modèle.
 *
 * Un classeur où rien n'est plan ni lisible par le modèle confie ses
 * synthèses au modèle : mieux vaut sa lecture que pas d'import du tout.
 */
export const classifySheets = (grids: SheetGrid[]): SheetClassification[] => {
  const lists = new Map(
    grids.flatMap((grid, index) => {
      const values =
        grid.state === 'visible' ? readListValues(grid, grids) : null;
      // Deux fiches-formulaires partagent leurs libellés de champ : ce ne sont
      // pas des listes.
      return values && !isFormSheet(grid) ? [[index, values] as const] : [];
    })
  );
  const listValues = new Set(
    [...lists.values()].flatMap((values) => values.map(normalizeValue))
  );
  const layouts = grids.map((grid, index) =>
    grid.state !== 'visible' || lists.has(index)
      ? null
      : inferSheetLayout(grid, listValues.size > 0 ? { listValues } : {})
  );

  const plans: { name: string; fiches: FicheBlock[] }[] = [];
  const classified = new Map<number, SheetClassification>();
  const byFicheCount = layouts
    .map((layout, index) => ({ layout, index }))
    .filter(
      (entry): entry is { layout: SheetLayout; index: number } =>
        entry.layout !== null &&
        entry.layout.fiches.length > 0 &&
        !isComputedTable(grids[entry.index], entry.layout)
    )
    .sort(
      (a, b) =>
        Number(b.layout.confident) - Number(a.layout.confident) ||
        b.layout.fiches.length - a.layout.fiches.length
    );
  for (const { layout, index } of byFicheCount) {
    const complement = findComplementTarget(layout, plans);
    if (complement) {
      classified.set(index, {
        index,
        name: grids[index].name,
        role: 'complement',
        reason: `${complement.found}/${layout.fiches.length} fiches retrouvées dans « ${complement.plan} »`,
        layout,
        complementOf: complement.plan,
        matches: complement.matches,
      });
    } else if (layout.confident) {
      plans.push({ name: layout.sheet, fiches: layout.fiches });
      classified.set(index, {
        index,
        name: grids[index].name,
        role: 'plan',
        reason: `${layout.fiches.length} fiches, forme ${layout.shape}`,
        layout,
      });
    }
  }

  const sheets = grids.map((grid, index): SheetClassification => {
    const known = classified.get(index);
    if (known) {
      return known;
    }
    const base = { index, name: grid.name, layout: layouts[index] };
    if (grid.state !== 'visible') {
      return { ...base, role: 'masque', reason: 'onglet masqué' };
    }
    const list = lists.get(index);
    if (list) {
      return {
        ...base,
        role: 'liste',
        reason: `liste de ${list.length} valeurs reprises dans un autre onglet`,
      };
    }
    const synthese = describeSynthese(grid);
    if (synthese) {
      return { ...base, role: 'synthese', reason: synthese };
    }
    return {
      ...base,
      role: 'modele',
      reason:
        layouts[index]?.reasons
          .filter((reason) => reason.startsWith('✗'))
          .join(' ; ') || 'structure non reconnue',
    };
  });
  const isRead = sheets.some(
    ({ role }) => role === 'plan' || role === 'modele'
  );
  return isRead
    ? sheets
    : sheets.map(
        (sheet): SheetClassification =>
          sheet.role === 'synthese'
            ? {
                ...sheet,
                role: 'modele',
                reason: `aucun onglet plan, confié au modèle malgré ${sheet.reason}`,
              }
            : sheet
      );
};

/**
 * Le plan dont l'onglet reprend au moins 60 % des fiches : même titre, et
 * même n° quand les deux en ont. Le n° seul ne suffit pas, puisqu'un onglet
 * par axe recommence sa numérotation.
 */
const findComplementTarget = (
  layout: SheetLayout,
  plans: { name: string; fiches: FicheBlock[] }[]
): { plan: string; found: number; matches: (number | null)[] } | null => {
  for (const plan of plans) {
    const matches = layout.fiches.map((fiche) => {
      const index = plan.fiches.findIndex(
        (candidate) =>
          titlesMatch(candidate.titre, fiche.titre) &&
          (candidate.numero === null ||
            fiche.numero === null ||
            sameNumero(candidate.numero, fiche.numero))
      );
      return index === -1 ? null : index;
    });
    const found = matches.filter((match) => match !== null).length;
    if (found >= 2 && found / layout.fiches.length >= COMPLEMENT_MIN_SHARE) {
      return {
        plan: plan.name,
        found,
        matches: matchRemainingByNumero(layout.fiches, plan.fiches, matches),
      };
    }
  }
  return null;
};

/**
 * Une fois l'onglet reconnu comme complément, le n° suffit pour une fiche
 * dont il reformule le titre : il est unique dans le plan.
 */
const matchRemainingByNumero = (
  fiches: FicheBlock[],
  planFiches: FicheBlock[],
  matches: (number | null)[]
): (number | null)[] =>
  matches.map((match, index) => {
    const numero = fiches[index].numero;
    if (match !== null || numero === null) {
      return match;
    }
    const candidates = planFiches.flatMap((candidate, candidateIndex) =>
      candidate.numero !== null && sameNumero(candidate.numero, numero)
        ? [candidateIndex]
        : []
    );
    return candidates.length === 1 ? candidates[0] : null;
  });

const isFormSheet = (grid: SheetGrid): boolean => {
  const layout = inferSheetLayout(grid);
  return layout.form !== null && layout.confident;
};

/**
 * Des rangées dont les valeurs sont calculées ou chiffrées : un tableau de
 * bord, dont les libellés (« Nombre d'actions en cours ») ne sont pas des
 * fiches.
 */
const isComputedTable = (grid: SheetGrid, layout: SheetLayout): boolean => {
  const ficheCols = new Set(
    layout.columns
      .filter(({ role }) => NUMERIC_FICHE_ROLES.has(role))
      .map(({ col }) => col)
  );
  const cells = layout.fiches
    .flatMap(({ rows }) => rows)
    .flatMap((row) => grid.cells[row - 1] ?? [])
    .filter(
      (cell) =>
        !ficheCols.has(cell.col) &&
        (cell.text !== '' || cell.formula !== undefined)
    );
  if (cells.length === 0) {
    return false;
  }
  const formulas = cells.filter((cell) => cell.formula !== undefined).length;
  const numbers = cells.filter(
    (cell) => cell.formula === undefined && cell.kind === 'number'
  ).length;
  return (
    formulas / cells.length >= COMPUTED_MIN_FORMULA_SHARE ||
    (formulas + numbers) / cells.length >= COMPUTED_MIN_NUMERIC_SHARE
  );
};

const sameNumero = (a: string, b: string): boolean =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

const normalizeValue = (value: string): string => value.trim().toLowerCase();

/**
 * Les valeurs d'un onglet de listes : des colonnes courtes et indépendantes,
 * sans formule ni valeur répétée, dont une au moins se retrouve dans un
 * autre onglet (les statuts proposés par une liste déroulante).
 */
const readListValues = (
  grid: SheetGrid,
  grids: SheetGrid[]
): string[] | null => {
  const cells = grid.cells.flat().filter((cell) => cell.text !== '');
  const usedCols = [...new Set(cells.map(({ col }) => col))];
  const rows = grid.cells.filter((row) => !isBlankGridRow(row)).length;
  if (
    cells.length < 2 ||
    usedCols.length > LIST_MAX_COLUMNS ||
    rows > LIST_MAX_ROWS ||
    cells.some(
      (cell) =>
        cell.formula !== undefined ||
        cell.text.length > LIST_MAX_LENGTH ||
        isInVerticalMerge(cell)
    )
  ) {
    return null;
  }
  const columns = usedCols.map((col) =>
    cells.filter((cell) => cell.col === col).map(({ text }) => text)
  );
  if (
    columns.some(
      (values) => new Set(values.map(normalizeValue)).size < values.length
    )
  ) {
    return null;
  }
  const otherColumns = grids
    .filter((other) => other !== grid)
    .flatMap(readColumnValues);
  const found = columns.flatMap((values) => {
    const normalized = values.map(normalizeValue);
    // La colonne qui reprend le plus de ces valeurs, et plus souvent que la
    // liste ne les énumère : c'est elle qui s'en sert. Un petit plan dont
    // une colonne reprend une liste n'est pas une liste.
    const user = maxBy(
      otherColumns,
      (column) => normalized.filter((value) => column.values.has(value)).length
    );
    if (!user) {
      return [];
    }
    const kept = values.filter((_, index) =>
      user.values.has(normalized[index])
    );
    // La première valeur d'une colonne est souvent son titre (« Statut »).
    const titled = !user.values.has(normalized[0]);
    const items = titled ? values.length - 1 : values.length;
    return items >= 2 &&
      kept.length / items >= LIST_MIN_FOUND &&
      user.filled > items
      ? kept
      : [];
  });
  return found.length > 0 ? found : null;
};

const readColumnValues = (
  grid: SheetGrid
): { values: Set<string>; filled: number }[] => {
  const byCol = new Map<number, { values: Set<string>; filled: number }>();
  for (const cell of grid.cells.flat()) {
    const text = normalizeValue(getCellValue(grid, cell));
    if (text === '') {
      continue;
    }
    const column = byCol.get(cell.col) ?? { values: new Set(), filled: 0 };
    column.values.add(text);
    column.filled += 1;
    byCol.set(cell.col, column);
  }
  return [...byCol.values()];
};

/** Un tableau de bord : surtout des formules qui renvoient ailleurs, ou des nombres. */
const describeSynthese = (grid: SheetGrid): string | null => {
  const cells = grid.cells
    .flat()
    .filter((cell) => cell.text !== '' || cell.formula);
  if (cells.length === 0) {
    return null;
  }
  const crossSheet = cells.filter((cell) => (cell.refsSheets?.length ?? 0) > 0);
  const formulas = cells.filter((cell) => cell.formula !== undefined);
  const numbers = cells.filter((cell) => cell.kind === 'number');
  if (
    crossSheet.length > 0 &&
    formulas.length / cells.length >= SYNTHESE_MIN_FORMULA_SHARE
  ) {
    return `${formulas.length} formules sur ${cells.length} cellules, dont ${crossSheet.length} renvoient à d'autres onglets`;
  }
  if (numbers.length / cells.length >= SYNTHESE_MIN_NUMERIC_SHARE) {
    return `${numbers.length} nombres sur ${cells.length} cellules`;
  }
  return null;
};
