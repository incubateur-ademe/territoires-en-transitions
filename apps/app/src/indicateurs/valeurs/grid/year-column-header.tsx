import { appLabels } from '@/app/labels/catalog';
import { cn, Icon } from '@tet/ui';
import { JSX, memo, useState } from 'react';
import { ReferenceYearEditor } from './reference-year/reference-year-editor';
import { RemoveYearConfirmModal } from './remove-year-confirm-modal';
import { Year } from './types';

type YearColumnHeaderProps = {
  year: Year;
  isReference: boolean;
  onReferenceYearChange?: (year: Year) => void;
  onRemoveYear?: (year: Year) => void;
  canRemove?: boolean;
  hasValues?: boolean;
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

type YearRemoveButtonProps = {
  year: Year;
  hasValues: boolean;
  onRemoveYear: (year: Year) => void;
};

const YearRemoveButton = ({
  year,
  hasValues,
  onRemoveYear,
}: YearRemoveButtonProps): JSX.Element => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleClick = (): void => {
    if (hasValues) {
      setIsConfirmOpen(true);
      return;
    }
    onRemoveYear(year);
  };

  return (
    <>
      <button
        type="button"
        aria-label={appLabels.indicateurRetirerAnnee(year)}
        onClick={handleClick}
        className="inline-flex h-6 w-6 items-center justify-center rounded text-grey-6 outline-none hover:bg-error-1 hover:text-error focus:ring-2 focus:ring-inset focus:ring-primary-5"
      >
        <Icon icon="close-line" size="sm" aria-hidden />
      </button>
      <RemoveYearConfirmModal
        isOpen={isConfirmOpen}
        onConfirm={() => {
          setIsConfirmOpen(false);
          onRemoveYear(year);
        }}
        onClose={() => setIsConfirmOpen(false)}
      />
    </>
  );
};

export const YearColumnHeader = memo(
  ({
    year,
    isReference,
    onReferenceYearChange,
    onRemoveYear,
    canRemove = false,
    hasValues = false,
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
          <div className="flex items-center gap-1">
            <YearHeaderLabel
              year={year}
              isReference={isReference}
              onReferenceYearChange={onReferenceYearChange}
            />
            {canRemove && onRemoveYear !== undefined ? (
              <YearRemoveButton
                year={year}
                hasValues={hasValues}
                onRemoveYear={onRemoveYear}
              />
            ) : null}
          </div>
        </div>
      </th>
    );
  }
);

YearColumnHeader.displayName = 'YearColumnHeader';
