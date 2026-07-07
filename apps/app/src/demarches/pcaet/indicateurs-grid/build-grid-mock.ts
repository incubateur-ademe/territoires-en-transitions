import {
  CellKey,
  generateCellKey,
  GridCell,
  GridGroups,
  GridRow,
  OpenDataSource,
  toIndicateurId,
  toSourceId,
  toYear,
  Year,
} from '@/app/indicateurs/valeurs/grid/types';

export type VoletGridRow = { code: string; label: string };
export type VoletGridGroup = { code: string; label: string; rows: VoletGridRow[] };
export type VoletGridStructure = {
  identifiantPrefix: string;
  unit: string;
  horizonYears: number[];
  groups: VoletGridGroup[];
};

export type DemarcheGridMock = {
  groups: GridGroups;
  years: Year[];
  referenceYear: Year;
  cells: Map<CellKey, GridCell>;
  unit: string;
};

const OPEN_DATA_SOURCES = [
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
  {
    sourceId: 'snbc',
    libelle: 'SNBC',
    methodologie: 'Stratégie Nationale Bas-Carbone',
    dateVersion: '2025-01-01',
  },
];

const identifiantToIndicateurId = (identifiant: string): number =>
  [...identifiant].reduce(
    (hash, char) => (hash * 33 + char.charCodeAt(0)) % 100_000_000,
    5381
  );

const leafIdentifiant = (
  structure: VoletGridStructure,
  group: VoletGridGroup,
  row: VoletGridRow
): string => `${structure.identifiantPrefix}.${group.code}${row.code}`;

const horizonFactor = (yearsAhead: number): number => {
  if (yearsAhead <= 0) {
    return 1;
  }
  if (yearsAhead <= 6) {
    return 0.85;
  }
  if (yearsAhead <= 12) {
    return 0.65;
  }
  return 0.4;
};

const coveringSourcesFor = (
  target: number,
  sourceCount: number
): OpenDataSource[] =>
  OPEN_DATA_SOURCES.slice(0, sourceCount).map((source, index) => ({
    sourceId: toSourceId(source.sourceId),
    libelle: source.libelle,
    value: Math.round(target + index * 8),
    methodologie: source.methodologie,
    dateVersion: source.dateVersion,
  }));

const buildCell = (
  indicateurId: number,
  base: number,
  year: number,
  currentYear: number
): GridCell => {
  const target = Math.round(base * horizonFactor(year - currentYear));
  const coveringSources = coveringSourcesFor(
    target,
    2 + ((indicateurId + year) % 3)
  );
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
  if (variant === 1 && year !== currentYear) {
    return { kind: 'user-data', value: null, coveringSources };
  }
  return {
    kind: 'user-data',
    value: target,
    valueId: indicateurId,
    coveringSources: variant === 3 ? coveringSources : [],
  };
};

export const buildDemarcheGridMock = (
  structure: VoletGridStructure,
  currentYear: number
): DemarcheGridMock => {
  const referenceYear = toYear(currentYear);
  const years = [currentYear, ...structure.horizonYears].map(toYear);

  const groups: GridGroups = Object.fromEntries(
    structure.groups.map((group) => [
      `${structure.identifiantPrefix}.${group.code}`,
      {
        label: group.label,
        rows: group.rows.map(
          (row): GridRow => ({
            indicateurId: toIndicateurId(
              identifiantToIndicateurId(leafIdentifiant(structure, group, row))
            ),
            label: row.label,
          })
        ),
      },
    ])
  );

  const cells = new Map<CellKey, GridCell>(
    structure.groups.flatMap((group, groupIndex) =>
      group.rows.flatMap((row, rowIndex) => {
        const indicateurId = identifiantToIndicateurId(
          leafIdentifiant(structure, group, row)
        );
        const base = 200 + groupIndex * 50 + rowIndex * 20;
        return years.map((year): [CellKey, GridCell] => [
          generateCellKey(toIndicateurId(indicateurId), year),
          buildCell(indicateurId, base, year, currentYear),
        ]);
      })
    )
  );

  return { groups, years, referenceYear, cells, unit: structure.unit };
};
