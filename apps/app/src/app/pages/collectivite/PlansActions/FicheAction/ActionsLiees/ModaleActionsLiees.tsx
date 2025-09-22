import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { useUpdateFiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-update-fiche';
import MesuresReferentielsDropdown from '@/app/ui/dropdownLists/MesuresReferentielsDropdown/MesuresReferentielsDropdown';
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
  const ficheMesureIds = fiche.mesures?.map((mesure) => mesure.id);
  const [editedMesureIds, setEditedMesureIds] = useState(ficheMesureIds);

  const { mutate: updateFiche } = useUpdateFiche();

  useEffect(() => {
    if (isOpen) setEditedMesureIds(ficheMesureIds);
  }, [isOpen]);

  const handleSave = () => {
    if (!_.isEqual(ficheMesureIds, editedMesureIds)) {
      updateFiche({
        ficheId: fiche.id,
        ficheFields: {
          mesures: editedMesureIds?.map((id) => ({ id })),
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
        <Field fieldId={descriptionId} title="Mesures des référentiels">
          <MesuresReferentielsDropdown
            values={editedMesureIds}
            onChange={({ values }) => setEditedMesureIds(values as string[])}
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
