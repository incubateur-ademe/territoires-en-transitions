import { appLabels } from '@/app/labels/catalog';
import { cn, Icon, TableCell, TableHeaderCell, TableRow } from '@tet/ui';
import { JSX } from 'react';
import { valueFieldsForYear } from './cell-editability';
import { Year } from './types';

type GroupParentRowProps = {
  label: string;
  rowCount: number;
  years: Year[];
  referenceYear: Year | null;
  isExpanded: boolean;
  onToggle: () => void;
  showAddYearColumn?: boolean;
};

const defaultCellClassName = 'border-b border-grey-3 bg-primary-2';

/**
 * La ligne de secteur reste visible juste sous l'en-tête tant qu'on lit ses
 * lignes : le décalage vient de la variable posée par `GridFrame` sur la zone
 * de défilement, et la portée du collage est le `<tbody>` du groupe, si bien
 * que le secteur suivant vient la remplacer. `z-20` passe au-dessus des
 * cellules épinglées du corps (`z-10`) tout en restant sous le `<thead>`
 * (`z-40`).
 */
const stickyTopClassName = 'sticky top-[var(--grid-head-height)] z-20';

export const IndicateurParentGroupRow = ({
  label,
  rowCount,
  years,
  referenceYear,
  isExpanded,
  onToggle,
  showAddYearColumn = false,
}: GroupParentRowProps): JSX.Element => {
  const now = new Date().getFullYear();

  return (
    <TableRow className="bg-primary-3 even:bg-primary-3">
      <TableHeaderCell
        scope="rowgroup"
        className={cn(
          stickyTopClassName,
          'left-0 shadow-[1px_0_0_0] shadow-grey-3',
          defaultCellClassName
        )}
      >
        <button
          type="button"
          className="flex min-w-0 items-center gap-1 text-left"
          aria-expanded={isExpanded}
          aria-label={
            isExpanded
              ? appLabels.indicateurReplierGroupe(label)
              : appLabels.indicateurDeplierGroupe(label)
          }
          onClick={onToggle}
        >
          <Icon
            icon={isExpanded ? 'arrow-down-s-line' : 'arrow-right-s-line'}
            className="shrink-0 text-primary-9"
          />
          <span className="font-bold text-primary-9">{label}</span>
          <span className="shrink-0 text-xs font-normal text-grey-8">
            {appLabels.sousSecteur({ count: rowCount })}
          </span>
        </button>
      </TableHeaderCell>
      {years.map((year) => (
        <TableCell
          key={year}
          colSpan={valueFieldsForYear(year, now, referenceYear).length}
          aria-hidden
          className={cn(stickyTopClassName, 'border-r', defaultCellClassName)}
        />
      ))}
      {showAddYearColumn && (
        <TableCell
          className={cn(stickyTopClassName, 'right-0', defaultCellClassName)}
          aria-hidden
        />
      )}
      <TableCell
        aria-hidden
        className={cn(stickyTopClassName, defaultCellClassName)}
      />
    </TableRow>
  );
};
