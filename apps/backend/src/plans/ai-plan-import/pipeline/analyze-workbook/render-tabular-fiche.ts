import { uniq, upperFirst } from 'es-toolkit';
import { sheetMarker } from '../document/document-page';
import { TabularPlanSheet } from './build-tabular-actions';
import {
  areCompatibleRoles,
  ColumnRole,
  describeColumnRole,
  matchColumnLabel,
} from './match-column-label';
import { readDistinctValues } from './profile-columns';
import { collapseSpaces } from './sheet-grid';
import { ColumnLayout, FicheBlock, sousActionRowsOf } from './sheet-layout';

// La structure est dans l'en-tête de la fiche ; une colonne vide n'a rien à dire.
const UNRENDERED_ROLES: ReadonlySet<ColumnRole> = new Set([
  'hierarchie',
  'titre',
  'numero',
  'sousAction',
  'vide',
]);

/**
 * Le texte d'une fiche tel que le tableur le donne, sans les valeurs
 * fusionnées répétées : ce que lisent les secteurs et la revue d'ensemble.
 */
export const renderTabularFiche = (
  sheet: TabularPlanSheet,
  fiche: FicheBlock
): string => {
  const { grid, layout, axisPrefix } = sheet;
  const path = [...axisPrefix, ...fiche.path];
  const lines = [
    sheetMarker(grid.name),
    ...(path.length > 0 ? [`Axes : ${path.join(' > ')}`] : []),
    fiche.numero
      ? `Fiche n°${fiche.numero} : ${fiche.titre}`
      : `Fiche : ${fiche.titre}`,
  ];
  if (layout.form) {
    for (const { label, role, values } of layout.form) {
      if (role !== 'titre' && role !== 'hierarchie' && values.length > 0) {
        lines.push(`${label} : ${values.map(collapseSpaces).join(' ; ')}`);
      }
    }
    return lines.join('\n');
  }

  const attributes = layout.columns.filter(
    ({ role }) => !UNRENDERED_ROLES.has(role)
  );
  const { valueAt, sousActionCol } = layout;
  const sousActionRows = sousActionRowsOf(layout, fiche);
  const ficheRows = fiche.rows.filter((row) => !sousActionRows.includes(row));

  for (const column of attributes) {
    const rows = column.level === 'fiche' ? fiche.rows : ficheRows;
    const values = uniq(
      readDistinctValues(grid, valueAt, column.col, rows).map(collapseSpaces)
    );
    if (values.length > 0 && !isCrossCalendar(column)) {
      lines.push(`${labelOf(column)} : ${values.join(' ; ')}`);
    }
  }
  const ficheYears = yearsOf(
    sheet,
    attributes.filter(({ level }) => level === 'fiche'),
    fiche.rows
  );
  if (ficheYears.length > 0) {
    lines.push(`Calendrier : ${ficheYears.join(', ')}`);
  }
  if (sousActionRows.length > 0) {
    lines.push('Sous-actions :');
    for (const row of sousActionRows) {
      const rowAttributes = attributes.filter(({ level }) => level === 'row');
      const years = yearsOf(sheet, rowAttributes, [row]);
      const details = [
        ...rowAttributes
          .filter((column) => !isCrossCalendar(column))
          .map((column) => [column, valueAt(row, column.col)] as const)
          .filter(([, value]) => value !== '')
          .map(
            ([column, value]) => `${labelOf(column)} : ${collapseSpaces(value)}`
          ),
        ...(years.length > 0 ? [`calendrier : ${years.join(', ')}`] : []),
      ];
      lines.push(
        `- ${collapseSpaces(valueAt(row, sousActionCol ?? 0))}${
          details.length > 0 ? ` (${details.join(' ; ')})` : ''
        }`
      );
    }
  }
  return lines.join('\n');
};

const isCrossCalendar = (column: ColumnLayout): boolean =>
  column.role === 'calendrier' && column.year !== undefined;

/** Les années cochées sur ces rangées. */
const yearsOf = (
  { layout }: TabularPlanSheet,
  columns: ColumnLayout[],
  rows: number[]
): number[] =>
  [
    ...new Set(
      columns
        .filter(isCrossCalendar)
        .filter(({ col }) =>
          rows.some((row) => layout.valueAt(row, col) !== '')
        )
        .map(({ year }) => year ?? 0)
    ),
  ].sort((a, b) => a - b);

/** Le libellé de la colonne, sauf quand il contredit son contenu (« PILOTE » au-dessus des sous-actions). */
const labelOf = (column: ColumnLayout): string => {
  if (column.role === 'autre') {
    return column.label || `Colonne ${column.letter}`;
  }
  const labelRole = matchColumnLabel(column.label);
  if (column.label && labelRole && areCompatibleRoles(labelRole, column.role)) {
    return column.label;
  }
  return upperFirst(describeColumnRole(column.role));
};
