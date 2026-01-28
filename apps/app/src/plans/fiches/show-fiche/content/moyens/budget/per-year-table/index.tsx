import { Button, cn, Spacer, Table, TableHead, VisibleWhen } from '@tet/ui';
import { useState } from 'react';
import { useFicheContext } from '../../../../context/fiche-context';
import { getYearsOptions } from '../../../../utils';
import { BudgetPerYearTableNewRow } from './budget-per-year-new.row';
import { BudgetPerYearTotalRow } from './budget-per-year-total.row';
import { BudgetPerYearRow } from './budget-per-year.row';

const HeaderCell = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <th
      className={cn(
        'text-left uppercase text-sm text-grey-9 font-medium py-3 pl-4 bg-white min-w-[150px]',
        className
      )}
    >
      {children}
    </th>
  );
};

export const BudgetPerYearTable = ({
  type,
}: {
  type: 'investissement' | 'fonctionnement';
}) => {
  const { budgets: budgetsState, fiche, isReadonly } = useFicheContext();
  const { upsert, deleteBudgets, [type]: budgets } = budgetsState;

  const usedYears = budgets.perYear.map((budget) => budget.year);
  const [isAddingBudget, setIsAddingBudget] = useState(usedYears.length === 0);

  const yearsOptions = getYearsOptions(7).yearsOptions.filter(
    (year) => !usedYears.includes(year.value)
  );

  return (
    <div>
      <div className="overflow-x-auto md:overflow-x-none">
        <Table className="border-separate border-spacing-0 border border-gray-3 bg-grey-1 min-w-[800px] [&_tbody_tr:nth-child(even)]:bg-grey-2 [&_tbody_tr[data-total-row]]:bg-primary-3">
          <TableHead>
            <tr>
              <HeaderCell
                className={isAddingBudget ? 'w-[200px]' : 'w-[150px]'}
              >
                Année
              </HeaderCell>
              <HeaderCell className={isAddingBudget ? 'w-[200px]' : ''}>
                Montant
              </HeaderCell>
              <HeaderCell className={isAddingBudget ? 'w-[200px]' : ''}>
                Dépensé
              </HeaderCell>
              <HeaderCell className={isAddingBudget ? 'w-[200px]' : ''}>
                ETP prévisionnel
              </HeaderCell>
              <HeaderCell className={isAddingBudget ? 'w-[200px]' : ''}>
                ETP Réel
              </HeaderCell>
              <HeaderCell
                className={isAddingBudget ? 'w-[150px]' : 'w-[80px]'}
              />
            </tr>
          </TableHead>
          <tbody>
            {budgets.perYear.map((budget) => (
              <BudgetPerYearRow
                availableYearOptions={yearsOptions}
                key={budget.year}
                budget={budget}
                fiche={fiche}
                isReadonly={isReadonly}
                onUpsertBudget={(budget) => upsert.year(budget, type)}
                onDeleteBudget={(year) => deleteBudgets(year, type)}
              />
            ))}
            <VisibleWhen condition={!isReadonly && isAddingBudget}>
              <BudgetPerYearTableNewRow
                key="new"
                availableYearOptions={yearsOptions}
                onUpsertBudget={(budget) => upsert.year(budget, type)}
                onCancel={() => setIsAddingBudget(false)}
              />
            </VisibleWhen>
            <BudgetPerYearTotalRow key="total" budgets={budgets.perYear} />
          </tbody>
        </Table>
      </div>
      <Spacer height={1} />
      <Button
        size="xs"
        icon="add-line"
        variant="outlined"
        onClick={() => setIsAddingBudget((prev) => !prev)}
      >
        Ajouter un budget
      </Button>
    </div>
  );
};
