import type { SousIndicateurTableRow } from './sous-indicateurs-table.rules';

export const toggleRowKey = ({
  expandedRowKeys,
  rowKey,
}: {
  expandedRowKeys: ReadonlySet<string>;
  rowKey: string;
}): ReadonlySet<string> => {
  if (expandedRowKeys.has(rowKey)) {
    return new Set([...expandedRowKeys].filter((key) => key !== rowKey));
  }
  return new Set([...expandedRowKeys, rowKey]);
};

export const listVisibleRows = ({
  rows,
  expandedRowKeys,
}: {
  rows: readonly SousIndicateurTableRow[];
  expandedRowKeys: ReadonlySet<string>;
}): SousIndicateurTableRow[] =>
  rows.reduce<{
    visibleRowKeys: ReadonlySet<string>;
    visibleRows: SousIndicateurTableRow[];
  }>(
    ({ visibleRowKeys, visibleRows }, row) => {
      const isVisible =
        row.parentRowKey === null ||
        (visibleRowKeys.has(row.parentRowKey) &&
          expandedRowKeys.has(row.parentRowKey));
      return isVisible
        ? {
            visibleRowKeys: new Set([...visibleRowKeys, row.rowKey]),
            visibleRows: [...visibleRows, row],
          }
        : { visibleRowKeys, visibleRows };
    },
    { visibleRowKeys: new Set(), visibleRows: [] }
  ).visibleRows;
