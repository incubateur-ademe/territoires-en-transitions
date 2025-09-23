import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { useUpdateFiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-update-fiche';
import MesuresReferentielsDropdown from '@/app/ui/dropdownLists/MesuresReferentielsDropdown/MesuresReferentielsDropdown';
import { Field, Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import _ from 'lodash';
import { useState } from 'react';

type ModaleActionsLieesProps = {
  openState: OpenState;
  fiche: Fiche;
};

const ModaleActionsLiees = ({ openState, fiche }: ModaleActionsLieesProps) => {
  const ficheMesureIds = fiche.mesures?.map((mesure) => mesure.id);
  const [editedMesureIds, setEditedMesureIds] = useState(ficheMesureIds);

  const { mutate: updateFiche } = useUpdateFiche();

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
      openState={openState}
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
