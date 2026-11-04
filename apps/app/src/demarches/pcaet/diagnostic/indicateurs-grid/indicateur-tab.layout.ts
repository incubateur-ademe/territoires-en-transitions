import type {
  PcaetDiagnostic,
  PcaetDiagnosticIndicateurParentConfig,
} from '@tet/domain/demarches';

type DiagnosticTableRow = {
  label: string;
  indicateurDefinitionId: string;
  isOptional: boolean;
};

type DiagnosticIndicateurTableLayout = {
  id: string;
  title: string;
  /** Intertitre de la table, `null` hors section. */
  section: string | null;
  isOptional: boolean;
  rows: DiagnosticTableRow[];
};

/** Configuration de table enrichie des définitions et valeurs du diagnostic. */
export type DiagnosticIndicateurTable = DiagnosticIndicateurTableLayout & {
  indicateurDefinitions: PcaetDiagnostic['indicateurDefinitions'];
  indicateurValeurs: PcaetDiagnostic['indicateurValeurs'];
};

const identifiantsInTable = (
  table: DiagnosticIndicateurTableLayout
): Set<string> => new Set(table.rows.map((row) => row.indicateurDefinitionId));

const attachIndicateurDataToTable = (
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

export const attachIndicateurDataToTables = (
  tables: DiagnosticIndicateurTableLayout[],
  data: {
    definitions: PcaetDiagnostic['indicateurDefinitions'];
    valeurs: PcaetDiagnostic['indicateurValeurs'];
  }
): DiagnosticIndicateurTable[] =>
  tables.map((table) => attachIndicateurDataToTable(table, data));

type ChildConfig = PcaetDiagnosticIndicateurParentConfig['children'][number];

const toTableRow = (child: ChildConfig): DiagnosticTableRow | null => {
  const { indicateurDefinitionId } = child;
  if (indicateurDefinitionId === null || indicateurDefinitionId === '') {
    return null;
  }
  return {
    label: child.label,
    indicateurDefinitionId,
    isOptional: child.optional ?? false,
  };
};

/**
 * Lignes saisissables d’un enfant direct : ses feuilles imbriquées, ou lui-même
 * s’il n’a pas d’enfants.
 */
const rowsForChild = (child: ChildConfig): DiagnosticTableRow[] => {
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
 * Découpe un topic indicateur en tables, selon `referenceYearApplyLevel` et
 * `groupBy`.
 *
 * - `parent` : une seule table, année de référence partagée.
 * - `child` : une table par enfant direct, chacune avec sa propre année de
 *   référence. Les enfants d'une même section et d'un même `groupBy`
 *   partagent une table, titrée par le groupe.
 */
export const buildIndicateurValeursTables = (
  config: PcaetDiagnosticIndicateurParentConfig
): DiagnosticIndicateurTableLayout[] => {
  if (config.referenceYearApplyLevel === 'parent') {
    const rows = config.children.flatMap(rowsForChild);
    if (rows.length === 0) {
      return [];
    }
    return [
      {
        id: config.code,
        title: config.label,
        section: null,
        rows,
        isOptional: config.optional ?? false,
      },
    ];
  }

  const tables: DiagnosticIndicateurTableLayout[] = [];
  const tableByGroup = new Map<string, DiagnosticIndicateurTableLayout>();
  config.children.forEach((child, index) => {
    const rows = rowsForChild(child);
    if (rows.length === 0) {
      return;
    }
    const isOptional = child.optional ?? false;
    const section = child.section ?? null;
    const { groupBy } = child;
    // Un même groupe peut revenir dans deux sections (ex. « Chaleur »).
    const groupKey = `${section ?? ''}:${groupBy}`;
    const existing =
      groupBy === undefined ? undefined : tableByGroup.get(groupKey);
    if (existing !== undefined) {
      existing.rows.push(...rows);
      existing.isOptional = existing.isOptional && isOptional;
      return;
    }

    const table =
      groupBy === undefined
        ? {
            id: `${config.code}:${child.indicateurDefinitionId}:${index}`,
            title: child.label,
            section,
            rows,
            isOptional,
          }
        : {
            id: `${config.code}:${groupKey}`,
            title: groupBy,
            section,
            rows,
            isOptional,
          };
    if (groupBy !== undefined) {
      tableByGroup.set(groupKey, table);
    }
    tables.push(table);
  });
  return tables;
};
