import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';
import { Input } from '@/ui';
import classNames from 'classnames';
import { useEffect } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

type ExtendedBudgetFormProps = {
  budgets: BudgetType[];
  isEuros: boolean;
  onFormChange: (budgets: BudgetType[]) => void;
};

export const ExtendedBudgetForm = ({
  budgets,
  isEuros,
  onFormChange,
}: ExtendedBudgetFormProps) => {
  const { control, watch } = useForm({
    defaultValues: {
      budgets: budgets ?? [],
    },
  });

  const { fields } = useFieldArray({
    control,
    name: 'budgets',
  });

  const formData = watch('budgets');

  useEffect(() => {
    onFormChange(formData);
  }, [formData, onFormChange]);

  return fields.map((field, index) => (
    <div
      className={classNames('flex flex-col gap-6', {
        hidden: field.unite !== (isEuros ? 'HT' : 'ETP'),
      })}
      key={field.id}
    >
      <div className="p-4 bg-primary-1 rounded-md flex justify-between items-center">
        <div className="text-primary-10 text-sm font-bold uppercase">
          Total prévisionnel :
        </div>

        <Controller
          control={control}
          name={`budgets.${index}.budgetPrevisionnel`}
          render={({ field: { onChange, value, name, ref } }) => (
            <Input
              type="number"
              decimalScale={field.unite === 'HT' ? 0 : 2}
              icon={{ text: isEuros ? '€ HT' : 'ETP' }}
              placeholder="Ajouter un montant"
              value={value?.toString() ?? ''}
              // On utilise un `Controller` ici plutôt que `register` pour récupérer la valeur formatée
              onValueChange={({ floatValue, value: raw }) =>
                onChange(raw === '' ? null : floatValue)
              }
              name={name}
              ref={ref}
            />
          )}
        />
      </div>

      <div className="p-4 bg-primary-1 rounded-md flex justify-between items-center">
        <div className="text-primary-10 text-sm font-bold uppercase">
          Total dépensé :
        </div>

        <Controller
          control={control}
          name={`budgets.${index}.budgetReel`}
          render={({ field: { onChange, value, name, ref } }) => (
            <Input
              type="number"
              decimalScale={field.unite === 'HT' ? 0 : 2}
              icon={{ text: isEuros ? '€ HT' : 'ETP' }}
              placeholder="Ajouter un montant"
              value={value?.toString() ?? ''}
              // On utilise un `Controller` ici plutôt que `register` pour récupérer la valeur formatée
              onValueChange={({ floatValue, value: raw }) =>
                onChange(raw === '' ? null : floatValue)
              }
              name={name}
              ref={ref}
            />
          )}
        />
      </div>
    </div>
  ));
};
