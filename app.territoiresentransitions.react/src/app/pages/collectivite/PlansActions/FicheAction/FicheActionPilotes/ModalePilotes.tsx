import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { getFicheAllEditorCollectiviteIds } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import BaseUpdateFicheModal from '@/app/plans/fiches/update-fiche/base-update-fiche.modal';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import { Field, FormSectionGrid, ModalFooterOKCancel } from '@/ui';
import _ from 'lodash';
import { useState } from 'react';
import { useUpdateFiche } from '../data/use-update-fiche';

type ModalePilotesProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: Fiche;
};

const ModalePilotes = ({ isOpen, setIsOpen, fiche }: ModalePilotesProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);
  const { mutate: updateFiche } = useUpdateFiche();

  const handleSave = () => {
    if (!_.isEqual(fiche, editedFiche)) {
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
