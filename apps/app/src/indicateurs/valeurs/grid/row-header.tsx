import { JSX, memo } from 'react';
import { DragHandle } from './drag-handle';

export const RowHeader = memo(
  ({ label }: { label: string }): JSX.Element => (
    <th
      scope="row"
      className="border border-grey-3 bg-white p-2 text-left font-medium text-primary-9"
    >
      <div className="flex items-center gap-1">
        <DragHandle />
        {label}
      </div>
    </th>
  )
);

RowHeader.displayName = 'RowHeader';
