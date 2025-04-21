import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/BudgetTab';
import { Input } from '@/ui';

type YearlyBudgetInputProps = {
  isEuros: boolean;
  budget?: BudgetType;
};

const YearlyBudgetInput = ({ isEuros, budget }: YearlyBudgetInputProps) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="p-4 bg-primary-1 rounded-md flex justify-between items-center">
        <div className="text-primary-10 text-sm font-bold uppercase">
          Total prévisionnel :
        </div>
        <Input
          type="number"
          icon={{ text: isEuros ? '€ HT' : 'ETP' }}
          value={budget ? budget.budgetPrevisionnel : undefined}
          placeholder="Ajouter un montant"
          onValueChange={(values) => {}}
        />
      </div>

      <div className="p-4 bg-primary-1 rounded-md flex justify-between items-center">
        <div className="text-primary-10 text-sm font-bold uppercase">
          Total dépensé :
        </div>
        <Input
          type="number"
          icon={{ text: isEuros ? '€ HT' : 'ETP' }}
          value={budget ? budget.budgetReel : undefined}
          placeholder="Ajouter un montant"
          onValueChange={(values) => {}}
        />
      </div>
    </div>
  );
};

export default YearlyBudgetInput;
