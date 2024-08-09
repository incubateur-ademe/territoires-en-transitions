import {useEffect, useState} from 'react';
import _ from 'lodash';
import {
  Field,
  FormSectionGrid,
  Input,
  Modal,
  ModalFooterOKCancel,
  Textarea,
} from '@tet/ui';
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
  }, [isOpen]);

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
      render={({descriptionId}) => (
        <FormSectionGrid formSectionId={descriptionId}>
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
      )}
      // Boutons pour valider / annuler les modifications
      renderFooter={({close}) => (
        <ModalFooterOKCancel
          btnCancelProps={{onClick: close}}
          btnOKProps={{
            onClick: () => {
              handleSave();
              close();
            },
          }}
        />
      )}
    />
  );
};

export default ModaleBudget;
