import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';
import { Input } from '@/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import classNames from 'classnames';
import { useEffect } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

const validationSchema = z.array(
  z.object({
    budgetPrevisionnel: z.number().nullable(),
    budgetReel: z.number().nullable(),
    unite: z.literal('HT').or(z.literal('ETP')),
    type: z.literal('investissement').or(z.literal('fonctionnement')),
  })
);

const useBudgetsExtendedForm = (budgets: BudgetType[]) => {
  return useForm({
    reValidateMode: 'onChange',
    resolver: zodResolver(validationSchema),
    defaultValues: {
      name: 'extendedBudgetForm',
      extendedBudgetForm: budgets,
    },
  });
};

type ExtendedBudgetFormProps = {
  budgets: BudgetType[];
  isEuros: boolean;
  onFormChange: (budgets: BudgetType[]) => void;
};

const ExtendedBudgetForm = ({
  budgets,
  isEuros,
  onFormChange,
}: ExtendedBudgetFormProps) => {
  const extendedBudgetForm = useBudgetsExtendedForm(budgets);
  const { control, watch } = extendedBudgetForm;
  const { fields } = useFieldArray({
    control: extendedBudgetForm.control,
    name: 'extendedBudgetForm',
  });

  // // Watch form changes and notify parent
  const formData = watch('extendedBudgetForm');
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
          key={`${field.id}-budgetPrevisionnel`}
          control={control}
          name={`extendedBudgetForm.${index}.budgetPrevisionnel`}
          render={({ field }) => (
            <Input
              type="number"
              decimalScale={isEuros ? 0 : 2}
              icon={{ text: isEuros ? '€ HT' : 'ETP' }}
              value={field.value ?? ''}
              placeholder="Ajouter un montant"
              onChange={(event) => {
                field.onChange(event.target.value);
              }}
              name={field.name}
            />
          )}
        />
      </div>

      <div className="p-4 bg-primary-1 rounded-md flex justify-between items-center">
        <div className="text-primary-10 text-sm font-bold uppercase">
          Total dépensé :
        </div>
        <Controller
          key={`${field.id}-budgetReel`}
          control={control}
          name={`extendedBudgetForm.${index}.budgetReel`}
          render={({ field }) => (
            <Input
              type="number"
              decimalScale={isEuros ? 0 : 2}
              icon={{ text: isEuros ? '€ HT' : 'ETP' }}
              value={field.value ?? ''}
              placeholder="Ajouter un montant"
              onChange={(event) => {
                field.onChange(event.target.value);
              }}
              name={field.name}
            />
          )}
        />
      </div>
    </div>
  ));
};

export default ExtendedBudgetForm;
