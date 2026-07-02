import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@tet/ui';
import { JSX, memo } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { DragHandle } from './drag-handle';
import { Unit } from './unit';
import { Year } from './types';

type YearColumnHeaderProps = {
  dragId: string;
  year: Year;
  unit: string | null;
  isReference: boolean;
};

export const YearColumnHeader = memo(
  ({ dragId, year, unit, isReference }: YearColumnHeaderProps): JSX.Element => {
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
          'sticky top-0 z-20 min-w-[140px] border border-grey-3 bg-grey-1 p-2 text-right font-bold text-primary-9',
          isDragging && 'opacity-50'
        )}
      >
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1">
            <DragHandle
              attributes={attributes}
              listeners={listeners}
              targetLabel={String(year)}
            />
            <span>{isReference ? appLabels.indicateurAnneeReference(year) : year}</span>
          </div>
          {unit ? <Unit>{unit}</Unit> : null}
        </div>
      </th>
    );
  }
);

YearColumnHeader.displayName = 'YearColumnHeader';
