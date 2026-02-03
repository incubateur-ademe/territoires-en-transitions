import { Divider, Spacer } from '@tet/ui';
import { BudgetView } from './budget/budget.view';
import { FinanceursView } from './financeurs';
import { RessourcesFinancementsView } from './ressources-financements.view';

export const BudgetContent = () => {
  return (
    <>
      <RessourcesFinancementsView />
      <Spacer height={3} />
      <BudgetView type="investissement" />
      <Divider color="grey" className="my-6" />
      <BudgetView type="fonctionnement" />
      <Divider color="grey" className="my-6" />
      <FinanceursView />
    </>
  );
};
