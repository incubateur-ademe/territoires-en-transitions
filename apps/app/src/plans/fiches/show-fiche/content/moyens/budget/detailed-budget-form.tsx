import { getYearsOptions } from '@/app/app/pages/collectivite/PlansActions/FicheAction/utils';
import { getFormattedNumber } from '@/app/utils/formatUtils';
import { FicheBudgetCreate } from '@tet/domain/plans';
import { Button, Field, Input, OptionValue, Select } from '@tet/ui';
import classNames from 'classnames';
import { noop } from 'es-toolkit';
import { useEffect } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

type DetailedBudgetFormProps = {
  budgets: FicheBudgetCreate[];
  ficheId: number;
  type: 'investissement' | 'fonctionnement';
  isEuros: boolean;
  onFormChange: (formData: FicheBudgetCreate[]) => void;
};

export const DetailedBudgetForm = ({
  budgets,
  ficheId,
  type,
  isEuros,
  onFormChange,
}: DetailedBudgetFormProps) => {
  const { control, watch } = useForm({
    defaultValues: {
      budgets,
    },
  });

  const { fields, remove, insert } = useFieldArray({
    name: 'budgets',
    control,
  });

  const formData = watch('budgets');

  useEffect(() => {
    onFormChange(formData);
  }, [formData, onFormChange]);

  const totalBudgetPrevisionnel = calculateTotal(
    formData,
    isEuros,
    'budgetPrevisionnel'
  );

  const totalBudgetReel = calculateTotal(formData, isEuros, 'budgetReel');

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
              budgetPrevisionnel: 0,
              budgetReel: 0,
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
    return fields.map((fieldItem, index) => (
      <div
        key={fieldItem.id}
        className={classNames('flex flex-row gap-6', {
          hidden: fieldItem.unite !== filter,
        })}
      >
        <Field title="Année" className="w-52 grow-0 shrink-0">
          <Select
            options={yearsOptions}
            values={
              fieldItem.annee ? (fieldItem.annee as OptionValue) : undefined
            }
            disabled={true}
            onChange={noop}
            aria-label={`Année ${fieldItem.annee} sélectionnée (non modifiable)`}
          />
        </Field>

        {/* Budget prévisionnel */}
        <Field
          title={`${
            fieldItem.unite === 'HT' ? 'Montant ' : 'ETP '
          } prévisionnel`}
        >
          <Controller
            control={control}
            name={`budgets.${index}.budgetPrevisionnel`}
            render={({ field: { onChange, value, name, ref } }) => (
              <Input
                type="number"
                decimalScale={fieldItem.unite === 'HT' ? 0 : 2}
                icon={{
                  text: fieldItem.unite === 'HT' ? '€ HT' : 'ETP',
                }}
                placeholder={
                  fieldItem.unite === 'HT'
                    ? 'Ajouter un montant'
                    : 'Ajouter une valeur'
                }
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

          {/* Total budget prévisionnel */}
          {fields.filter((elt) => elt.unite === filter).length > 1 &&
            index === lastIndexBudgets() && (
              <div className="uppercase text-primary-10 text-lg font-bold ml-auto mt-6 mr-1">
                Total : {getFormattedNumber(totalBudgetPrevisionnel)}{' '}
                {fieldItem.unite === 'HT' ? '€ HT' : 'ETP'}
              </div>
            )}
        </Field>

        {/* Budget réel */}
        <Field
          title={fieldItem.unite === 'HT' ? 'Montant dépensé' : 'ETP réel'}
        >
          <Controller
            control={control}
            name={`budgets.${index}.budgetReel`}
            render={({ field: { onChange, value, name, ref } }) => (
              <Input
                type="number"
                decimalScale={fieldItem.unite === 'HT' ? 0 : 2}
                icon={{
                  text: fieldItem.unite === 'HT' ? '€ HT' : 'ETP',
                }}
                placeholder={
                  fieldItem.unite === 'HT'
                    ? 'Ajouter un montant'
                    : 'Ajouter une valeur'
                }
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

          {/* Total budget réel */}
          {fields.filter((elt) => elt.unite === filter).length > 1 &&
            index === lastIndexBudgets() && (
              <div className="uppercase text-primary-10 text-lg font-bold ml-auto mt-6 mr-1">
                Total : {getFormattedNumber(totalBudgetReel)}{' '}
                {fieldItem.unite === 'HT' ? '€ HT' : 'ETP'}
              </div>
            )}
        </Field>

        <Button
          icon="delete-bin-line"
          variant="grey"
          className="mt-8 h-fit"
          onClick={() => remove(index)}
        />
      </div>
    ));
  };

  return (
    <>
      {budgetLineInputs()}
      {addBudget(isEuros ? 'HT' : 'ETP')}
    </>
  );
};

const calculateTotal = (
  fields: FicheBudgetCreate[],
  isEuros: boolean,
  fieldType: 'budgetPrevisionnel' | 'budgetReel'
): number => {
  const total = fields
    .filter((elt) => elt.unite === (isEuros ? 'HT' : 'ETP'))
    .reduce(
      (sum, currValue) =>
        sum + (currValue[fieldType] ? currValue[fieldType] : 0),
      0
    );
  return Number(total.toFixed(2));
};
