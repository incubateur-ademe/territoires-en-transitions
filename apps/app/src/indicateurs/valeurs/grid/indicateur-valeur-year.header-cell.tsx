import { appLabels } from '@/app/labels/catalog';
import { Badge, cn, TableHeaderCell, Tooltip } from '@tet/ui';
import { JSX, memo } from 'react';
import { ReferenceYearField } from './reference-year/reference-year-field';

type YearColumnHeaderProps = {
  year: number | null;
  colSpan?: number;
  isReference: boolean;
  displayedYears?: readonly number[];
  onReferenceYearChange?: (year: number) => void;
};

type YearHeaderLabelProps = Pick<
  YearColumnHeaderProps,
  'year' | 'isReference' | 'displayedYears' | 'onReferenceYearChange'
>;

const YearHeaderLabel = ({
  year,
  isReference,
  displayedYears = [],
  onReferenceYearChange,
}: YearHeaderLabelProps): JSX.Element => {
  if (isReference) {
    return (
      <>
        <Tooltip label={appLabels.indicateurAnneeReferenceChamp}>
          <Badge
            title={appLabels.indicateurAnneeReferenceAbbreviation}
            size="xs"
            className="mr-1"
          />
        </Tooltip>
        {onReferenceYearChange !== undefined ? (
          <ReferenceYearField
            year={year}
            years={displayedYears}
            onReferenceYearChange={onReferenceYearChange}
          />
        ) : (
          <span>
            {year === null
              ? appLabels.indicateurAnneeReferencePlaceholder
              : year}
          </span>
        )}
      </>
    );
  }

  if (year === null) {
    return <span>{appLabels.indicateurAnneeReferencePlaceholder}</span>;
  }

  return <span>{year}</span>;
};

export const IndicateurValeurYearHeaderCell = memo(
  ({
    year,
    colSpan = 1,
    isReference,
    displayedYears,
    onReferenceYearChange,
  }: YearColumnHeaderProps): JSX.Element => {
    return (
      <TableHeaderCell
        colSpan={colSpan}
        align="center"
        className={cn(
          'sticky top-0 z-[2] align-middle border-r border-grey-3 bg-white text-base font-bold',
          isReference || colSpan === 2 ? 'w-60 min-w-48' : 'w-32 min-w-24'
        )}
      >
        <div className="flex items-center gap-1 justify-center align-middle">
          <YearHeaderLabel
            year={year}
            isReference={isReference}
            displayedYears={displayedYears}
            onReferenceYearChange={onReferenceYearChange}
          />
        </div>
      </TableHeaderCell>
    );
  }
);

IndicateurValeurYearHeaderCell.displayName = 'YearColumnHeader';
