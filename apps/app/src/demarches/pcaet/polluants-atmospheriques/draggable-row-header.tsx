'use client';

import { Icon, cn } from '@tet/ui';
import { JSX } from 'react';
import { ReorderHandlers } from './use-reorder';

export const DraggableRowHeader = ({
  label,
  className,
  rowSpan,
  handlers,
}: {
  label: string;
  className?: string;
  rowSpan?: number;
  handlers: ReorderHandlers;
}): JSX.Element => (
  <th
    scope="row"
    rowSpan={rowSpan}
    {...handlers}
    className={cn(
      'cursor-grab select-none border border-grey-3 p-2 text-left text-primary-9',
      className
    )}
  >
    <div className="flex items-center gap-1">
      <Icon icon="draggable" size="xs" className="text-grey-5" />
      {label}
    </div>
  </th>
);
