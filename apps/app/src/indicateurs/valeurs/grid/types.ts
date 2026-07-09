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

export type CellKey = `${number}:${number}`;

export const CELL_ID_ATTRIBUTE = 'data-cell-id';

export const generateCellKey = (indicateurId: IndicateurId, year: Year): CellKey =>
  `${indicateurId}:${year}` as CellKey;

export const isCellKey = (value: string | null): value is CellKey =>
  value !== null && /^\d+:\d+$/.test(value);

export const parseCellKey = (
  key: CellKey
): { indicateurId: IndicateurId; year: Year } => {
  const [indicateurId, year] = key.split(':');
  return {
    indicateurId: toIndicateurId(Number(indicateurId)),
    year: toYear(Number(year)),
  };
};

export type SourceInfo = {
  sourceId: SourceId;
  libelle: string;
  methodologie: string | null;
  dateVersion: string;
};

export type OpenDataSource = {
  sourceId: SourceId;
  libelle: string;
  value: number;
  methodologie: string | null;
  dateVersion: string;
};

export type GridCell =
  | {
      kind: 'user-data';
      value: number | null;
      coveringSources: OpenDataSource[];
    }
  | {
      kind: 'open-data';
      value: number;
      selectedSourceId: SourceId;
      source: SourceInfo;
      coveringSources: OpenDataSource[];
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

export type Result<T = void> = { ok: true; value: T } | { ok: false };

export type GridNotificationLevel = 'success' | 'error' | 'info';

export type NotifyGridEvent = (
  message: string,
  level: GridNotificationLevel
) => void;

export type ValeurField = 'resultat' | 'objectif';

export type CellValueInput = {
  indicateurId: IndicateurId;
  year: Year;
  value: number | null;
};

export type SelectOpenDataInput = {
  indicateurId: IndicateurId;
  year: Year;
  sourceId: SourceId;
};

export type ClearCellInput = {
  indicateurId: IndicateurId;
  year: Year;
};

export type BulkOutcome = {
  written: number;
  failed: CellValueInput[];
};

export type IndicateurValuesGridActions = {
  saveCellValue: (input: CellValueInput) => Promise<Result>;
  saveCellValues: (inputs: CellValueInput[]) => Promise<Result<BulkOutcome>>;
  selectOpenData: (input: SelectOpenDataInput) => Promise<Result>;
  clearCell: (input: ClearCellInput) => Promise<Result>;
};
