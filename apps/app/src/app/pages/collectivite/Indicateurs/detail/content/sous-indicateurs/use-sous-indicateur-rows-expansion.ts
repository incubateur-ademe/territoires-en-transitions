import {
  listVisibleRows,
  toggleRowKey,
} from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-table-expansion.rules';
import type { SousIndicateurTableRow } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-table.rules';
import { useMemo, useState } from 'react';

type SousIndicateurRowsExpansion = Readonly<{
  visibleRows: readonly SousIndicateurTableRow[];
  isExpanded: (rowKey: string) => boolean;
  toggle: (rowKey: string) => void;
}>;

export const useSousIndicateurRowsExpansion = (
  rows: readonly SousIndicateurTableRow[]
): SousIndicateurRowsExpansion => {
  const [expandedRowKeys, setExpandedRowKeys] = useState<ReadonlySet<string>>(
    new Set()
  );
  const visibleRows = useMemo(
    () => listVisibleRows({ rows, expandedRowKeys }),
    [rows, expandedRowKeys]
  );

  return {
    visibleRows,
    isExpanded: (rowKey) => expandedRowKeys.has(rowKey),
    toggle: (rowKey) =>
      setExpandedRowKeys((previous) =>
        toggleRowKey({ expandedRowKeys: previous, rowKey })
      ),
  };
};
