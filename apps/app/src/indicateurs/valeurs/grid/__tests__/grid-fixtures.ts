import {
  cellKey,
  CellKey,
  GridCell,
  GridRowGroup,
  IndicateurValuesGridActions,
  toIndicateurId,
  toYear,
  Year,
} from '../types';

export const fakeYears: Year[] = [2026, 2030, 2036, 2050].map(toYear);
export const fakeReferenceYear: Year = toYear(2026);

const sectors = ['Résidentiel', 'Tertiaire', 'Transport routier', 'Agriculture', 'Industrie'];
const pollutants = ['NOx', 'PM10', 'PM2,5', 'COVNM', 'SO2', 'NH3'];

export const fakeGroups: GridRowGroup[] = sectors.map((sector, sectorIndex) => ({
  id: `secteur-${sectorIndex}`,
  label: sector,
  rows: pollutants.map((pollutant, pollutantIndex) => ({
    indicateurId: toIndicateurId(sectorIndex * 10 + pollutantIndex),
    label: pollutant,
  })),
}));

const citepa = {
  sourceId: 'citepa',
  libelle: 'CITEPA',
  methodologie: 'Inventaire national spatialisé',
  dateVersion: '2026-01-01',
};

const pseudoValue = (indicateurId: number, year: number): number =>
  ((indicateurId * 7 + year) % 900) + 100;

const buildCell = (indicateurId: number, year: number): GridCell => {
  const seed = (indicateurId + year) % 6;
  if (seed === 0) {
    return {
      kind: 'open-data',
      value: pseudoValue(indicateurId, year),
      adoptedSourceId: citepa.sourceId,
      source: citepa,
    };
  }
  if (seed === 1) {
    return {
      kind: 'user-data',
      value: null,
      coveringSources: [{ ...citepa, value: pseudoValue(indicateurId, year) }],
    };
  }
  if (seed === 2) {
    return { kind: 'user-data', value: null, coveringSources: [] };
  }
  return {
    kind: 'user-data',
    value: pseudoValue(indicateurId, year),
    valueId: indicateurId * 1000 + year,
    coveringSources: [],
  };
};

export const fakeCells = (): Map<CellKey, GridCell> =>
  new Map(
    fakeGroups.flatMap((group) =>
      group.rows.flatMap((row) =>
        fakeYears.map(
          (year) =>
            [cellKey(row.indicateurId, year), buildCell(row.indicateurId, year)] as const
        )
      )
    )
  );

export const fakeGridActions: IndicateurValuesGridActions = {
  writeCell: async () => ({ ok: true, value: undefined }),
  writeBulk: async (inputs) => ({ ok: true, value: { written: inputs.length, failed: [] } }),
  adopt: async () => ({ ok: true, value: undefined }),
  clearCell: async () => ({ ok: true, value: undefined }),
};
