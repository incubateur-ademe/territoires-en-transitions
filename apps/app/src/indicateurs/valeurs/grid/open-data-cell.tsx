import { JSX, memo, ReactNode } from 'react';
import { ProvenanceBadge } from './provenance-badge';
import { generateCellKey, CellKey, IndicateurId, SourceInfo, Year } from './types';

type FocusableCellProps = {
  cellId: CellKey;
  ariaLabel: string;
  children: ReactNode;
};

const FocusableCell = ({
  cellId,
  ariaLabel,
  children,
}: FocusableCellProps): JSX.Element => (
  <div
    data-cell-id={cellId}
    aria-label={ariaLabel}
    className="flex h-full items-center justify-between gap-1 bg-success-2 px-3 text-sm outline-none focus:ring-2 focus:ring-inset focus:ring-primary-5"
  >
    {children}
  </div>
);

type OpenDataCellProps = {
  value: number;
  source: SourceInfo;
  ariaLabel: string;
  indicateurId: IndicateurId;
  year: Year;
};

export const OpenDataCell = memo(
  ({
    value,
    source,
    ariaLabel,
    indicateurId,
    year,
  }: OpenDataCellProps): JSX.Element => (
    <FocusableCell cellId={generateCellKey(indicateurId, year)} ariaLabel={ariaLabel}>
      <ProvenanceBadge source={source} />
      <span className="text-success-1">{value}</span>
    </FocusableCell>
  )
);

OpenDataCell.displayName = 'OpenDataCell';
