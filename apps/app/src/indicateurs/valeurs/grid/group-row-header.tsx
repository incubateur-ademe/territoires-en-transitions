import { JSX, memo } from 'react';
import { DragHandle } from './drag-handle';

export const GroupRowHeader = memo(
  ({ label, rowSpan }: { label: string; rowSpan: number }): JSX.Element => (
    <th
      scope="rowgroup"
      rowSpan={rowSpan}
      className="sticky left-0 z-10 border border-grey-3 bg-grey-1 p-2 align-top text-left font-bold text-primary-9"
    >
      <div className="flex items-center gap-1">
        <DragHandle />
        {label}
      </div>
    </th>
  )
);

GroupRowHeader.displayName = 'GroupRowHeader';
