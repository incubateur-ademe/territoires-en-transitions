import {
  CellError,
  mapPasteToValues,
  TargetCell,
  toAbsolute,
  ValueField,
} from './paste-values';

const REFERENTIEL_PREFIX = 'cae_4';

export type PollutantLetter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f';

export type SectorLetter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';

export type PollutantConfig = {
  letter: PollutantLetter;
  label: string;
};

export type SectorConfig = {
  letter: SectorLetter;
  label: string;
};

export type YearValue = {
  year: number;
  value: number | null;
};

export type IndicatorValues = {
  identifier: string;
  indicateurId: number;
  collectivite: YearValue[];
  openData: YearValue[];
};

export type GridCell = {
  year: number;
  value: number | null;
  proposal: number | null;
  percentageVsReference: number | null;
};

export type GridRow = {
  identifier: string;
  sectorLabel: string;
  pollutantLabel: string;
  sectorIndex: number;
  pollutantIndex: number;
  indicateurId: number | null;
  isGroupStart: boolean;
  groupSize: number;
  cells: GridCell[];
};

export type DraftCell = {
  indicateurId: number;
  year: number;
  field: ValueField;
  value: number | null;
};

export type PasteError =
  | { kind: 'cell'; error: CellError }
  | { kind: 'relativeWithoutReference'; indicateurId: number; year: number };

export type PasteOutcome = {
  cells: DraftCell[];
  errors: PasteError[];
};

export const sectorPollutantIdentifier = (
  pollutantLetter: PollutantLetter,
  sectorLetter: SectorLetter
): string => `${REFERENTIEL_PREFIX}.${pollutantLetter}${sectorLetter}`;

export const dateValueFromYear = (year: number): string => `${year}-01-01`;

export const yearFromDateValue = (dateValue: string): number =>
  Number(dateValue.slice(0, 4));

export const cellKey = (indicateurId: number, year: number): string =>
  `${indicateurId}:${year}`;

const evolutionPercentage = ({
  year,
  value,
  referenceYear,
  referenceValue,
}: {
  year: number;
  value: number | null;
  referenceYear: number;
  referenceValue: number | null;
}): number | null => {
  if (
    year === referenceYear ||
    referenceValue === null ||
    referenceValue === 0 ||
    value === null
  ) {
    return null;
  }
  return (value / referenceValue - 1) * 100;
};

export const buildGridRows = ({
  indicators,
  orderedSectors,
  orderedPollutants,
  years,
  referenceYear,
  draft,
}: {
  indicators: IndicatorValues[];
  orderedSectors: SectorConfig[];
  orderedPollutants: PollutantConfig[];
  years: number[];
  referenceYear: number;
  draft: Map<string, DraftCell>;
}): GridRow[] => {
  const indicatorByIdentifier = new Map(
    indicators.map((indicator) => [indicator.identifier, indicator])
  );

  return orderedSectors.flatMap((sector, sectorIndex) =>
    orderedPollutants.map((pollutant, pollutantIndex) => {
      const identifier = sectorPollutantIdentifier(
        pollutant.letter,
        sector.letter
      );
      const indicator = indicatorByIdentifier.get(identifier) ?? null;
      const indicateurId = indicator?.indicateurId ?? null;
      const collectiviteValues = indicator?.collectivite ?? [];
      const openDataValues = indicator?.openData ?? [];

      const valuesByYear = years.map((year) => {
        const serverValue =
          collectiviteValues.find((candidate) => candidate.year === year)
            ?.value ?? null;
        const draftCell =
          indicateurId === null
            ? undefined
            : draft.get(cellKey(indicateurId, year));
        const value = draftCell === undefined ? serverValue : draftCell.value;
        const openDataValue =
          openDataValues.find((candidate) => candidate.year === year)?.value ??
          null;
        return {
          year,
          value,
          proposal: value === null ? openDataValue : null,
        };
      });

      const referenceValue =
        valuesByYear.find((cell) => cell.year === referenceYear)?.value ?? null;

      return {
        identifier,
        sectorLabel: sector.label,
        pollutantLabel: pollutant.label,
        sectorIndex,
        pollutantIndex,
        indicateurId,
        isGroupStart: pollutantIndex === 0,
        groupSize: orderedPollutants.length,
        cells: valuesByYear.map((cell) => ({
          year: cell.year,
          value: cell.value,
          proposal: cell.proposal,
          percentageVsReference: evolutionPercentage({
            year: cell.year,
            value: cell.value,
            referenceYear,
            referenceValue,
          }),
        })),
      };
    })
  );
};

export const buildTargetGrid = (
  rows: GridRow[]
): (TargetCell | null)[][] =>
  rows.map((row) =>
    row.cells.map((cell) =>
      row.indicateurId === null
        ? null
        : {
            indicateurId: row.indicateurId,
            year: cell.year,
            field: 'resultat',
          }
    )
  );

export const indexIndicatorLabels = (rows: GridRow[]): Map<number, string> =>
  new Map(
    rows.flatMap((row) =>
      row.indicateurId === null
        ? []
        : [
            [
              row.indicateurId,
              `${row.sectorLabel} · ${row.pollutantLabel}`,
            ] as const,
          ]
    )
  );

export const indexReferenceValues = (
  rows: GridRow[],
  referenceYear: number
): Map<number, number> =>
  new Map(
    rows.flatMap((row) => {
      if (row.indicateurId === null) {
        return [];
      }
      const referenceValue =
        row.cells.find((cell) => cell.year === referenceYear)?.value ?? null;
      return referenceValue === null
        ? []
        : [[row.indicateurId, referenceValue] as const];
    })
  );

export const countOpenDataProposals = (rows: GridRow[]): number =>
  rows.reduce(
    (count, row) =>
      count + row.cells.filter((cell) => cell.proposal !== null).length,
    0
  );

export const applyPaste = ({
  paste,
  targetGrid,
  anchor,
  referenceYear,
  baseReferences,
}: {
  paste: string;
  targetGrid: ReadonlyArray<ReadonlyArray<TargetCell | null>>;
  anchor: { row: number; column: number };
  referenceYear: number;
  baseReferences: Map<number, number>;
}): PasteOutcome => {
  const result = mapPasteToValues({ paste, targetGrid, anchor });

  const references = result.entries.reduce(
    (accumulator, entry) =>
      entry.year === referenceYear && entry.value.type === 'absolute'
        ? accumulator.set(entry.indicateurId, entry.value.value)
        : accumulator,
    new Map(baseReferences)
  );

  return result.entries.reduce<PasteOutcome>(
    (outcome, entry) => {
      const reference =
        entry.year === referenceYear
          ? null
          : references.get(entry.indicateurId) ?? null;
      const absolute = toAbsolute(entry.value, reference);
      if (!absolute.ok) {
        return {
          ...outcome,
          errors: [
            ...outcome.errors,
            {
              kind: 'relativeWithoutReference',
              indicateurId: entry.indicateurId,
              year: entry.year,
            },
          ],
        };
      }
      return {
        ...outcome,
        cells: [
          ...outcome.cells,
          {
            indicateurId: entry.indicateurId,
            year: entry.year,
            field: entry.field,
            value: absolute.value,
          },
        ],
      };
    },
    {
      cells: [],
      errors: result.errors.map((error) => ({ kind: 'cell', error })),
    }
  );
};
