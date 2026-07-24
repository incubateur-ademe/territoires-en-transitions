import { JSX } from 'react';
import { AddYearColumnHeader } from './add-year-column-header';
import { columnHasValues } from './column-has-values';
import { CellKey, GridCell, GridRowGroup, Year } from './types';
import { Unit } from './unit';
import { YearColumnHeader } from './year-column-header';

type GridHeadProps = {
  years: Year[];
  title: string | null;
  unit: string | null;
  referenceYear: Year | null;
  isReorderable: boolean;
  cells: Map<CellKey, GridCell>;
  groups: GridRowGroup[];
  onReferenceYearChange?: (year: Year) => void;
  onAddYear?: (year: Year) => void;
  onRemoveYear?: (year: Year) => void;
  canRemoveYear?: (year: Year) => boolean;
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
  cells,
  groups,
  onReferenceYearChange,
  onAddYear,
  onRemoveYear,
  canRemoveYear,
}: GridHeadProps): JSX.Element => {
  const indicateurIds = groups.flatMap((group) =>
    group.rows.map((row) => row.indicateurId)
  );

  return (
    <thead>
      <tr role="row">
        <th scope="col" className="sticky left-0 top-0 z-30 bg-grey-1 p-2">
          {title !== null ? <CornerHeader title={title} unit={unit} /> : null}
        </th>
        {years.map((year) => {
          const canRemove =
            onRemoveYear !== undefined &&
            (canRemoveYear?.(year) ?? year !== referenceYear);
          const hasValues = columnHasValues({ cells, year, indicateurIds });
          return (
            <YearColumnHeader
              key={year}
              year={year}
              isReference={year === referenceYear}
              onReferenceYearChange={onReferenceYearChange}
              onRemoveYear={onRemoveYear}
              canRemove={canRemove}
              hasValues={hasValues}
            />
          );
        })}
        {onAddYear !== undefined ? (
          <AddYearColumnHeader years={years} onAddYear={onAddYear} />
        ) : null}
      </tr>
    </thead>
  );
};
