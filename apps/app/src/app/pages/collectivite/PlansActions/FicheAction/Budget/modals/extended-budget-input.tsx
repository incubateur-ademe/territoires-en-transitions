import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';
import { Input } from '@/ui';

type ExtendedBudgetInputProps = {
  budget: BudgetType;
  isEuros: boolean;
  onUpdate: (budget: BudgetType) => void;
};

const ExtendedBudgetInput = ({
  budget,
  isEuros,
  onUpdate,
}: ExtendedBudgetInputProps) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="p-4 bg-primary-1 rounded-md flex justify-between items-center">
        <div className="text-primary-10 text-sm font-bold uppercase">
          Total prévisionnel :
        </div>
        <Input
          type="number"
          decimalScale={isEuros ? 0 : 2}
          icon={{ text: isEuros ? '€ HT' : 'ETP' }}
          value={budget.budgetPrevisionnel ?? ''}
          placeholder="Ajouter un montant"
          onValueChange={(values) =>
            onUpdate({
              ...budget,
              budgetPrevisionnel: values.value ? values.value : undefined,
            } as BudgetType)
          }
        />
      </div>

      <div className="p-4 bg-primary-1 rounded-md flex justify-between items-center">
        <div className="text-primary-10 text-sm font-bold uppercase">
          Total dépensé :
        </div>
        <Input
          type="number"
          decimalScale={isEuros ? 0 : 2}
          icon={{ text: isEuros ? '€ HT' : 'ETP' }}
          value={budget.budgetReel ?? ''}
          placeholder="Ajouter un montant"
          onValueChange={(values) =>
            onUpdate({
              ...budget,
              budgetReel: values.value ? values.value : undefined,
            } as BudgetType)
          }
        />
      </div>
    </div>
  );
};

export default ExtendedBudgetInput;
