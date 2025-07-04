import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { useUpdateFiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-update-fiche';
import { getFicheAllEditorCollectiviteIds } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import {
  Field,
  FormSectionGrid,
  Input,
  Modal,
  ModalFooterOKCancel,
  Textarea,
} from '@/ui';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import FinanceursInput from './FinanceursInput';
type ModaleBudgetProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: Fiche;
};

const ModaleBudget = ({ isOpen, setIsOpen, fiche }: ModaleBudgetProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);
  const { mutate: updateFiche } = useUpdateFiche();

  useEffect(() => {
    if (isOpen) setEditedFiche(fiche);
  }, [isOpen]);

  const handleSave = () => {
    if (!_.isEqual(fiche, editedFiche)) {
      updateFiche({
        ficheId: fiche.id,
        ficheFields: {
          budgetPrevisionnel: editedFiche.budgetPrevisionnel,
          financeurs: editedFiche.financeurs,
          financements: editedFiche.financements,
        },
      });
    }
  };

  return (
    <Modal
      openState={{ isOpen, setIsOpen }}
      title="Budget"
      size="lg"
      render={({ descriptionId }) => (
        <FormSectionGrid formSectionId={descriptionId}>
          {/* Budget prévisionnel total */}
          <Field title="Budget prévisionnel total" className="col-span-2">
            <Input
              type="number"
              icon={{ text: 'TTC' }}
              value={editedFiche.budgetPrevisionnel?.toString() ?? ''}
              onValueChange={(values) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  budgetPrevisionnel: values.value ?? null,
                }))
              }
            />
          </Field>

          {/* Financeurs */}
          <FinanceursInput
            financeurs={editedFiche.financeurs}
            collectiviteIds={getFicheAllEditorCollectiviteIds(fiche)}
            onUpdate={(financeurs) =>
              setEditedFiche((prevState) => ({
                ...prevState,
                financeurs: financeurs ?? null,
              }))
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
              onChange={(evt) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  financements: (evt.target as HTMLTextAreaElement).value,
                }))
              }
            />
          </Field>
        </FormSectionGrid>
      )}
      // Boutons pour valider / annuler les modifications
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
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
