import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { JSX } from 'react';
import { yearDragId } from './drag-reorder/use-grid-reorder';
import { Year } from './types';
import { Unit } from './unit';
import { YearColumnHeader } from './year-column-header';

type GridHeadProps = {
  years: Year[];
  title: string | null;
  unit: string | null;
  referenceYear: Year | null;
  isReorderable: boolean;
  onReferenceYearChange?: (year: Year) => void;
};

const CornerHeader = ({
  title,
  unit,
}: {
  title: string;
  unit: string | null;
}): JSX.Element => (
  <div className="flex flex-col text-left">
    <span className="font-bold text-primary-9">{title}</span>
    {unit !== null ? <Unit>{unit}</Unit> : null}
  </div>
);

export const GridHead = ({
  years,
  title,
  unit,
  referenceYear,
  onReferenceYearChange,
}: GridHeadProps): JSX.Element => {
  return (
    <thead>
      <tr role="row">
        <th scope="col" className="sticky left-0 top-0 z-30 bg-grey-1 p-2">
          {title !== null ? <CornerHeader title={title} unit={unit} /> : null}
        </th>
        <SortableContext
          items={years.map(yearDragId)}
          strategy={horizontalListSortingStrategy}
        >
          {years.map((year) => (
            <YearColumnHeader
              key={year}
              year={year}
              isReference={year === referenceYear}
              onReferenceYearChange={onReferenceYearChange}
            />
          ))}
        </SortableContext>
      </tr>
    </thead>
  );
};
