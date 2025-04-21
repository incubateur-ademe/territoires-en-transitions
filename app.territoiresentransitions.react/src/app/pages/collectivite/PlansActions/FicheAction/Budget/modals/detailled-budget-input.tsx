import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/BudgetTab';
import { getYearsOptions } from '@/app/app/pages/collectivite/PlansActions/FicheAction/utils';
import { Button, Field, Input, Select } from '@/ui';

type DetailledBudgetInputProps = {
  isEuros: boolean;
  budgets: BudgetType[];
};

const DetailledBudgetInput = ({
  budgets,
  isEuros,
}: DetailledBudgetInputProps) => {
  const { yearsOptions } = getYearsOptions();

  return (
    <div className="flex flex-col gap-6">
      {/* Liste des budgets */}
      {(budgets ?? []).map((budget, index) => (
        <div key={budget.id} className="flex items-end gap-4">
          <Field title="Année" className="w-52 grow-0 shrink-0">
            <Select
              options={yearsOptions}
              values={budget.annee}
              disabled={true}
              onChange={() => ({})}
            />
          </Field>
          <Field title={`${isEuros ? 'Montant ' : 'ETP '} prévisionnel`}>
            <Input
              type="number"
              icon={{ text: isEuros ? '€ HT' : 'ETP' }}
              value={budget.budgetPrevisionnel}
              placeholder={
                isEuros ? 'Ajouter un montant' : 'Ajouter une valeur'
              }
              onValueChange={(values) => {}}
            />
          </Field>
          <Field title={isEuros ? 'Montant dépensé' : 'ETP réel'}>
            <Input
              type="number"
              icon={{ text: isEuros ? '€ HT' : 'ETP' }}
              value={budget.budgetReel}
              placeholder={
                isEuros ? 'Ajouter un montant' : 'Ajouter une valeur'
              }
              onValueChange={(values) => {}}
            />
          </Field>
          <Button icon="delete-bin-line" variant="grey" onClick={() => {}} />
        </div>
      ))}

      {/* Nouveau budget */}
      <Field title="Ajouter une année" className="w-52">
        <Select
          key={(budgets ?? []).length}
          options={yearsOptions}
          values={undefined}
          onChange={() => ({})}
          placeholder="Sélectionner une année"
        />
      </Field>
    </div>
  );
};

export default DetailledBudgetInput;
