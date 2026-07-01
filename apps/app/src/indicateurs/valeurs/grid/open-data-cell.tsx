import { JSX, memo } from 'react';
import { ProvenanceBadge } from './provenance-badge';
import { SourceInfo } from './types';

export const OpenDataCell = memo(
  ({ value, source }: { value: number; source: SourceInfo }): JSX.Element => (
    <div className="flex h-full items-center justify-between gap-1 bg-success-2 px-3 text-sm">
      <ProvenanceBadge source={source} />
      <span className="text-success-1">{value}</span>
    </div>
  )
);

OpenDataCell.displayName = 'OpenDataCell';
