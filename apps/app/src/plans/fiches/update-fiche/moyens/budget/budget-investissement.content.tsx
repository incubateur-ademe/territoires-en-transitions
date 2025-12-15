import { BudgetTagsList } from './budget-tags.list';
import { BudgetProperties } from './types';

const labelsForBudgetReel = {
  HT: 'Montant dépensé',
  ETP: 'ETP réel',
} as const;
const labelsForBudgetPrevisionnel = {
  HT: 'Montant prévisionnel',
  ETP: 'ETP prévisionnel',
} as const;

export const BudgetInvestissementContent = ({
  budgets,
}: {
  budgets: BudgetProperties[];
}) => {
  const first = budgets[0];
  return (
    <>
      <p className="mb-0 text-grey-8 text-sm font-medium">
        Le budget prévisionnel total renseigné{' '}
        {first.isExtended ? 's’étale' : 'ne s’étale pas'} sur toute la durée du
        plan.
      </p>
      <div className="flex flex-wrap gap-x-3 gap-y-2">
        {budgets.map((budget) => (
          <BudgetTagsList
            key={`${budget.unit}-${
              budget.value?.previsionnel ?? 'previsionnel'
            }-${budget.value?.reel ?? 'reel'}`}
            tags={[
              {
                name: labelsForBudgetPrevisionnel[budget.unit],
                amount: budget.value?.previsionnel,
              },
              {
                name: labelsForBudgetReel[budget.unit],
                amount: budget.value?.reel,
              },
            ]}
            unit={budget.unit}
          />
        ))}
      </div>
    </>
  );
};
