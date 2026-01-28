import { Spacer } from '@tet/ui';
import { BudgetView } from './budget/budget.view';
import { FinanceursView } from './financeurs';
import { RessourcesFinancementsView } from './ressources-financements.view';

export const MoyensContent = () => {
  return (
    <>
      <RessourcesFinancementsView />
      <Spacer height={3} />
      <BudgetView type="investissement" />
      <Spacer height={1.5} />
      <BudgetView type="fonctionnement" />
      <Spacer height={1.5} />
      <FinanceursView />
    </>
  );
};
