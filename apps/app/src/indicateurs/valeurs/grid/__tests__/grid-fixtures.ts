import {
  generateCellKey,
  CellKey,
  GridCell,
  GridGroups,
  GridRowGroup,
  IndicateurValuesGridActions,
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
    indicateurId: toIndicateurId(1200 + sectorIndex * 10 + pollutantIndex),
    label: pollutant,
  })),
}));

export const toGridInput = (groups: GridRowGroup[]): GridGroups =>
  Object.fromEntries(
    groups.map((group) => [group.id, { label: group.label, rows: group.rows }])
  );

export const fakeGroupsInput: GridGroups = toGridInput(fakeGroups);

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

const buildCell = (indicateurId: number, year: number): GridCell => {
  const variant = (indicateurId + year) % 4;
  const resultat = trajectoryValue(indicateurId, year);
  if (variant === 0) {
    return { resultat, objectif: Math.round(resultat * 0.9) };
  }
  if (variant === 1 && year !== fakeReferenceYear) {
    return { resultat: null, objectif: null };
  }
  if (variant === 2) {
    return { resultat, objectif: null };
  }
  return { resultat: null, objectif: Math.round(resultat * 1.1) };
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
};
