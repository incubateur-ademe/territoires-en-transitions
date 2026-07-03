import {
  generateCellKey,
  CellKey,
  GridCell,
  GridRowGroup,
  IndicateurValuesGridActions,
  OpenDataSource,
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

const pseudoValue = (indicateurId: number, year: number): number =>
  ((indicateurId * 7 + year) % 900) + 100;

const coveringSourcesFor = (
  indicateurId: number,
  year: number
): OpenDataSource[] =>
  sourceDefs
    .slice(0, 2 + ((indicateurId + year) % 2))
    .map((def, index) => ({
      ...def,
      value: pseudoValue(indicateurId, year) + index * 15,
    }));

const buildCell = (indicateurId: number, year: number): GridCell => {
  const seed = (indicateurId + year) % 6;
  const coveringSources = coveringSourcesFor(indicateurId, year);
  if (seed === 0) {
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
  if (seed === 1 || seed === 2 || seed === 3) {
    return { kind: 'user-data', value: null, coveringSources };
  }
  if (seed === 4) {
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
            [generateCellKey(row.indicateurId, year), buildCell(row.indicateurId, year)] as const
        )
      )
    )
  );

export const fakeGridActions: IndicateurValuesGridActions = {
  saveCellValue: async () => ({ ok: true, value: undefined }),
  saveCellValues: async (inputs) => ({ ok: true, value: { written: inputs.length, failed: [] } }),
  selectOpenData: async () => ({ ok: true, value: undefined }),
  clearCell: async () => ({ ok: true, value: undefined }),
};
