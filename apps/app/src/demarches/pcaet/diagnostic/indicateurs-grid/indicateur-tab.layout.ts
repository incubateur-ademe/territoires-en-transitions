import type {
  PcaetDiagnostic,
  PcaetDiagnosticIndicateurParentConfig,
} from '@tet/domain/demarches';

export type DiagnosticTableRow = {
  label: string;
  indicateurDefinitionId: string;
  optionalYears: readonly number[] | 'all';
};

export type DiagnosticIndicateurTableLayout = {
  id: string;
  title: string;
  isOptional: boolean;
  rows: DiagnosticTableRow[];
};

/** Configuration de table enrichie des définitions et valeurs du diagnostic. */
export type DiagnosticIndicateurTable = DiagnosticIndicateurTableLayout & {
  indicateurDefinitions: PcaetDiagnostic['indicateurDefinitions'];
  indicateurValeurs: PcaetDiagnostic['indicateurValeurs'];
};

export type DiagnosticIndicateurSection = {
  /** Libellé `groupBy`, ou `null` si les tables ne sont pas regroupées. */
  label: string | null;
  tables: DiagnosticIndicateurTableLayout[];
};

export type DiagnosticIndicateurSectionWithValeurs = {
  label: string | null;
  tables: DiagnosticIndicateurTable[];
};

const identifiantsInTable = (
  table: DiagnosticIndicateurTableLayout
): Set<string> => new Set(table.rows.map((row) => row.indicateurDefinitionId));

export const attachIndicateurDataToTable = (
  table: DiagnosticIndicateurTableLayout,
  {
    definitions,
    valeurs,
  }: {
    definitions: PcaetDiagnostic['indicateurDefinitions'];
    valeurs: PcaetDiagnostic['indicateurValeurs'];
  }
): DiagnosticIndicateurTable => {
  const identifiants = identifiantsInTable(table);
  return {
    ...table,
    indicateurDefinitions: definitions.filter((definition) => {
      const identifiant = definition.identifiantReferentiel;
      return (
        identifiant !== null &&
        identifiant !== undefined &&
        identifiants.has(identifiant)
      );
    }),
    indicateurValeurs: valeurs.filter(({ indicateurDefinition }) => {
      const identifiant = indicateurDefinition?.identifiantReferentiel;
      return (
        identifiant !== null &&
        identifiant !== undefined &&
        identifiants.has(identifiant)
      );
    }),
  };
};

export const attachIndicateurDataToSections = (
  sections: DiagnosticIndicateurSection[],
  {
    definitions,
    valeurs,
  }: {
    definitions: PcaetDiagnostic['indicateurDefinitions'];
    valeurs: PcaetDiagnostic['indicateurValeurs'];
  }
): DiagnosticIndicateurSectionWithValeurs[] =>
  sections.map((section) => ({
    ...section,
    tables: section.tables.map((table) =>
      attachIndicateurDataToTable(table, { definitions, valeurs })
    ),
  }));

type ChildConfig = PcaetDiagnosticIndicateurParentConfig['children'][number];

const toTableRow = (child: ChildConfig): DiagnosticTableRow | null => {
  const { indicateurDefinitionId } = child;
  if (indicateurDefinitionId === null || indicateurDefinitionId === 'TBD') {
    return null;
  }
  return {
    label: child.label,
    indicateurDefinitionId,
    optionalYears: child.optionalYears ?? [],
  };
};

/**
 * Lignes saisissables d’un enfant direct : ses feuilles imbriquées, ou lui-même
 * s’il n’a pas d’enfants.
 */
export const rowsForChild = (child: ChildConfig): DiagnosticTableRow[] => {
  if (child.children !== undefined && child.children.length > 0) {
    return child.children.flatMap((leaf) => {
      const row = toTableRow(leaf);
      return row === null ? [] : [row];
    });
  }

  const row = toTableRow(child);
  return row === null ? [] : [row];
};

/**
 * Découpe un topic indicateur en sections et tables, selon
 * `referenceYearApplyLevel` et `groupBy`.
 *
 * - `parent` : une seule table, année de référence partagée.
 * - `child` : une table par enfant direct, chacune avec sa propre année de
 *   référence. Si les enfants portent un `groupBy`, une section par groupe.
 */
export const buildIndicateurValeursTableSections = (
  config: PcaetDiagnosticIndicateurParentConfig
): DiagnosticIndicateurSection[] => {
  if (config.referenceYearApplyLevel === 'parent') {
    const rows = config.children.flatMap(rowsForChild);
    if (rows.length === 0) {
      return [];
    }
    return [
      {
        label: null,
        tables: [
          {
            id: config.code,
            title: config.label,
            rows,
            isOptional: config.optional ?? false,
          },
        ],
      },
    ];
  }

  const tables = config.children.flatMap((child, index) => {
    const rows = rowsForChild(child);
    if (rows.length === 0) {
      return [];
    }
    return [
      {
        id: `${config.code}:${child.indicateurDefinitionId}:${index}`,
        title: child.label,
        rows,
        groupBy: child.groupBy ?? null,
        isOptional: child.optionalYears === 'all',
      },
    ];
  });

  if (tables.length === 0) {
    return [];
  }

  const hasGroupBy = tables.some((table) => table.groupBy !== null);
  if (!hasGroupBy) {
    return [
      {
        label: null,
        tables: tables.map(({ groupBy: _groupBy, ...table }) => table),
      },
    ];
  }

  const sections: DiagnosticIndicateurSection[] = [];
  const indexByLabel = new Map<string | null, number>();
  for (const { groupBy, ...table } of tables) {
    const existing = indexByLabel.get(groupBy);
    if (existing === undefined) {
      indexByLabel.set(groupBy, sections.length);
      sections.push({ label: groupBy, tables: [table] });
    } else {
      sections[existing].tables.push(table);
    }
  }
  return sections.filter((section) => section.tables.length > 0);
};
