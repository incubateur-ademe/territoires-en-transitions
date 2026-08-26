import { appLabels } from '@/app/labels/catalog';
import { Badge, Button, cn, TableHeaderCell, Tooltip } from '@tet/ui';
import { JSX, memo, useState } from 'react';
import { RemoveYearConfirmModal } from './remove-year-confirm-modal';
import { Year } from './types';

type YearColumnHeaderProps = {
  year: Year;
  colSpan?: number;
  isReference: boolean;
  onRemoveYear?: (year: Year) => void;
  canRemove?: boolean;
  hasValues?: boolean;
};

type YearHeaderLabelProps = Pick<YearColumnHeaderProps, 'year' | 'isReference'>;

const YearHeaderLabel = ({
  year,
  isReference,
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
        <span>{year}</span>
      </>
    );
  }

  return <span>{year}</span>;
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

export const IndicateurValeurYearHeaderCell = memo(
  ({
    year,
    colSpan = 1,
    isReference,
    onRemoveYear,
    canRemove = false,
    hasValues = false,
  }: YearColumnHeaderProps): JSX.Element => {
    return (
      <TableHeaderCell
        colSpan={colSpan}
        align="center"
        className={cn(
          'sticky top-0 z-[2] align-middle border-r border-grey-3 bg-white text-base font-bold',
          colSpan === 2 ? 'w-60 min-w-48' : 'w-32 min-w-24'
        )}
      >
        <div className="flex items-center gap-1 justify-center align-middle">
          <YearHeaderLabel year={year} isReference={isReference} />
          {canRemove && onRemoveYear !== undefined ? (
            <RemoveYearButton
              year={year}
              hasValues={hasValues}
              onRemoveYear={onRemoveYear}
            />
          ) : null}
        </div>
      </TableHeaderCell>
    );
  }
);

IndicateurValeurYearHeaderCell.displayName = 'YearColumnHeader';
