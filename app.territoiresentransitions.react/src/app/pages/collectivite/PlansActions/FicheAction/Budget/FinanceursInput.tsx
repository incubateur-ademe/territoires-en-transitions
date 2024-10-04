import { Financeur } from '@tet/api/plan-actions';
import { Button, Field, Input } from '@tet/ui';
import FinanceursDropdown from 'ui/dropdownLists/FinanceursDropdown/FinanceursDropdown';

type FinanceursInputProps = {
  financeurs: Financeur[] | null | undefined;
  onUpdate: (financeurs: Financeur[]) => void;
};

const FinanceursInput = ({ financeurs, onUpdate }: FinanceursInputProps) => {
  return (
    <>
      {/* Liste des financeurs */}
      {(financeurs ?? []).map((financeur, index) => (
        <div
          key={`${financeur.nom}-${index}`}
          className="col-span-2 grid grid-cols-7 gap-4"
        >
          <Field title={`Financeur ${index + 1}`} className="col-span-3">
            <FinanceursDropdown
              values={financeur.id ? [financeur.id] : undefined}
              disabled={true}
              onChange={() => {}}
            />
          </Field>
          <Field title="Montant engagé" className="col-span-4">
            <div className="flex gap-4 justify-between">
              <Input
                containerClassname="w-full"
                type="number"
                icon={{ text: 'TTC' }}
                value={financeur.montantTtc?.toString() ?? ''}
                placeholder="Ajouter un montant"
                onValueChange={(values) =>
                  onUpdate(
                    (financeurs ?? []).map((f) =>
                      f.id === financeur.id
                        ? {
                            ...f,
                            montantTtc: values.value
                              ? Number(values.value)
                              : null,
                          }
                        : f
                    )
                  )
                }
              />
              <Button
                icon="delete-bin-line"
                variant="grey"
                onClick={() =>
                  onUpdate(
                    (financeurs ?? []).filter((f) => f.id !== financeur.id)
                  )
                }
              />
            </div>
          </Field>
        </div>
      ))}

      {/* Nouveau financeur */}
      <div className="col-span-2 grid grid-cols-7 gap-4">
        <Field title="Ajouter un financeur" className="col-span-3">
          <FinanceursDropdown
            key={(financeurs ?? []).length}
            placeholder="Rechercher par mots-clés ou créer un tag"
            values={undefined}
            disabledOptionsIds={(financeurs ?? []).map((f) => f.id!)}
            onChange={({ selectedFinanceur }) =>
              selectedFinanceur &&
              onUpdate([...(financeurs ?? []), selectedFinanceur])
            }
          />
        </Field>
      </div>
    </>
  );
};

export default FinanceursInput;
