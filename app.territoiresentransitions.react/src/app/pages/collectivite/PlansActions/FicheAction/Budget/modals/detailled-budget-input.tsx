import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';
import { getYearsOptions } from '@/app/app/pages/collectivite/PlansActions/FicheAction/utils';
import { getFormattedNumber } from '@/app/utils/formatUtils';
import { Button, Field, Input, OptionValue, Select } from '@/ui';

type DetailledBudgetInputProps = {
  budgets: BudgetType[];
  ficheId: number;
  type: 'investissement' | 'fonctionnement';
  unite: 'HT' | 'ETP';
  onUpdate: (budgets: BudgetType[]) => void;
};

const DetailledBudgetInput = ({
  budgets,
  ficheId,
  type,
  unite,
  onUpdate,
}: DetailledBudgetInputProps) => {
  const { yearsOptions } = getYearsOptions(7);

  return (
    <div className="flex flex-col gap-6">
      {/* Liste des budgets */}
      {(budgets ?? [])
        .sort((a, b) => (a.annee ?? 0) - (b.annee ?? 0))
        .map((budget, index) => (
          <div
            key={`${budget.annee}-${index}`}
            className="flex items-start gap-4"
          >
            <Field title="Année" className="w-52 grow-0 shrink-0">
              <Select
                options={yearsOptions}
                values={
                  budget.annee ? (budget.annee as OptionValue) : undefined
                }
                disabled={true}
                onChange={() => ({})}
              />
            </Field>

            {/* Budget prévisionnel */}
            <Field
              title={`${unite === 'HT' ? 'Montant ' : 'ETP '} prévisionnel`}
            >
              <Input
                type="number"
                decimalScale={unite === 'HT' ? 0 : 2}
                icon={{ text: unite === 'HT' ? '€ HT' : 'ETP' }}
                value={budget.budgetPrevisionnel ?? undefined}
                placeholder={
                  unite === 'HT' ? 'Ajouter un montant' : 'Ajouter une valeur'
                }
                onValueChange={(values) =>
                  onUpdate(
                    (budgets ?? []).map((elt) =>
                      elt.annee === budget.annee
                        ? {
                            ...elt,
                            budgetPrevisionnel: values.value
                              ? values.value
                              : null,
                          }
                        : elt
                    )
                  )
                }
              />
              {/* Total budget prévisionnel */}
              {budgets.length > 1 && index === budgets.length - 1 && (
                <div className="uppercase text-primary-10 text-lg font-bold ml-auto mt-6 mr-1">
                  Total :{' '}
                  {getFormattedNumber(
                    budgets.reduce(
                      (sum, currValue) =>
                        sum + parseInt(currValue.budgetPrevisionnel ?? '0'),
                      0
                    )
                  )}{' '}
                  {unite === 'HT' ? '€ HT' : 'ETP'}
                </div>
              )}
            </Field>

            {/* Budget réel */}
            <Field title={unite === 'HT' ? 'Montant dépensé' : 'ETP réel'}>
              <Input
                type="number"
                decimalScale={unite === 'HT' ? 0 : 2}
                icon={{ text: unite === 'HT' ? '€ HT' : 'ETP' }}
                value={budget.budgetReel ?? undefined}
                placeholder={
                  unite === 'HT' ? 'Ajouter un montant' : 'Ajouter une valeur'
                }
                onValueChange={(values) =>
                  onUpdate(
                    (budgets ?? []).map((elt) =>
                      elt.annee === budget.annee
                        ? {
                            ...elt,
                            budgetReel: values.value ? values.value : null,
                          }
                        : elt
                    )
                  )
                }
              />
              {/* Total budget réel */}
              {budgets.length > 1 && index === budgets.length - 1 && (
                <div className="uppercase text-primary-10 text-lg font-bold ml-auto mt-6 mr-1">
                  Total :{' '}
                  {getFormattedNumber(
                    budgets.reduce(
                      (sum, currValue) =>
                        sum + parseInt(currValue.budgetReel ?? '0'),
                      0
                    )
                  )}{' '}
                  {unite === 'HT' ? '€ HT' : 'ETP'}
                </div>
              )}
            </Field>
            <Button
              icon="delete-bin-line"
              variant="grey"
              className="mt-8"
              onClick={() =>
                onUpdate(
                  (budgets ?? []).filter((elt) => elt.annee !== budget.annee)
                )
              }
            />
          </div>
        ))}

      {/* Nouveau budget */}
      <Field title="Ajouter une année" className="w-52">
        <Select
          key={(budgets ?? []).length}
          options={yearsOptions.filter(
            (year) => !budgets.find((elt) => elt.annee === year.value)
          )}
          values={undefined}
          onChange={(selectedYear) =>
            selectedYear &&
            onUpdate([
              ...(budgets ?? []),
              {
                ficheId,
                type,
                unite,
                annee: selectedYear as number,
              },
            ])
          }
          placeholder="Sélectionner une année"
        />
      </Field>
    </div>
  );
};

export default DetailledBudgetInput;
