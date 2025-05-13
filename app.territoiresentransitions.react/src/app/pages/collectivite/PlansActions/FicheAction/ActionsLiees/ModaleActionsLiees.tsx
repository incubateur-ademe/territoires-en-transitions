import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { useUpdateFiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-update-fiche';
import ActionsReferentielsDropdown from '@/app/ui/dropdownLists/ActionsReferentielsDropdown/ActionsReferentielsDropdown';
import { Field, Modal, ModalFooterOKCancel } from '@/ui';
import _ from 'lodash';
import { useEffect, useState } from 'react';

type ModaleActionsLieesProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: Fiche;
};

const ModaleActionsLiees = ({
  isOpen,
  setIsOpen,
  fiche,
}: ModaleActionsLieesProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);
  const { mutate: updateFiche } = useUpdateFiche();

  useEffect(() => {
    if (isOpen) setEditedFiche(fiche);
  }, [isOpen, fiche]);

  const handleSave = () => {
    if (!_.isEqual(fiche, editedFiche)) {
      updateFiche({
        ficheId: fiche.id,
        ficheFields: {
          mesures: editedFiche.mesures,
        },
      });
    }
  };

  return (
    <Modal
      openState={{ isOpen, setIsOpen }}
      title="Lier une mesure des référentiels"
      size="lg"
      render={({ descriptionId }) => (
        <Field fieldId={descriptionId} title="Mesures des référentiels liées">
          <ActionsReferentielsDropdown
            values={editedFiche.mesures?.map((action) => action.id)}
            onChange={({ actions }) =>
              setEditedFiche((prevState) => ({
                ...prevState,
                actions,
              }))
            }
          />
        </Field>
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

export default ModaleActionsLiees;
