declare const indicateurIdBrand: unique symbol;
export type IndicateurId = number & { readonly [indicateurIdBrand]: true };
export const toIndicateurId = (value: number): IndicateurId =>
  value as IndicateurId;

declare const yearBrand: unique symbol;
export type Year = number & { readonly [yearBrand]: true };
export const toYear = (value: number): Year => value as Year;

export type CellKey = string;

export const cellKey = (indicateurId: IndicateurId, year: Year): CellKey =>
  `${indicateurId}:${year}`;

export type SourceInfo = {
  sourceId: string;
  libelle: string;
  methodologie: string | null;
  dateVersion: string;
};

export type CoveringSource = {
  sourceId: string;
  libelle: string;
  value: number;
  methodologie: string | null;
  dateVersion: string;
};

export type GridCell =
  | {
      kind: 'user-data';
      value: number;
      valueId: number;
      coveringSources: CoveringSource[];
    }
  | {
      kind: 'user-data';
      value: null;
      valueId?: number;
      coveringSources: CoveringSource[];
    }
  | {
      kind: 'open-data';
      value: number;
      adoptedSourceId: string;
      source: SourceInfo;
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

export type Result<T = void> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export type WriteCellInput = {
  indicateurId: IndicateurId;
  valueId?: number;
  year: Year;
  resultat: number | null;
};

export type AdoptInput = {
  indicateurId: IndicateurId;
  year: Year;
  sourceId: string;
};

export type ClearCellInput = {
  indicateurId: IndicateurId;
  valueId: number;
};

export type BulkOutcome = {
  written: number;
  failed: WriteCellInput[];
};

export type IndicateurValuesGridActions = {
  writeCell: (input: WriteCellInput) => Promise<Result>;
  writeBulk: (inputs: WriteCellInput[]) => Promise<Result<BulkOutcome>>;
  adopt: (input: AdoptInput) => Promise<Result>;
  clearCell: (input: ClearCellInput) => Promise<Result>;
};
