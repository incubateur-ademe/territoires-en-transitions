import FinanceursDropdown from '@/app/ui/dropdownLists/FinanceursDropdown/FinanceursDropdown';
import { Financeur } from '@/domain/plans';
import { Button, Field, Input } from '@/ui';

type FinanceursInputProps = {
  financeurs: Financeur[] | null | undefined;
  collectiviteIds?: number[];
  onUpdate: (financeurs: Financeur[] | null | undefined) => void;
};

export const FinanceursInput = ({
  financeurs,
  onUpdate,
  collectiviteIds,
}: FinanceursInputProps) => {
  return (
    <div className="flex flex-col gap-6">
      {(financeurs ?? []).map((financeur, index) => (
        <div
          key={`${financeur.financeurTag.nom}-${index}`}
          className="col-span-2 grid grid-cols-7 gap-4"
        >
          <Field title={`Financeur ${index + 1}`} className="col-span-3">
            <FinanceursDropdown
              collectiviteIds={collectiviteIds}
              values={
                financeur.financeurTag.id
                  ? [financeur.financeurTag.id]
                  : undefined
              }
              disabled={true}
              onChange={() => ({})}
            />
          </Field>
          <Field title="Montant de subvention obtenu" className="col-span-4">
            <div className="flex gap-4 justify-between">
              <Input
                containerClassname="w-full"
                type="number"
                icon={{ text: 'HT' }}
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

      <div className="col-span-2 grid grid-cols-7 gap-4">
        <Field title="Ajouter un financeur" className="col-span-3">
          <FinanceursDropdown
            collectiviteIds={collectiviteIds}
            key={(financeurs ?? []).length}
            placeholder="Sélectionnez ou créez un tag"
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
                  ficheId: financeurs?.[0]?.ficheId ?? 0,
                  montantTtc: null,
                },
              ])
            }
          />
        </Field>
      </div>
    </div>
  );
};
