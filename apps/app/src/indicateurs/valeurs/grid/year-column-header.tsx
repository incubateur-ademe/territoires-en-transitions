import { appLabels } from '@/app/labels/catalog';
import { cn } from '@tet/ui';
import { JSX, memo } from 'react';
import { ReferenceYearEditor } from './reference-year/reference-year-editor';
import { Year } from './types';

type YearColumnHeaderProps = {
  year: Year;
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
    year,

    isReference,
    onReferenceYearChange,
  }: YearColumnHeaderProps): JSX.Element => {
    return (
      <th
        scope="col"
        role="columnheader"
        className={cn(
          'sticky top-0 z-20 min-w-[220px] bg-grey-1 py-2 pl-2 pr-3 text-right font-bold text-primary-9'
        )}
      >
        <div className="flex flex-col items-center">
          <YearHeaderLabel
            year={year}
            isReference={isReference}
            onReferenceYearChange={onReferenceYearChange}
          />
        </div>
      </th>
    );
  }
);

YearColumnHeader.displayName = 'YearColumnHeader';
