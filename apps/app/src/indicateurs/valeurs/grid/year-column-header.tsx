import { appLabels } from '@/app/labels/catalog';
import { Button, cn } from '@tet/ui';
import { JSX, memo, useState } from 'react';
import { ReferenceYearEditor } from './reference-year/reference-year-editor';
import { RemoveYearConfirmModal } from './remove-year-confirm-modal';
import { Year } from './types';

type YearColumnHeaderProps = {
  year: Year;
  colSpan?: number;
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

type RemoveYearButtonProps = {
  year: Year;
  hasValues: boolean;
  onRemoveYear: (year: Year) => void;
};

const RemoveYearButton = ({
  year,
  hasValues,
  onRemoveYear,
}: RemoveYearButtonProps): JSX.Element => {
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
      <Button
        aria-label={appLabels.indicateurRetirerAnnee(year)}
        title={appLabels.indicateurRetirerAnnee(year)}
        onClick={handleClick}
        icon="close-line"
        size="xs"
        variant="white"
      />
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
    colSpan = 1,
    isReference,
    onReferenceYearChange,
    onRemoveYear,
    canRemove = false,
    hasValues = false,
  }: YearColumnHeaderProps): JSX.Element => {
    return (
      <th
        scope="col"
        colSpan={colSpan}
        role="columnheader"
        className={cn(
          'sticky top-0 z-20 bg-grey-1 py-2 pl-2 pr-3 text-right font-bold text-primary-9',
          isReference || !hasValues
            ? 'min-w-[220px]'
            : 'w-1 min-w-0 whitespace-nowrap'
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
              <RemoveYearButton
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
