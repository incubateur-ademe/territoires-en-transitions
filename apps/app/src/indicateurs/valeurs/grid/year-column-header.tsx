import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@tet/ui';
import { JSX, memo } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { DragHandle } from './drag-handle';
import { ReferenceYearEditor } from './reference-year/reference-year-editor';
import { Unit } from './unit';
import { Year } from './types';

type YearColumnHeaderProps = {
  dragId: string;
  year: Year;
  unit: string | null;
  isReference: boolean;
  onReferenceYearChange?: (year: Year) => void;
};

type YearHeaderLabelProps = Pick<
  YearColumnHeaderProps,
  'year' | 'isReference' | 'onReferenceYearChange'
>;

const YearHeaderLabel = ({
  year,
  isReference,
  onReferenceYearChange,
}: YearHeaderLabelProps): JSX.Element => {
  if (!isReference) {
    return <span>{year}</span>;
  }
  if (onReferenceYearChange === undefined) {
    return <span>{appLabels.indicateurAnneeReference(year)}</span>;
  }
  return (
    <ReferenceYearEditor
      year={year}
      onReferenceYearChange={onReferenceYearChange}
    />
  );
};

export const YearColumnHeader = memo(
  ({
    dragId,
    year,
    unit,
    isReference,
    onReferenceYearChange,
  }: YearColumnHeaderProps): JSX.Element => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
      useSortable({
        id: dragId,
        attributes: { roleDescription: appLabels.indicateurColonneAnnee },
      });
    return (
      <th
        ref={setNodeRef}
        scope="col"
        role="columnheader"
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className={cn(
          'sticky top-0 z-20 min-w-[220px] border border-grey-3 bg-grey-1 p-2 text-right font-bold text-primary-9',
          isDragging && 'opacity-50'
        )}
      >
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1">
            <DragHandle
              attributes={attributes}
              listeners={listeners}
              targetLabel={
                isReference ? appLabels.indicateurAnneeReference(year) : String(year)
              }
            />
            <YearHeaderLabel
              year={year}
              isReference={isReference}
              onReferenceYearChange={onReferenceYearChange}
            />
          </div>
          {unit ? <Unit>{unit}</Unit> : null}
        </div>
      </th>
    );
  }
);

YearColumnHeader.displayName = 'YearColumnHeader';
