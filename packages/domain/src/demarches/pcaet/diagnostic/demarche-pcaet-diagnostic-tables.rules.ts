import type { PcaetDiagnosticIndicateurParentConfig } from './demarche-pcaet-diagnostic.schema';

export type PcaetDiagnosticIndicateurTableRow = {
  label: string;
  indicateurDefinitionId: string;
  isOptional: boolean;
  /** `false` quand seuls les objectifs aux horizons sont exigés. */
  isReferenceResultatRequired: boolean;
};

/**
 * Table de saisie d'un volet du diagnostic, telle que l'écran la présente.
 * L'export du diagnostic suit le même découpage.
 */
export type PcaetDiagnosticIndicateurTableLayout = {
  id: string;
  title: string;
  /** Intertitre de la table, `null` hors section. */
  section: string | null;
  isOptional: boolean;
  rows: PcaetDiagnosticIndicateurTableRow[];
};

type ChildConfig = PcaetDiagnosticIndicateurParentConfig['children'][number];

const toTableRow = (
  child: ChildConfig
): PcaetDiagnosticIndicateurTableRow | null => {
  const { indicateurDefinitionId } = child;
  if (indicateurDefinitionId === null || indicateurDefinitionId === '') {
    return null;
  }
  return {
    label: child.label,
    indicateurDefinitionId,
    isOptional: child.optional ?? false,
    isReferenceResultatRequired: child.referenceResultatOptional !== true,
  };
};

/**
 * Lignes saisissables d’un enfant direct : ses feuilles imbriquées, ou lui-même
 * s’il n’a pas d’enfants.
 */
const rowsForChild = (
  child: ChildConfig
): PcaetDiagnosticIndicateurTableRow[] => {
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
export const buildPcaetDiagnosticIndicateurTables = (
  config: PcaetDiagnosticIndicateurParentConfig
): PcaetDiagnosticIndicateurTableLayout[] => {
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

  const tables: PcaetDiagnosticIndicateurTableLayout[] = [];
  const tableByGroup = new Map<string, PcaetDiagnosticIndicateurTableLayout>();
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
