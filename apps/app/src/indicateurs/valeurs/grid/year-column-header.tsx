import { JSX, memo } from 'react';
import { DragHandle } from './drag-handle';
import { Year } from './types';

type YearColumnHeaderProps = {
  year: Year;
  unit: string | null;
  isReference: boolean;
};

export const YearColumnHeader = memo(
  ({ year, unit, isReference }: YearColumnHeaderProps): JSX.Element => (
    <th
      scope="col"
      className="sticky top-0 z-20 min-w-[140px] border border-grey-3 bg-grey-1 p-2 text-right font-bold text-primary-9"
    >
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-1">
          <DragHandle />
          <span>{isReference ? `réf. ${year}` : year}</span>
        </div>
        {unit ? (
          <span className="text-xs font-normal text-grey-5">{unit}</span>
        ) : null}
      </div>
    </th>
  )
);

YearColumnHeader.displayName = 'YearColumnHeader';
