import { getFormattedFloat, getFormattedNumber } from '@/app/utils/formatUtils';
import { cn, TableCell, TableRow } from '@tet/ui';
import { useMemo } from 'react';
import { BudgetPerYear } from '../../../../context/types';

export const BudgetPerYearTotalRow = ({
  budgets,
}: {
  budgets: BudgetPerYear[];
}) => {
  const totals = useMemo(() => {
    return budgets.reduce(
      (acc, row) => ({
        montant: acc.montant + (row.montant ?? 0),
        depense: acc.depense + (row.depense ?? 0),
        etpPrevisionnel: acc.etpPrevisionnel + (row.etpPrevisionnel ?? 0),
        etpReel: acc.etpReel + (row.etpReel ?? 0),
      }),
      {
        montant: 0,
        depense: 0,
        etpPrevisionnel: 0,
        etpReel: 0,
      }
    );
  }, [budgets]);
  return (
    <TableRow
      data-total-row
      className={cn('border-b border-gray-200 font-bold')}
    >
      <TableCell className="font-medium text-primary-9 text-sm border-b border-gray-5">
        TOTAL
      </TableCell>
      <TableCell className="font-medium text-primary-9 border-b border-gray-5">
        {totals.montant > 0 && (
          <span>
            {getFormattedNumber(totals.montant)} €{' '}
            <sup className="-top-[0.4em]">HT</sup>
          </span>
        )}
      </TableCell>
      <TableCell className="font-medium text-primary-9 border-b border-gray-5">
        {totals.depense > 0 && (
          <span>{getFormattedNumber(totals.depense)} € </span>
        )}
      </TableCell>
      <TableCell className="font-medium text-primary-9 border-b border-gray-5">
        {totals.etpPrevisionnel > 0 && (
          <span>{getFormattedFloat(totals.etpPrevisionnel)} ETP</span>
        )}
      </TableCell>
      <TableCell className="font-medium text-primary-9 border-b border-gray-5">
        {totals.etpReel > 0 && (
          <span>{getFormattedFloat(totals.etpReel)} ETP</span>
        )}
      </TableCell>
      <TableCell className="border-b border-gray-5" />
    </TableRow>
  );
};
