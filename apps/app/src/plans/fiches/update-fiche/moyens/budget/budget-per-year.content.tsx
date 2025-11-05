import { getFormattedFloat, getFormattedNumber } from '@/app/utils/formatUtils';
import { Badge, TBody, TCell, THead, THeadCell, TRow, Table } from '@/ui';
import classNames from 'classnames';
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
      eurosPrevisionnel: euros?.value.previsionnel ?? null,
      eurosReel: euros?.value.reel ?? null,
      etpPrevisionnel: etps?.value.previsionnel ?? null,
      etpReel: etps?.value.reel ?? null,
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

  const bodyCellClassname = (idx: number) =>
    classNames('!py-3', { 'bg-primary-0': idx % 2 !== 0 });

  return (
    <div className="w-full overflow-x-auto">
      <Table className="rounded-none">
        <THead className="bg-white">
          <TRow>
            <THeadCell className={headCellClassname}>Année</THeadCell>
            <THeadCell className={headCellClassname}>
              Montant prévisionnel
            </THeadCell>
            <THeadCell className={headCellClassname}>Montant dépensé</THeadCell>
            <THeadCell className={headCellClassname}>
              ETP prévisionnel
            </THeadCell>
            <THeadCell className={headCellClassname}>ETP réel</THeadCell>
          </TRow>
        </THead>

        <TBody>
          {groupedBudgets.map((budget, idx) => (
            <TRow key={budget.year}>
              <TCell
                variant="title"
                className={classNames(bodyCellClassname(idx), 'text-primary-9')}
              >
                {budget.year}
              </TCell>
              <TCell className={bodyCellClassname(idx)}>
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
              </TCell>
              <TCell className={bodyCellClassname(idx)}>
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
              </TCell>
              <TCell className={bodyCellClassname(idx)}>
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
              </TCell>
              <TCell className={bodyCellClassname(idx)}>
                {budget.etpReel && (
                  <Badge
                    title={<span>{getFormattedFloat(budget.etpReel)} ETP</span>}
                    state="standard"
                    light
                    className="mx-auto"
                  />
                )}
              </TCell>
            </TRow>
          ))}

          {/* Total */}
          <TRow>
            <TCell
              variant="title"
              className={bodyCellClassname(groupedBudgets.length)}
            >
              Total
            </TCell>
            <TCell className={bodyCellClassname(groupedBudgets.length)}>
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
            </TCell>
            <TCell className={bodyCellClassname(groupedBudgets.length)}>
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
            </TCell>
            <TCell className={bodyCellClassname(groupedBudgets.length)}>
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
            </TCell>
            <TCell className={bodyCellClassname(groupedBudgets.length)}>
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
            </TCell>
          </TRow>
        </TBody>
      </Table>
    </div>
  );
};
