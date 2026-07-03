import {
  generateCellKey,
  CellKey,
  GridCell,
  GridGroups,
  GridRowGroup,
  IndicateurValuesGridActions,
  OpenDataSource,
  toIndicateurId,
  toYear,
  Year,
} from '../types';

const currentYear = new Date().getFullYear();

export const fakeReferenceYear: Year = toYear(currentYear);
export const fakeYears: Year[] = [
  currentYear,
  currentYear + 4,
  currentYear + 10,
  currentYear + 24,
].map(toYear);

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

export const toGridInput = (groups: GridRowGroup[]): GridGroups =>
  Object.fromEntries(
    groups.map((group) => [group.id, { label: group.label, rows: group.rows }])
  );

export const fakeGroupsInput: GridGroups = toGridInput(fakeGroups);

const sourceDefs = [
  {
    sourceId: 'citepa',
    libelle: 'CITEPA',
    methodologie: 'Inventaire national spatialisé',
    dateVersion: '2026-01-01',
  },
  {
    sourceId: 'insee',
    libelle: 'INSEE',
    methodologie: null,
    dateVersion: '2024-01-01',
  },
  {
    sourceId: 'ademe',
    libelle: 'ADEME',
    methodologie: 'Base Carbone',
    dateVersion: '2025-01-01',
  },
];

const referenceValueOf = (indicateurId: number): number =>
  200 + (indicateurId % 6) * 60;

const yearFactor = (year: number): number => {
  const horizon = year - currentYear;
  if (horizon <= 0) {
    return 1;
  }
  if (horizon <= 4) {
    return 0.82;
  }
  if (horizon <= 10) {
    return 0.58;
  }
  return 0.31;
};

const trajectoryValue = (indicateurId: number, year: number): number =>
  Math.round(referenceValueOf(indicateurId) * yearFactor(year));

const coveringSourcesFor = (
  indicateurId: number,
  year: number
): OpenDataSource[] =>
  sourceDefs
    .slice(0, 2 + ((indicateurId + year) % 2))
    .map((def, index) => ({
      ...def,
      value: trajectoryValue(indicateurId, year) + index * 12,
    }));

const buildCell = (indicateurId: number, year: number): GridCell => {
  const coveringSources = coveringSourcesFor(indicateurId, year);
  const variant = (indicateurId + year) % 4;
  if (variant === 0) {
    const [chosen] = coveringSources;
    return {
      kind: 'open-data',
      value: chosen.value,
      selectedSourceId: chosen.sourceId,
      source: {
        sourceId: chosen.sourceId,
        libelle: chosen.libelle,
        methodologie: chosen.methodologie,
        dateVersion: chosen.dateVersion,
      },
      coveringSources,
    };
  }
  if (variant === 1 && year !== fakeReferenceYear) {
    return { kind: 'user-data', value: null, coveringSources };
  }
  return {
    kind: 'user-data',
    value: trajectoryValue(indicateurId, year),
    valueId: indicateurId * 1000 + year,
    coveringSources: variant === 3 ? coveringSources : [],
  };
};

export const fakeCellsForGroups = (
  groups: GridRowGroup[]
): Map<CellKey, GridCell> =>
  new Map(
    groups.flatMap((group) =>
      group.rows.flatMap((row) =>
        fakeYears.map(
          (year) =>
            [generateCellKey(row.indicateurId, year), buildCell(row.indicateurId, year)] as const
        )
      )
    )
  );

export const fakeCells = (): Map<CellKey, GridCell> =>
  fakeCellsForGroups(fakeGroups);

export const fakeGridActions: IndicateurValuesGridActions = {
  saveCellValue: async () => ({ ok: true, value: undefined }),
  saveCellValues: async (inputs) => ({ ok: true, value: { written: inputs.length, failed: [] } }),
  selectOpenData: async () => ({ ok: true, value: undefined }),
  clearCell: async () => ({ ok: true, value: undefined }),
};
