import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { JSX } from 'react';
import { YearColumnHeader } from './year-column-header';
import { yearDragId } from './drag-reorder/use-grid-reorder';
import { Year } from './types';

type GridHeadProps = {
  years: Year[];
  unit: string | null;
  referenceYear: Year | null;
  isGrouped: boolean;
  isReorderable: boolean;
  onReferenceYearChange?: (year: Year) => void;
};

export const GridHead = ({
  years,
  unit,
  referenceYear,
  isGrouped,
  isReorderable,
  onReferenceYearChange,
}: GridHeadProps): JSX.Element => (
  <thead>
    <tr role="row">
      {isGrouped && (
        <th
          scope="col"
          className="sticky left-0 top-0 z-30 border border-grey-3 bg-grey-1 p-2"
        />
      )}
      <th
        scope="col"
        className="sticky top-0 z-20 border border-grey-3 bg-grey-1 p-2"
      />
      <SortableContext
        items={years.map(yearDragId)}
        strategy={horizontalListSortingStrategy}
      >
        {years.map((year) => (
          <YearColumnHeader
            key={year}
            dragId={yearDragId(year)}
            year={year}
            unit={unit}
            isReference={year === referenceYear}
            isReorderable={isReorderable}
            onReferenceYearChange={onReferenceYearChange}
          />
        ))}
      </SortableContext>
    </tr>
  </thead>
);
