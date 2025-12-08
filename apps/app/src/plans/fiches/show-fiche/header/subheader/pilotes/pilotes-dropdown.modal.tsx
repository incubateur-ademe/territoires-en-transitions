import { getFicheAllEditorCollectiviteIds } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { useFicheContext } from '@/app/plans/fiches/show-fiche/context/fiche-context';
import BaseUpdateFicheModal from '@/app/plans/fiches/update-fiche/base-update-fiche.modal';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import { FicheWithRelations } from '@tet/domain/plans';
import { Field, FormSectionGrid, ModalFooterOKCancel } from '@tet/ui';
import { isEqual } from 'es-toolkit/predicate';
import { useState } from 'react';

type PilotesDropdownModalProps = {
  fiche: FicheWithRelations;
  onClose: () => void;
};

export const PilotesDropdownModal = ({
  fiche,
  onClose,
}: PilotesDropdownModalProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);
  const { updateFiche } = useFicheContext();

  const handleSave = () => {
    if (!isEqual(fiche, editedFiche)) {
      updateFiche({
        ficheId: fiche.id,
        ficheFields: { pilotes: editedFiche.pilotes },
      });
    }
  };

  return (
    <BaseUpdateFicheModal
      fiche={fiche}
      onClose={onClose}
      openState={{ isOpen: true, setIsOpen: () => {} }}
      title="Pilotes du projet"
      size="lg"
      render={({ descriptionId }) => (
        <FormSectionGrid formSectionId={descriptionId}>
          <Field title="Personne pilote" className="col-span-2">
            <PersonnesDropdown
              dataTest="personnes-pilotes"
              collectiviteIds={getFicheAllEditorCollectiviteIds(fiche)}
              values={editedFiche.pilotes?.map((p) => getPersonneStringId(p))}
              placeholder="Sélectionnez ou créez un pilote"
              onChange={({ personnes }) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  pilotes: personnes,
                }))
              }
              additionalKeysToInvalidate={[
                ['fiche_action', fiche.id.toString()],
              ]}
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
