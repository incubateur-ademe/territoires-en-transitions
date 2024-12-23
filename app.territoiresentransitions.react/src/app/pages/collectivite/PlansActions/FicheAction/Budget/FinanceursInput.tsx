import FinanceursDropdown from '@/app/ui/dropdownLists/FinanceursDropdown/FinanceursDropdown';
import { Financeur, FinanceurUpdate } from '@/backend/plans/fiches';
import { Button, Field, Input } from '@/ui';

type FinanceurPartial = Omit<Financeur, 'id' | 'ficheId' | 'financeurTagId'>;

type FinanceursInputProps = {
  financeurs: FinanceurUpdate[] | null | undefined;
  onUpdate: (financeurs: FinanceurUpdate[]) => void;
};

const FinanceursInput = ({ financeurs, onUpdate }: FinanceursInputProps) => {
  return (
    <>
      {/* Liste des financeurs */}
      {(financeurs ?? []).map((financeur, index) => (
        <div
          key={`${financeur.financeurTag.nom}-${index}`}
          className="col-span-2 grid grid-cols-7 gap-4"
        >
          <Field title={`Financeur ${index + 1}`} className="col-span-3">
            <FinanceursDropdown
              values={
                financeur.financeurTag.id
                  ? [financeur.financeurTag.id]
                  : undefined
              }
              disabled={true}
              onChange={() => ({})}
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
                      f.financeurTag.id === financeur.financeurTag.id
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
                    (financeurs ?? []).filter(
                      (f) => f.financeurTag.id !== financeur.financeurTag.id
                    )
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
            disabledOptionsIds={(financeurs ?? []).map(
              (f) => f.financeurTag.id
            )}
            onChange={({ selectedFinanceur }) =>
              selectedFinanceur &&
              onUpdate([
                ...(financeurs ?? []),
                {
                  financeurTag: selectedFinanceur,
                  financeurTagId: selectedFinanceur.id,
                  ficheId: financeurs?.[0].ficheId ?? 0,
                  montantTtc: null,
                },
              ])
            }
          />
        </Field>
      </div>
    </>
  );
};

export default FinanceursInput;
