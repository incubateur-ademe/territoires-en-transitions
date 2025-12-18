import { getFicheAllEditorCollectiviteIds } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import { Field, FormSectionGrid, ModalFooterOKCancel } from '@tet/ui';
import { isEqual } from 'es-toolkit/predicate';
import { useState } from 'react';
import { Fiche } from '../data/use-get-fiche';
import BaseUpdateFicheModal from '../FicheActionPlanning/base-update-fiche-modal';

type ModalePilotesProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: Fiche;
};

const ModalePilotes = ({ isOpen, setIsOpen, fiche }: ModalePilotesProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);
  const { mutate: updateFiche } = useUpdateFiche();

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
      openState={{ isOpen, setIsOpen }}
      title="Pilotes du projet"
      size="lg"
      render={({ descriptionId }) => (
        <FormSectionGrid formSectionId={descriptionId}>
          {/* Personnes pilote */}
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

export default ModalePilotes;
