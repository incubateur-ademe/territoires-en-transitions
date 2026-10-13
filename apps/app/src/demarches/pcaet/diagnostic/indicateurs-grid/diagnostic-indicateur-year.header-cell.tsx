import { appLabels } from '@/app/labels/catalog';
import { Badge, cn, Tooltip } from '@tet/ui';
import { JSX, memo } from 'react';
import { IndicateurValeurPeriodeHeaderCell } from '../../../../indicateurs/valeurs/grid/indicateur-valeur-periode.header-cell';
import { ReferenceYearField } from '../../../../indicateurs/valeurs/grid/reference-year/reference-year-field';

type YearColumnHeaderProps = {
  year: number | null;
  colSpan?: number;
  isReference?: boolean;
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

export const DiagnosticIndicateurYearHeaderCell = memo(
  ({
    year,
    colSpan = 1,
    isReference = false,
    displayedYears,
    onReferenceYearChange,
  }: YearColumnHeaderProps): JSX.Element => {
    return (
      <IndicateurValeurPeriodeHeaderCell
        colSpan={colSpan}
        className={cn(isReference && 'w-60 min-w-48')}
        label={
          <YearHeaderLabel
            year={year}
            isReference={isReference}
            displayedYears={displayedYears}
            onReferenceYearChange={onReferenceYearChange}
          />
        }
      />
    );
  }
);

DiagnosticIndicateurYearHeaderCell.displayName = 'YearColumnHeader';
