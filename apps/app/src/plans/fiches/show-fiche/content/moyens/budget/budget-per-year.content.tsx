import { getFormattedFloat, getFormattedNumber } from '@/app/utils/formatUtils';
import {
  Badge,
  DEPRECATED_Table,
  DEPRECATED_TBody,
  DEPRECATED_TCell,
  DEPRECATED_THead,
  DEPRECATED_THeadCell,
  DEPRECATED_TRow,
} from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { uniq } from 'es-toolkit';
import { PerYearBudgetProperties } from './types';

type FormattedBudgetType = {
  year: number | null;
  eurosPrevisionnel: number | null;
  eurosReel: number | null;
  etpPrevisionnel: number | null;
  etpReel: number | null;
};

export const groupedByYearAndMergedBudget = (
  budgets: PerYearBudgetProperties[]
): Array<FormattedBudgetType> => {
  const years = uniq(budgets.map((b) => b.year)).sort((a, b) => a - b);

  return years.map((year) => {
    const euros = budgets.find((b) => b.year === year && b.unit === 'HT');
    const etps = budgets.find((b) => b.year === year && b.unit === 'ETP');

    return {
      year,
      eurosPrevisionnel: euros?.value?.previsionnel ?? null,
      eurosReel: euros?.value?.reel ?? null,
      etpPrevisionnel: etps?.value?.previsionnel ?? null,
      etpReel: etps?.value?.reel ?? null,
    };
  });
};

const calculateTotal = (
  formattedBudget: Array<FormattedBudgetType>,
  isEuros: boolean,
  fieldType: 'etpPrevisionnel' | 'etpReel' | 'eurosPrevisionnel' | 'eurosReel'
) => {
  const total = formattedBudget.reduce(
    (sum, currValue) => sum + (currValue[fieldType] ? currValue[fieldType] : 0),
    0
  );
  return isEuros ? total : Number(total.toFixed(2));
};

export const BudgetPerYearContent = ({
  budgets,
}: {
  budgets: PerYearBudgetProperties[];
}) => {
  const groupedBudgets = groupedByYearAndMergedBudget(budgets);

  const headCellClassname =
    'text-left !text-grey-9 font-normal uppercase w-1/5';

  const CELL_CLASSNAME = 'py-3 even:bg-primary-0';

  return (
    <div className="w-full overflow-x-auto">
      <DEPRECATED_Table className="rounded-none">
        <DEPRECATED_THead className="bg-white">
          <DEPRECATED_TRow>
            <DEPRECATED_THeadCell className={headCellClassname}>
              Année
            </DEPRECATED_THeadCell>
            <DEPRECATED_THeadCell className={headCellClassname}>
              Montant prévisionnel
            </DEPRECATED_THeadCell>
            <DEPRECATED_THeadCell className={headCellClassname}>
              Montant dépensé
            </DEPRECATED_THeadCell>
            <DEPRECATED_THeadCell className={headCellClassname}>
              ETP prévisionnel
            </DEPRECATED_THeadCell>
            <DEPRECATED_THeadCell className={headCellClassname}>
              ETP réel
            </DEPRECATED_THeadCell>
          </DEPRECATED_TRow>
        </DEPRECATED_THead>

        <DEPRECATED_TBody>
          {groupedBudgets.map((budget) => (
            <DEPRECATED_TRow key={budget.year}>
              <DEPRECATED_TCell
                variant="title"
                className={cn(CELL_CLASSNAME, 'text-primary-9')}
              >
                {budget.year}
              </DEPRECATED_TCell>
              <DEPRECATED_TCell className={CELL_CLASSNAME}>
                {budget.eurosPrevisionnel && (
                  <Badge
                    title={
                      <span>
                        {getFormattedNumber(budget.eurosPrevisionnel)} €{' '}
                        <sup className="-top-[0.4em]">HT</sup>
                      </span>
                    }
                    state="standard"
                    light
                    className="mx-auto"
                  />
                )}
              </DEPRECATED_TCell>
              <DEPRECATED_TCell className={CELL_CLASSNAME}>
                {budget.eurosReel && (
                  <Badge
                    title={
                      <span>
                        {getFormattedNumber(budget.eurosReel)} €{' '}
                        <sup className="-top-[0.4em]">HT</sup>
                      </span>
                    }
                    state="standard"
                    light
                    className="mx-auto"
                  />
                )}
              </DEPRECATED_TCell>
              <DEPRECATED_TCell className={CELL_CLASSNAME}>
                {budget.etpPrevisionnel && (
                  <Badge
                    title={
                      <span>
                        {getFormattedFloat(budget.etpPrevisionnel)} ETP
                      </span>
                    }
                    state="standard"
                    light
                    className="mx-auto"
                  />
                )}
              </DEPRECATED_TCell>
              <DEPRECATED_TCell className={CELL_CLASSNAME}>
                {budget.etpReel && (
                  <Badge
                    title={<span>{getFormattedFloat(budget.etpReel)} ETP</span>}
                    state="standard"
                    light
                    className="mx-auto"
                  />
                )}
              </DEPRECATED_TCell>
            </DEPRECATED_TRow>
          ))}

          {/* Total */}
          <DEPRECATED_TRow>
            <DEPRECATED_TCell variant="title" className={CELL_CLASSNAME}>
              Total
            </DEPRECATED_TCell>
            <DEPRECATED_TCell className={CELL_CLASSNAME}>
              <Badge
                title={
                  <span>
                    {getFormattedNumber(
                      calculateTotal(groupedBudgets, true, 'eurosPrevisionnel')
                    )}{' '}
                    € <sup className="-top-[0.4em]">HT</sup>
                  </span>
                }
                state="standard"
                className="mx-auto"
              />
            </DEPRECATED_TCell>
            <DEPRECATED_TCell className={CELL_CLASSNAME}>
              <Badge
                title={
                  <span>
                    {getFormattedNumber(
                      calculateTotal(groupedBudgets, true, 'eurosReel')
                    )}{' '}
                    € <sup className="-top-[0.4em]">HT</sup>
                  </span>
                }
                state="standard"
                className="mx-auto"
              />
            </DEPRECATED_TCell>
            <DEPRECATED_TCell className={CELL_CLASSNAME}>
              <Badge
                title={
                  <span>
                    {getFormattedFloat(
                      calculateTotal(groupedBudgets, false, 'etpPrevisionnel')
                    )}{' '}
                    ETP
                  </span>
                }
                state="standard"
                className="mx-auto"
              />
            </DEPRECATED_TCell>
            <DEPRECATED_TCell className={CELL_CLASSNAME}>
              <Badge
                title={
                  <span>
                    {getFormattedFloat(
                      calculateTotal(groupedBudgets, false, 'etpReel')
                    )}{' '}
                    ETP
                  </span>
                }
                state="standard"
                className="mx-auto"
              />
            </DEPRECATED_TCell>
          </DEPRECATED_TRow>
        </DEPRECATED_TBody>
      </DEPRECATED_Table>
    </div>
  );
};
