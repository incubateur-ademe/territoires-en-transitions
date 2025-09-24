import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';
import { getYearsOptions } from '@/app/app/pages/collectivite/PlansActions/FicheAction/utils';
import { getFormattedNumber, parseBudgetNumber } from '@/app/utils/formatUtils';
import { Button, Field, Input, OptionValue, Select } from '@/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

const validationSchema = z.array(
  z.object({
    annee: z.number(),
    budgetPrevisionnel: z.number().nullable(),
    budgetReel: z.number().nullable(),
    unite: z.literal('HT').or(z.literal('ETP')),
    type: z.literal('investissement').or(z.literal('fonctionnement')),
  })
);

const useBudgetsDetailedForm = (budgets: BudgetType[]) => {
  console.log('budgets :::: ', budgets);
  return useForm({
    reValidateMode: 'onChange',
    resolver: zodResolver(validationSchema),
    defaultValues: {
      name: 'detailedBudgetForm',
      detailedBudgetForm: budgets,
    },
  });
};

type DetailedBudgetFormProps = {
  budgets: BudgetType[];
  ficheId: number;
  type: 'investissement' | 'fonctionnement';
  isEuros: boolean;
  onFormChange: (formData: BudgetType[]) => void;
};

const DetailedBudgetForm = ({
  budgets,
  ficheId,
  type,
  isEuros,
  onFormChange,
}: DetailedBudgetFormProps) => {
  const detailledBudgetForm = useBudgetsDetailedForm(budgets);
  const { control, watch } = detailledBudgetForm;
  const { fields, remove, insert } = useFieldArray({
    control: detailledBudgetForm.control,
    name: 'detailedBudgetForm',
  });

  const [totalBudgetPrevisionnel, setTotalBudgetPrevisionnel] = useState(
    calculateTotalBudgetPrevisionnelByFields(budgets, isEuros)
  );

  const [totalBudgetReel, setTotalBudgetReel] = useState(
    calculateBudgetReelByFields(budgets, isEuros)
  );

  const { yearsOptions } = getYearsOptions(7);

  const getIndexOfInsertLine = (unite: 'HT' | 'ETP', annee: number) => {
    const sameUnitFields = fields
      .map((field, index) => ({ field, index }))
      .filter(({ field }) => field.unite === unite && field.annee);

    const insertIndex = sameUnitFields.findIndex(
      ({ field }) => field.annee && field.annee > annee
    );

    return insertIndex === -1
      ? fields.length
      : sameUnitFields[insertIndex].index;
  };

  const addBudget = (unite: 'HT' | 'ETP') => {
    return (
      <Field title="Ajouter une année" className="w-52">
        <Select
          key={(budgets ?? []).length}
          options={yearsOptions.filter(
            (year) =>
              !fields.find(
                (elt) => elt.annee === year.value && elt.unite === unite
              )
          )}
          values={undefined}
          onChange={(selectedYear) =>
            selectedYear &&
            insert(getIndexOfInsertLine(unite, selectedYear as number), {
              ficheId,
              type,
              unite,
              budgetPrevisionnel: '0',
              budgetReel: '0',
              annee: selectedYear as number,
            })
          }
          placeholder="Sélectionner une année"
        />
      </Field>
    );
  };

  const lastIndexBudgets = (): number => {
    return fields.findLastIndex(
      (budget) => budget.unite === (isEuros ? 'HT' : 'ETP')
    );
  };

  const budgetLineInputs = () => {
    const filter = isEuros ? 'HT' : 'ETP';
    return fields.map((field, index) => (
      <div
        key={field.id}
        className={classNames('flex flex-row gap-6', {
          hidden: field.unite !== filter,
        })}
      >
        <Controller
          key={`${field.id}-annee`}
          control={control}
          name={`detailedBudgetForm.${index}`}
          render={({ field }) => (
            <Field title="Année" className="w-52 grow-0 shrink-0">
              <Select
                options={yearsOptions}
                values={
                  field.value.annee
                    ? (field.value.annee as OptionValue)
                    : undefined
                }
                disabled={true}
                onChange={() => ({})}
                aria-label={`Année ${field.value.annee} sélectionnée (non modifiable)`}
              />
            </Field>
          )}
        />

        {/* Budget prévisionnel */}
        <Controller
          key={`${field.id}-previsionnel`}
          control={control}
          name={`detailedBudgetForm.${index}.budgetPrevisionnel`}
          render={({ field: budgetField }) => (
            <Field
              title={`${
                field.unite === 'HT' ? 'Montant ' : 'ETP '
              } prévisionnel`}
            >
              <Input
                type="number"
                decimalScale={field.unite === 'HT' ? 0 : 2}
                icon={{
                  text: field.unite === 'HT' ? '€ HT' : 'ETP',
                }}
                defaultValue={budgetField.value ?? ''}
                value={budgetField.value ?? ''}
                onChange={(event) => {
                  budgetField.onChange(event.target.value);
                  setTotalBudgetPrevisionnel(
                    calculateNewTotal(
                      totalBudgetPrevisionnel,
                      budgetField.value ?? '0',
                      event.target.value
                    )
                  );
                }}
                name={budgetField.name}
                placeholder={
                  field.unite === 'HT'
                    ? 'Ajouter un montant'
                    : 'Ajouter une valeur'
                }
              />
              {/* Total budget prévisionnel */}
              {fields.filter((elt) => elt.unite === filter).length > 1 &&
                index === lastIndexBudgets() && (
                  <div className="uppercase text-primary-10 text-lg font-bold ml-auto mt-6 mr-1">
                    Total : {getFormattedNumber(totalBudgetPrevisionnel)}{' '}
                    {field.unite === 'HT' ? '€ HT' : 'ETP'}
                  </div>
                )}
            </Field>
          )}
        />

        {/* Budget réel */}
        <Controller
          key={`${field.id}-reel`}
          control={control}
          name={`detailedBudgetForm.${index}.budgetReel`}
          render={({ field: budgetField }) => (
            <Field
              title={field.unite === 'HT' ? 'Montant dépensé' : 'ETP réel'}
            >
              <Input
                type="number"
                decimalScale={field.unite === 'HT' ? 0 : 2}
                icon={{
                  text: field.unite === 'HT' ? '€ HT' : 'ETP',
                }}
                defaultValue={budgetField.value ?? ''}
                value={budgetField.value ?? ''}
                onChange={(event) => {
                  budgetField.onChange(event.target.value);
                  setTotalBudgetReel(
                    calculateNewTotal(
                      totalBudgetReel,
                      budgetField.value ?? '0',
                      event.target.value
                    )
                  );
                }}
                name={budgetField.name}
                placeholder={
                  field.unite === 'HT'
                    ? 'Ajouter un montant'
                    : 'Ajouter une valeur'
                }
              />
              {/* Total budget réel */}
              {fields.filter((elt) => elt.unite === filter).length > 1 &&
                index === lastIndexBudgets() && (
                  <div className="uppercase text-primary-10 text-lg font-bold ml-auto mt-6 mr-1">
                    Total : {getFormattedNumber(totalBudgetReel)}{' '}
                    {field.unite === 'HT' ? '€ HT' : 'ETP'}
                  </div>
                )}
            </Field>
          )}
        />
        <Button
          icon="delete-bin-line"
          variant="grey"
          className="mt-8 h-fit"
          onClick={() => remove(index)}
        />
      </div>
    ));
  };

  const formData = watch('detailedBudgetForm');
  useEffect(() => {
    onFormChange(formData);
  }, [formData, onFormChange]);
  useEffect(() => {
    setTotalBudgetPrevisionnel(
      calculateTotalBudgetPrevisionnelByFields(fields, isEuros)
    );
    setTotalBudgetReel(calculateBudgetReelByFields(fields, isEuros));
  }, [isEuros, fields]);

  return (
    <>
      {budgetLineInputs()}
      {addBudget(isEuros ? 'HT' : 'ETP')}
    </>
  );
};

const calculateNewTotal = (
  currentTotal: number,
  oldValue: string | null,
  newValue: string
) => {
  const oldNum = parseBudgetNumber(oldValue) ?? 0;
  const newNum = parseBudgetNumber(newValue) ?? 0;

  return Number((currentTotal - oldNum + newNum).toFixed(2));
};

const calculateTotalBudgetPrevisionnelByFields = (
  fields: BudgetType[],
  isEuros: boolean
) => {
  return fields
    .filter((elt) => elt.unite === (isEuros ? 'HT' : 'ETP'))
    .reduce(
      (sum, currValue) =>
        sum + (parseBudgetNumber(currValue.budgetPrevisionnel) ?? 0),
      0
    );
};

const calculateBudgetReelByFields = (
  fields: BudgetType[],
  isEuros: boolean
) => {
  return fields
    .filter((elt) => elt.unite === (isEuros ? 'HT' : 'ETP'))
    .reduce(
      (sum, currValue) => sum + (parseBudgetNumber(currValue.budgetReel) ?? 0),
      0
    );
};

export default DetailedBudgetForm;
