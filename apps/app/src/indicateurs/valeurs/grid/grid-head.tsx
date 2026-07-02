import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { JSX } from 'react';
import { YearColumnHeader } from './year-column-header';
import { yearDragId } from './use-grid-reorder';
import { Year } from './types';

export const GridHead = ({
  years,
  unit,
  referenceYear,
}: {
  years: Year[];
  unit: string | null;
  referenceYear: Year | null;
}): JSX.Element => (
  <thead>
    <tr role="row">
      <th
        scope="col"
        className="sticky left-0 top-0 z-30 border border-grey-3 bg-grey-1 p-2"
      />
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
          />
        ))}
      </SortableContext>
    </tr>
  </thead>
);
