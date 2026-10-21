import { Priorite, PrioriteEnum, Statut } from '@tet/domain/plans';
import { uniq } from 'es-toolkit';
import { MAX_FICHE_TITLE_LENGTH } from '../../adapters/extracted-action-to-import-action';
import { stripTitleNumber } from '../../adapters/normalize-plan-labels';
import { DisableableField } from '../../models/disableable-field';
import {
  createEmptyExtractedAction,
  ExtractedAction,
  ExtractedSousAction,
  withAxisPath,
} from '../../models/extracted-action';
import { findAggregateFormulas } from './classify-grid-rows';
import { aggregateFicheStatut, mapStatutCell } from './map-tabular-statut';
import { ColumnRole } from './match-column-label';
import {
  parseAmount,
  parseDateValue,
  readCellValues,
  readDistinctValues,
  yearsIn,
} from './profile-columns';
import { collapseSpaces, SheetGrid, sheetLabel } from './sheet-grid';
import {
  ColumnLayout,
  columnsOf,
  FicheBlock,
  FormField,
  SheetLayout,
  sousActionRowsOf,
} from './sheet-layout';

export type TabularPlanSheet = {
  grid: SheetGrid;
  layout: SheetLayout;
  /** Niveau d'axe ajouté en tête : l'onglet, quand chaque onglet est un axe. */
  axisPrefix: string[];
};

export type BuiltFiche = { action: ExtractedAction; fiche: FicheBlock };

export type BuiltTabularActions = {
  fiches: BuiltFiche[];
  warnings: string[];
  /** Le contrôle du budget contre la formule de total, s'il y en a une. */
  budgetCheck: { total: number; expected: number; cell: string } | null;
};

/** Lignes à ajouter aux objectifs d'une fiche : indicateurs d'un onglet complément. */
export type ComplementLines = Map<FicheBlock, string[]>;

/** Ce que la lecture n'a pas su ranger, pour les avertissements. */
type Unread = {
  statuts: Set<string>;
  /** « Échéance « Fin 2026 » » : une date ou un montant gardé en description. */
  values: Set<string>;
};

const PILOTE_UNDEFINED =
  /^(?:[àa] d[ée]finir|nc|n\/a|-|\?|aucun|non d[ée]fini)$/i;
const BUDGET_TOLERANCE = 0.5;
const MAX_LISTED_VALUES = 10;

const MONTHS = [
  'janvier',
  'fevrier',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'aout',
  'septembre',
  'octobre',
  'novembre',
  'decembre',
];

/**
 * Les actions d'un onglet plan, construites sans le modèle : chemin d'axes,
 * titre, sous-actions (statut, années du calendrier), pilotes, budget,
 * financements, commentaires et colonnes non reconnues en description,
 * indicateurs des compléments en objectifs. Les champs que l'utilisateur a
 * désactivés restent vides.
 */
export const buildTabularActions = (
  sheet: TabularPlanSheet,
  {
    complements = new Map(),
    disabledFields = [],
  }: { complements?: ComplementLines; disabledFields?: DisableableField[] } = {}
): BuiltTabularActions => {
  const unread: Unread = { statuts: new Set(), values: new Set() };
  const built = sheet.layout.form
    ? buildFormFiche(sheet, sheet.layout.form, unread)
    : sheet.layout.fiches.map((fiche) => buildTableFiche(sheet, fiche, unread));
  const fiches = built.map(({ action, fiche }) => ({
    fiche,
    action: clearDisabledFields(
      appendObjectifs(action, complements.get(fiche) ?? []),
      disabledFields
    ),
  }));
  const warnings: string[] = [];
  const name = sheet.grid.name;
  if (unread.statuts.size > 0) {
    warnings.push(
      `${sheetLabel(name)} : avancements non reconnus, laissés sans statut : ${[
        ...unread.statuts,
      ]
        .map((value) => `« ${value} »`)
        .join(', ')}.`
    );
  }
  if (unread.values.size > 0) {
    const values = [...unread.values];
    warnings.push(
      `${sheetLabel(
        name
      )} : dates ou montants lus d'après l'année ou pas du tout, gardés tels quels en description : ${values
        .slice(0, MAX_LISTED_VALUES)
        .join(', ')}${values.length > MAX_LISTED_VALUES ? '…' : ''}.`
    );
  }
  for (const column of columnsOf(sheet.layout, 'budgetConsomme')) {
    warnings.push(
      `${sheetLabel(name)}, colonne ${column.letter} « ${
        column.label
      } » : le budget consommé n'est pas importé.`
    );
  }
  const budgetCheck = checkBudget(sheet, fiches);
  if (
    budgetCheck &&
    Math.abs(budgetCheck.total - budgetCheck.expected) > BUDGET_TOLERANCE
  ) {
    warnings.push(
      `${sheetLabel(name)} : la somme des budgets des fiches (${formatAmount(
        budgetCheck.total
      )}) diffère du total ${budgetCheck.cell} (${formatAmount(
        budgetCheck.expected
      )}).`
    );
  }
  return { fiches, warnings, budgetCheck };
};

const buildTableFiche = (
  { grid, layout, axisPrefix }: TabularPlanSheet,
  fiche: FicheBlock,
  unread: Unread
): BuiltFiche => {
  const sousActionRows = new Set(sousActionRowsOf(layout, fiche));
  const ficheRows = fiche.rows.filter((row) => !sousActionRows.has(row));
  // Une valeur de fiche se lit sur toutes ses rangées ; une valeur de rangée,
  // sur les rangées sans sous-action (celles de la fiche elle-même).
  const rowsFor = (column: ColumnLayout) =>
    column.level === 'row' ? ficheRows : fiche.rows;
  const valuesOf = (role: ColumnRole, rows?: number[]) =>
    columnsOf(layout, role).flatMap((column) =>
      readDistinctValues(
        grid,
        layout.valueAt,
        column.col,
        rows ?? rowsFor(column)
      )
    );
  const mapStatut = statutMapper(unread);

  const sousActions = [...sousActionRows].map((row) =>
    buildSousAction(layout, row, mapStatut, unread)
  );
  const ownStatut = valuesOf('statut').map(mapStatut);
  const ownDates = readRowDates(layout, ficheRows, fiche.rows, unread);
  const allRows = fiche.rows;
  const budget = sumBudget(grid, layout, allRows, unread);

  const action = createEmptyExtractedAction({
    titre: numberedTitle(fiche.numero, fiche.titre),
    description: joinParagraphs([
      ...valuesOf('description'),
      labelled('Commentaires', valuesOf('commentaire', allRows)),
      ...describeOtherColumns(grid, layout, fiche.rows),
      ...ownDates.notes,
      ...budget.notes,
      ...describePriorite(valuesOf('priorite')),
    ]),
    objectifs: joinLines([
      ...valuesOf('objectifs'),
      ...indicatorLines(layout, allRows),
    ]),
    structurePilote: joinPilotes(valuesOf('structurePilote', allRows)),
    directionServicePilote: joinPilotes(valuesOf('servicePilote', allRows)),
    personnePilote: joinPilotes(valuesOf('personnePilote')),
    partenaires: joinPilotes(valuesOf('partenaires', allRows)),
    budget: budget.total,
    financements: joinLines(
      columnsOf(layout, 'financements').flatMap((column) => {
        const values = readDistinctValues(
          grid,
          layout.valueAt,
          column.col,
          allRows
        );
        return column.isSecondaryAmount
          ? values.map((value) => `${column.label} : ${value}`)
          : values;
      })
    ),
    moyensHumains: joinLines(valuesOf('moyensHumains', allRows)),
    priorite: mapPriorite(valuesOf('priorite')[0] ?? ''),
    statut:
      aggregateFicheStatut(ownStatut) ??
      aggregateFicheStatut(sousActions.map(({ statut }) => statut)),
    dateDebut:
      ownDates.dateDebut ??
      minDate(sousActions.map(({ dateDebut }) => dateDebut)),
    dateFin:
      ownDates.dateFin ?? maxDate(sousActions.map(({ dateFin }) => dateFin)),
    sousActions,
    sourceTableur: buildSourceTableur(grid, fiche),
  });
  return {
    fiche,
    action: withAxisPath(action, [...axisPrefix, ...fiche.path]),
  };
};

const buildSousAction = (
  layout: SheetLayout,
  row: number,
  mapStatut: (value: string) => Statut | null,
  unread: Unread
): ExtractedSousAction => {
  const { valueAt, sousActionCol } = layout;
  const text = collapseSpaces(
    sousActionCol === null ? '' : valueAt(row, sousActionCol)
  );
  const rowValues = (role: ColumnRole) =>
    columnsOf(layout, role)
      .filter(({ level }) => level === 'row')
      .map(({ col }) => valueAt(row, col))
      .filter((value) => value !== '');
  const { titre, rest } = shortenTitle(text);
  const dates = readRowDates(layout, [row], null, unread);
  return {
    titre,
    description: joinParagraphs([
      rest,
      ...rowValues('description'),
      ...dates.notes,
    ]),
    personnePilote: joinPilotes(rowValues('personnePilote')),
    statut:
      rowValues('statut')
        .map(mapStatut)
        .find((statut) => statut) ?? null,
    dateDebut: dates.dateDebut,
    dateFin: dates.dateFin,
  };
};

/** Le statut d'une case d'avancement ; une valeur inconnue est relevée. */
const statutMapper =
  (unread: Unread) =>
  (value: string): Statut | null => {
    const statut = mapStatutCell(value);
    if (statut === null && value.trim() !== '') {
      unread.statuts.add(value.trim());
    }
    return statut;
  };

const buildSourceTableur = (
  grid: SheetGrid,
  fiche: FicheBlock
): ExtractedAction['sourceTableur'] => ({
  onglet: grid.name,
  premiereLigne: fiche.rows[0],
  derniereLigne: fiche.rows.at(-1) ?? fiche.rows[0],
  ...(fiche.numero ? { numero: fiche.numero } : {}),
});

type RowDates = {
  dateDebut: string | null;
  dateFin: string | null;
  /** Les dates qu'aucun format ne lit exactement, gardées en description. */
  notes: string[];
};

/**
 * Du 1er janvier de la première année cochée au 31 décembre de la dernière ;
 * des colonnes de dates, quand il y en a, l'emportent. Sans les rangées de
 * la fiche, une sous-action lit sa propre rangée, et les notes ne reprennent
 * que ses colonnes à elle : celles de la fiche sont dans sa description.
 */
const readRowDates = (
  layout: SheetLayout,
  rows: number[],
  ficheRows: number[] | null,
  unread: Unread
): RowDates => {
  const { valueAt } = layout;
  const rowsFor = (column: ColumnLayout) =>
    column.level === 'fiche' ? ficheRows ?? rows : rows;
  const keepsNotes = (column: ColumnLayout) =>
    ficheRows !== null || column.level === 'row';
  const years = layout.columns.flatMap((column) => {
    if (column.role !== 'calendrier') {
      return [];
    }
    return rowsFor(column).flatMap((row) => {
      const value = valueAt(row, column.col);
      if (value === '') {
        return [];
      }
      return column.year !== undefined ? [column.year] : yearsIn(value);
    });
  });
  const notes: string[] = [];
  const datesOf = (role: 'dateDebut' | 'dateFin') =>
    columnsOf(layout, role).flatMap((column) =>
      uniq(rowsFor(column).map((row) => valueAt(row, column.col)))
        .filter((value) => value !== '')
        .flatMap((value) => {
          const date = toDate(value, role);
          if (!date?.exact && keepsNotes(column)) {
            notes.push(`${columnName(column)} : ${collapseSpaces(value)}`);
            unread.values.add(`${columnName(column)} « ${value} »`);
          }
          return date ? [date.date] : [];
        })
    );
  const fromYears = datesFromYears(years);
  return {
    dateDebut: minDate(datesOf('dateDebut')) ?? fromYears.dateDebut,
    dateFin: maxDate(datesOf('dateFin')) ?? fromYears.dateFin,
    notes,
  };
};

const datesFromYears = (
  years: number[]
): { dateDebut: string | null; dateFin: string | null } =>
  years.length === 0
    ? { dateDebut: null, dateFin: null }
    : {
        dateDebut: `${Math.min(...years)}-01-01`,
        dateFin: `${Math.max(...years)}-12-31`,
      };

/**
 * Une date exacte, une année seule (« 2026 »), ou à défaut l'approximation
 * qu'un texte permet : « Juin 2025 » finit le 30 juin, « Fin 2026 » ou
 * « 2025-2027 » au 31 décembre de la dernière année.
 */
const toDate = (
  value: string,
  role: 'dateDebut' | 'dateFin'
): { date: string; exact: boolean } | null => {
  const date = parseDateValue(value, { serial: true });
  if (date) {
    return { date, exact: true };
  }
  const years = yearsIn(value);
  if (years.length === 0) {
    return null;
  }
  const exact = /^\s*(?:19|20)\d{2}\s*$/.test(value);
  const year = role === 'dateDebut' ? Math.min(...years) : Math.max(...years);
  const month =
    years.length === 1
      ? MONTHS.findIndex((name) =>
          new RegExp(`(?<!\\p{L})${name}(?!\\p{L})`, 'u').test(
            value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
          )
        )
      : -1;
  if (month === -1) {
    return {
      date: role === 'dateDebut' ? `${year}-01-01` : `${year}-12-31`,
      exact,
    };
  }
  const monthNumber = String(month + 1).padStart(2, '0');
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return {
    date:
      role === 'dateDebut'
        ? `${year}-${monthNumber}-01`
        : `${year}-${monthNumber}-${lastDay}`,
    exact: false,
  };
};

/**
 * La somme des cellules de budget de la fiche, chacune une fois. Dans une
 * colonne lue à la fiche, un montant répété sur toutes ses rangées sans
 * fusion ne compte qu'une fois ; rangée par rangée, chaque montant compte.
 * Un montant illisible reste en description.
 */
const sumBudget = (
  grid: SheetGrid,
  layout: SheetLayout,
  rows: number[],
  unread: Unread
): { total: number | null; notes: string[] } => {
  const notes: string[] = [];
  const amounts = columnsOf(layout, 'budget').flatMap((column) => {
    const values = readCellValues(grid, layout.valueAt, column.col, rows);
    const parsed = values.flatMap((value) => {
      const amount = parseAmount(value);
      if (amount === null) {
        notes.push(`${columnName(column)} : ${collapseSpaces(value)}`);
        unread.values.add(`${columnName(column)} « ${value} »`);
        return [];
      }
      return [amount];
    });
    const repeated =
      column.level === 'fiche' &&
      parsed.length === rows.length &&
      rows.length > 1 &&
      parsed.every((amount) => amount === parsed[0]);
    return repeated ? parsed.slice(0, 1) : parsed;
  });
  return {
    total:
      amounts.length > 0
        ? amounts.reduce((total, amount) => total + amount, 0)
        : null,
    notes: uniq(notes),
  };
};

/** La somme des budgets contre la formule `SUM` qui totalise la colonne. */
const checkBudget = (
  { grid, layout }: TabularPlanSheet,
  fiches: BuiltFiche[]
): BuiltTabularActions['budgetCheck'] => {
  const [column] = columnsOf(layout, 'budget');
  if (!column) {
    return null;
  }
  const sums = findAggregateFormulas(grid).filter(
    ({ formula, rangeCol }) =>
      rangeCol === column.col && /^SUM\s*\(/i.test(formula)
  );
  const widest = sums.sort((a, b) => b.bottom - b.top - (a.bottom - a.top))[0];
  const expected = widest ? parseAmount(widest.result) : null;
  if (!widest || expected === null) {
    return null;
  }
  const total = fiches.reduce(
    (sum, { action }) => sum + (action.budget ?? 0),
    0
  );
  return { total, expected, cell: `${column.letter}${widest.row}` };
};

const indicatorLines = (layout: SheetLayout, rows: number[]): string[] => {
  const [cible] = columnsOf(layout, 'cible');
  const indicateurs = columnsOf(layout, 'indicateur');
  if (indicateurs.length === 0) {
    const cibles = uniq(
      columnsOf(layout, 'cible').flatMap(({ col }) =>
        rows.map((row) => collapseSpaces(layout.valueAt(row, col)))
      )
    ).filter((value) => value !== '');
    return cibles.length > 0 ? [labelled('Valeurs cibles', cibles)] : [];
  }
  return indicateurs.flatMap((column) =>
    rows.flatMap((row) => {
      const indicateur = collapseSpaces(layout.valueAt(row, column.col));
      return indicateur === ''
        ? []
        : [
            formatIndicator(
              indicateur,
              cible ? layout.valueAt(row, cible.col) : ''
            ),
          ];
    })
  );
};

/**
 * Les colonnes que rien n'a reconnues ne sont jamais jetées : « Libellé :
 * valeur » dans la description.
 */
const describeOtherColumns = (
  grid: SheetGrid,
  layout: SheetLayout,
  rows: number[]
): string[] =>
  columnsOf(layout, 'autre').flatMap((column) => {
    const values = readDistinctValues(grid, layout.valueAt, column.col, rows);
    return values.length === 0 ? [] : [labelled(columnName(column), values)];
  });

const columnName = (column: ColumnLayout): string =>
  column.label || `Colonne ${column.letter}`;

const buildFormFiche = (
  { grid, layout, axisPrefix }: TabularPlanSheet,
  fields: FormField[],
  unread: Unread
): BuiltFiche[] => {
  const [fiche] = layout.fiches;
  if (!fiche) {
    return [];
  }
  const valuesOf = (role: ColumnRole) =>
    fields
      .filter((field) => field.role === role)
      .flatMap(({ values }) => values.map(collapseLines))
      .filter((value) => value !== '');
  const notesOf = (role: ColumnRole, read: (value: string) => boolean) =>
    fields
      .filter((field) => field.role === role)
      .flatMap(({ label, values }) =>
        values
          .map(collapseLines)
          .filter((value) => value !== '' && !read(value))
          .map((value) => {
            unread.values.add(`${label} « ${value} »`);
            return `${label} : ${value}`;
          })
      );
  const statut = statutMapper(unread)(valuesOf('statut')[0] ?? '');
  const dateOf = (role: 'dateDebut' | 'dateFin') =>
    valuesOf(role)
      .map((value) => toDate(value, role)?.date ?? null)
      .find((date) => date !== null) ?? null;
  const fromYears = datesFromYears(valuesOf('calendrier').flatMap(yearsIn));
  const amounts = valuesOf('budget')
    .map(parseAmount)
    .filter((amount): amount is number => amount !== null);
  const sousActions = valuesOf('sousAction')
    .flatMap(splitListItems)
    .map((text) => {
      const { titre, rest } = shortenTitle(text);
      return {
        titre,
        description: rest,
        personnePilote: null,
        statut: null,
        dateDebut: null,
        dateFin: null,
      };
    });
  const others = fields
    .filter(({ role, values }) => role === 'autre' && values.length > 0)
    .map(({ label, values }) => labelled(label, values.map(collapseLines)));
  const action = createEmptyExtractedAction({
    titre: numberedTitle(fiche.numero, fiche.titre),
    description: joinParagraphs([
      ...valuesOf('description'),
      labelled('Commentaires', valuesOf('commentaire')),
      ...others,
      ...notesOf('budget', (value) => parseAmount(value) !== null),
      ...notesOf(
        'dateDebut',
        (value) => toDate(value, 'dateDebut')?.exact === true
      ),
      ...notesOf(
        'dateFin',
        (value) => toDate(value, 'dateFin')?.exact === true
      ),
      ...describePriorite(valuesOf('priorite')),
    ]),
    objectifs: joinLines([
      ...valuesOf('objectifs'),
      ...valuesOf('indicateur')
        .flatMap(splitListItems)
        .map((value) => `- ${value}`),
    ]),
    structurePilote: joinPilotes(valuesOf('structurePilote')),
    directionServicePilote: joinPilotes(valuesOf('servicePilote')),
    personnePilote: joinPilotes(valuesOf('personnePilote')),
    partenaires: joinPilotes(valuesOf('partenaires')),
    budget: amounts.length > 0 ? amounts[0] : null,
    financements: joinLines(valuesOf('financements')),
    moyensHumains: joinLines(valuesOf('moyensHumains')),
    priorite: mapPriorite(valuesOf('priorite')[0] ?? ''),
    statut,
    dateDebut: dateOf('dateDebut') ?? fromYears.dateDebut,
    dateFin: dateOf('dateFin') ?? fromYears.dateFin,
    sousActions,
    sourceTableur: buildSourceTableur(grid, fiche),
  });
  return [
    { fiche, action: withAxisPath(action, [...axisPrefix, ...fiche.path]) },
  ];
};

/** « - Étape 1\n- Étape 2 » dans une seule cellule : une sous-action par ligne. */
const splitListItems = (value: string): string[] =>
  value
    .split(/\n/)
    .map((line) => line.replace(/^\s*(?:[-•*–]|\d{1,2}[.)])\s*/, '').trim())
    .filter((line) => line !== '');

/**
 * Le titre précédé de son n°, à la façon que `stripTitleNumbers` sait
 * retirer : le n° départage deux fiches homonymes du même axe. Un titre
 * déjà numéroté le reste tel quel.
 */
export const numberedTitle = (numero: string | null, titre: string): string => {
  if (!numero || stripTitleNumber(titre) !== titre) {
    return titre;
  }
  if (/^\d{1,2}$/.test(numero)) {
    return `${numero} - ${titre}`;
  }
  if (/^\d{1,2}(?:\.\d{1,2}){1,3}$/.test(numero)) {
    return `${numero} ${titre}`;
  }
  if (/^\d{3}$/.test(numero)) {
    return `Fiche ${numero} - ${titre}`;
  }
  return titre;
};

/**
 * Au-delà de 300 caractères, le titre s'arrête à la dernière phrase entière
 * et le texte complet passe en description.
 */
export const shortenTitle = (
  text: string
): { titre: string; rest: string | null } => {
  if (text.length <= MAX_FICHE_TITLE_LENGTH) {
    return { titre: text, rest: null };
  }
  const head = text.slice(0, MAX_FICHE_TITLE_LENGTH);
  const sentenceEnd = Math.max(
    ...['. ', '; ', ' : ', '! ', '? '].map((mark) => head.lastIndexOf(mark))
  );
  const cut =
    sentenceEnd >= 60
      ? head.slice(0, sentenceEnd + 1).trim()
      : `${head
          .slice(0, head.lastIndexOf(' ', MAX_FICHE_TITLE_LENGTH - 1))
          .trim()}…`;
  return { titre: cut, rest: text };
};

/** « Région / Interco » donne deux structures ; « à définir », aucune. */
export const joinPilotes = (values: string[]): string | null => {
  const names = uniq(
    values
      .flatMap((value) => value.split('/'))
      .map(collapseSpaces)
      .filter((name) => name !== '' && !PILOTE_UNDEFINED.test(name))
  );
  return names.length > 0 ? names.join(', ') : null;
};

const PRIORITE_BY_WORD: ReadonlyArray<readonly [RegExp, Priorite]> = [
  [/^(?:[ée]lev[ée]e?|haute?|forte?|prioritaire|1)$/i, PrioriteEnum.ÉLEVÉ],
  [/^(?:moyenne?|2)$/i, PrioriteEnum.MOYEN],
  [/^(?:basse?|faible|3)$/i, PrioriteEnum.BAS],
];

const mapPriorite = (value: string): Priorite | null =>
  PRIORITE_BY_WORD.find(([pattern]) => pattern.test(value.trim()))?.[1] ?? null;

/** Une priorité qui ne se range pas dans la plateforme reste lisible. */
const describePriorite = (values: string[]): string[] =>
  values.length > 0 && mapPriorite(values[0]) === null
    ? [labelled('Priorité', values)]
    : [];

/** « - Fréquentation des pôles (cible : 900) » : une ligne d'objectifs. */
export const formatIndicator = (indicateur: string, cible: string): string =>
  cible.trim() === ''
    ? `- ${indicateur}`
    : `- ${indicateur} (cible : ${collapseSpaces(cible)})`;

const appendObjectifs = (
  action: ExtractedAction,
  lines: string[]
): ExtractedAction =>
  lines.length === 0
    ? action
    : {
        ...action,
        objectifs: joinLines([action.objectifs ?? '', ...uniq(lines)]),
      };

/** Les champs désactivés restent vides, comme le prompt le demande au modèle. */
export const clearDisabledFields = (
  action: ExtractedAction,
  disabledFields: DisableableField[]
): ExtractedAction => {
  const disabled = new Set(disabledFields);
  if (disabled.size === 0) {
    return action;
  }
  const sousActions = action.sousActions.map((sousAction) => ({
    ...sousAction,
    ...(disabled.has('description') ? { description: null } : {}),
    ...(disabled.has('personne pilote') ? { personnePilote: null } : {}),
    ...(disabled.has('statut') ? { statut: null } : {}),
    ...(disabled.has('date de début') ? { dateDebut: null } : {}),
    ...(disabled.has('date de fin') ? { dateFin: null } : {}),
  }));
  return {
    ...action,
    ...(disabled.has('description') ? { description: null } : {}),
    ...(disabled.has('objectifs') ? { objectifs: null } : {}),
    ...(disabled.has('structure pilote') ? { structurePilote: null } : {}),
    ...(disabled.has('direction ou service pilote')
      ? { directionServicePilote: null }
      : {}),
    ...(disabled.has('personne pilote') ? { personnePilote: null } : {}),
    ...(disabled.has('budget') ? { budget: null } : {}),
    ...(disabled.has('statut') ? { statut: null } : {}),
    ...(disabled.has('date de début') ? { dateDebut: null } : {}),
    ...(disabled.has('date de fin') ? { dateFin: null } : {}),
    sousActions,
  };
};

const labelled = (label: string, values: string[]): string =>
  values.length === 0
    ? ''
    : values.length === 1
    ? `${label} : ${values[0]}`
    : `${label} :\n${values.map((value) => `- ${value}`).join('\n')}`;

const joinParagraphs = (parts: (string | null)[]): string | null => {
  const kept = parts
    .map((part) => part?.trim() ?? '')
    .filter((part) => part !== '');
  return kept.length > 0 ? uniq(kept).join('\n\n') : null;
};

const joinLines = (parts: string[]): string | null => {
  const kept = parts.map((part) => part.trim()).filter((part) => part !== '');
  return kept.length > 0 ? kept.join('\n') : null;
};

const collapseLines = (text: string): string =>
  text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .trim();

const minDate = (dates: (string | null)[]): string | null =>
  dates.filter((date): date is string => date !== null).sort()[0] ?? null;

const maxDate = (dates: (string | null)[]): string | null =>
  dates
    .filter((date): date is string => date !== null)
    .sort()
    .at(-1) ?? null;

const formatAmount = (amount: number): string =>
  amount.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
