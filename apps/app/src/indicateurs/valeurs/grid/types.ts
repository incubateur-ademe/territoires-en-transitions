declare const indicateurIdBrand: unique symbol;
export type IndicateurId = number & { readonly [indicateurIdBrand]: true };
export const toIndicateurId = (value: number): IndicateurId =>
  value as IndicateurId;

declare const yearBrand: unique symbol;
export type Year = number & { readonly [yearBrand]: true };
export const toYear = (value: number): Year => value as Year;

declare const sourceIdBrand: unique symbol;
export type SourceId = string & { readonly [sourceIdBrand]: true };
export const toSourceId = (value: string): SourceId => value as SourceId;

export type ValeurField = 'resultat' | 'objectif';

export type CellKey = `${number}:${number}`;

export const CELL_ID_ATTRIBUTE = 'data-cell-id';

export const generateCellKey = (indicateurId: IndicateurId, year: Year): CellKey =>
  `${indicateurId}:${year}` as CellKey;

export type NavCellKey = `${number}:${number}:${ValeurField}`;

export const generateNavCellKey = (
  indicateurId: IndicateurId,
  year: Year,
  field: ValeurField
): NavCellKey => `${indicateurId}:${year}:${field}` as NavCellKey;

export const isNavCellKey = (value: string | null): value is NavCellKey =>
  value !== null && /^\d+:\d+:(resultat|objectif)$/.test(value);

export const parseNavCellKey = (
  key: NavCellKey
): { indicateurId: IndicateurId; year: Year; field: ValeurField } => {
  const [indicateurId, year, field] = key.split(':');
  return {
    indicateurId: toIndicateurId(Number(indicateurId)),
    year: toYear(Number(year)),
    field: field as ValeurField,
  };
};

/** @deprecated Use isNavCellKey for focusable grid cells. */
export const isCellKey = (value: string | null): value is CellKey =>
  value !== null && /^\d+:\d+$/.test(value);

/** @deprecated Use parseNavCellKey for focusable grid cells. */
export const parseCellKey = (
  key: CellKey
): { indicateurId: IndicateurId; year: Year } => {
  const [indicateurId, year] = key.split(':');
  return {
    indicateurId: toIndicateurId(Number(indicateurId)),
    year: toYear(Number(year)),
  };
};

/**
 * Constat d'une source extérieure, affiché à côté de la saisie sans jamais s'y
 * substituer. Le libellé arrive résolu : la grille ne connaît pas le registre
 * des sources d'indicateurs.
 */
export type GridCellReference = {
  label: string;
  millesime: string | null;
  resultat: number | null;
};

export type GridCell = {
  resultat: number | null;
  objectif: number | null;
  references?: GridCellReference[];
};

export type GridRow = {
  indicateurId: IndicateurId;
  label: string;
};

export type GridRowGroup = {
  id: string;
  label: string;
  rows: GridRow[];
};

export type GridGroupInput = {
  label: string;
  rows: GridRow[];
};

export type GridGroups = Record<string, GridGroupInput>;

export type GridInput = GridRow[] | GridGroups;

/**
 * Plafond de hauteur de la grille, qui décide aussi de la zone de défilement
 * dans laquelle l'en-tête et les lignes de secteur restent collantes.
 * `none` supprime le plafond : plus de défilement vertical interne, donc plus
 * d'en-tête collant.
 */
export type GridMaxHeight = 'compact' | 'viewport' | 'none';

export type Result<T = void> = { ok: true; value: T } | { ok: false };

export type GridNotificationLevel = 'success' | 'error' | 'info';

export type NotifyGridEvent = (
  message: string,
  level: GridNotificationLevel
) => void;

export type CellValueInput = {
  indicateurId: IndicateurId;
  year: Year;
  field: ValeurField;
  value: number | null;
};

export type BulkOutcome = {
  written: number;
  failed: CellValueInput[];
};

export type IndicateurValuesGridActions = {
  saveCellValue: (input: CellValueInput) => Promise<Result>;
  saveCellValues: (inputs: CellValueInput[]) => Promise<Result<BulkOutcome>>;
};
