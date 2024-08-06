import {Button, Field, Input} from '@tet/ui';
import {Financeur} from '../../FicheAction/data/types';
import FinanceursDropdown from 'ui/dropdownLists/FinanceursDropdown/FinanceursDropdownSingle';

type FinanceursInputProps = {
  financeurs: Financeur[] | null;
  onUpdate: (financeurs: Financeur[]) => void;
};

const FinanceursInput = ({financeurs, onUpdate}: FinanceursInputProps) => {
  return (
    <>
      {/* Liste des financeurs */}
      {(financeurs ?? []).map((financeur, index) => (
        <div
          key={`${financeur.financeur_tag.nom}-${index}`}
          className="col-span-2 grid grid-cols-7 gap-4"
        >
          <Field title={`Financeur ${index + 1}`} className="col-span-3">
            <FinanceursDropdown
              value={financeur.financeur_tag?.id}
              disabled={true}
              onChange={() => {}}
            />
          </Field>
          <Field title="Montant engagé" className="col-span-4">
            <div className="flex gap-4 justify-between">
              <Input
                containerClassname="w-full"
                type="number"
                icon={{text: 'TTC'}}
                value={financeur.montant_ttc?.toString() ?? ''}
                placeholder="Ajouter un montant"
                onValueChange={values =>
                  onUpdate(
                    (financeurs ?? []).map(f =>
                      f.financeur_tag.id === financeur.financeur_tag.id
                        ? {
                            ...f,
                            montant_ttc: values.value
                              ? Number(values.value)
                              : undefined,
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
                      f => f.financeur_tag.id !== financeur.financeur_tag.id
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
            value={undefined}
            disabledOptionsIds={(financeurs ?? []).map(
              f => f.financeur_tag.id!
            )}
            onChange={value =>
              value && onUpdate([...(financeurs ?? []), {financeur_tag: value}])
            }
          />
        </Field>
      </div>
    </>
  );
};

export default FinanceursInput;
