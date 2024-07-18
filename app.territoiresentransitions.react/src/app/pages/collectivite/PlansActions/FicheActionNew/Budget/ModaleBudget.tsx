import {useEffect, useState} from 'react';
import _ from 'lodash';
import {Button, Field, FormSectionGrid, Input, Modal, Textarea} from '@tet/ui';
import {FicheAction} from '../../FicheAction/data/types';
import FinanceursInput from './FinanceursInput';

type ModaleBudgetProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const ModaleBudget = ({
  isOpen,
  setIsOpen,
  fiche,
  updateFiche,
}: ModaleBudgetProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);

  useEffect(() => {
    if (isOpen) setEditedFiche(fiche);
  }, [isOpen, fiche]);

  const handleSave = () => {
    if (!_.isEqual(fiche, editedFiche)) {
      updateFiche(editedFiche);
    }
  };

  return (
    <Modal
      openState={{isOpen, setIsOpen}}
      title="Budget"
      size="lg"
      render={({descriptionId, close}) => (
        <div>
          <div id={descriptionId} className="flex flex-col gap-8">
            <FormSectionGrid>
              {/* Budget prévisionnel total */}
              <Field title="Budget prévisionnel total" className="col-span-2">
                <Input
                  type="number"
                  icon={{text: 'TTC'}}
                  value={editedFiche.budget_previsionnel?.toString() ?? ''}
                  onValueChange={values =>
                    setEditedFiche(prevState => ({
                      ...prevState,
                      budget_previsionnel: values.value
                        ? Number(values.value)
                        : null,
                    }))
                  }
                />
              </Field>

              {/* Financeurs */}
              <FinanceursInput
                financeurs={editedFiche.financeurs}
                onUpdate={financeurs =>
                  setEditedFiche(prevState => ({...prevState, financeurs}))
                }
              />

              {/* Financements */}
              <Field
                title="Financements"
                hint="Coûts unitaires, fonctionnement, investissement, recettes attendues, subventions…"
                className="col-span-2"
              >
                <Textarea
                  className="min-h-[120px]"
                  value={editedFiche.financements ?? ''}
                  onChange={evt =>
                    setEditedFiche(prevState => ({
                      ...prevState,
                      financements: (evt.target as HTMLTextAreaElement).value,
                    }))
                  }
                />
              </Field>
            </FormSectionGrid>
          </div>

          {/* Boutons pour valider / annuler les modifications */}
          <div className="flex justify-end gap-4 mt-12">
            <Button onClick={close} aria-label="Annuler" variant="outlined">
              Annuler
            </Button>
            <Button
              onClick={() => {
                handleSave();
                close();
              }}
              aria-label="Valider"
            >
              Valider
            </Button>
          </div>
        </div>
      )}
    />
  );
};

export default ModaleBudget;
