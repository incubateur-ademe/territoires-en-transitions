import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { getFicheAllEditorCollectiviteIds } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import BaseUpdateFicheModal from '@/app/plans/fiches/update-fiche/base-update-fiche.modal';
import PartenairesDropdown from '@/app/ui/dropdownLists/PartenairesDropdown/PartenairesDropdown';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import StructuresDropdown from '@/app/ui/dropdownLists/StructuresDropdown/StructuresDropdown';
import CiblesDropdown from '@/app/ui/dropdownLists/ficheAction/CiblesDropdown/CiblesDropdown';
import ParticipationCitoyenneDropdown from '@/app/ui/dropdownLists/ficheAction/ParticipationCitoyenneDropdown/ParticipationCitoyenneDropdown';
import {
  Event,
  Field,
  FormSectionGrid,
  ModalFooterOKCancel,
  Textarea,
  useEventTracker,
} from '@/ui';
import _ from 'lodash';
import { useState } from 'react';
import { useUpdateFiche } from '../data/use-update-fiche';

type ModaleActeursProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: Fiche;
};

const ModaleActeurs = ({ isOpen, setIsOpen, fiche }: ModaleActeursProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);
  const { mutate: updateFiche } = useUpdateFiche();

  const tracker = useEventTracker();

  const ficheActionInvalidationKeys = [['fiche_action', fiche.id.toString()]];

  const handleSave = () => {
    if (!_.isEqual(fiche, editedFiche)) {
      updateFiche({
        ficheId: fiche.id,
        ficheFields: {
          services: editedFiche.services,
          structures: editedFiche.structures,
          referents: editedFiche.referents,
          partenaires: editedFiche.partenaires,
          cibles: editedFiche.cibles,
          participationCitoyenneType: editedFiche.participationCitoyenneType,
          participationCitoyenne: editedFiche.participationCitoyenne,
        },
      });
    }
  };

  const allFicheCollectiviteIds = getFicheAllEditorCollectiviteIds(fiche);

  return (
    <BaseUpdateFicheModal
      fiche={fiche}
      openState={{ isOpen, setIsOpen }}
      title="Acteurs du projet"
      size="lg"
      render={({ descriptionId }) => (
        <FormSectionGrid formSectionId={descriptionId}>
          {/* Directions ou services pilote */}
          <Field title="Direction ou service pilote">
            <ServicesPilotesDropdown
              placeholder="Sélectionnez ou créez un pilote"
              collectiviteIds={allFicheCollectiviteIds}
              values={editedFiche.services?.map((s) => s.id)}
              onChange={({ services }) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  services,
                }))
              }
              additionalKeysToInvalidate={ficheActionInvalidationKeys}
            />
          </Field>

          {/* Structures pilote */}
          <Field title="Structure pilote">
            <StructuresDropdown
              values={editedFiche.structures?.map((s) => s.id)}
              collectiviteIds={allFicheCollectiviteIds}
              onChange={({ structures }) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  structures,
                }))
              }
              additionalKeysToInvalidate={ficheActionInvalidationKeys}
            />
          </Field>

          {/* Élu·e référent·e */}
          <Field title="Élu·e référent·e">
            <PersonnesDropdown
              values={editedFiche.referents?.map((r) => getPersonneStringId(r))}
              collectiviteIds={allFicheCollectiviteIds}
              placeholder="Sélectionnez ou créez un·e élu·e référent·e"
              onChange={({ personnes }) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  referents: personnes,
                }))
              }
              additionalKeysToInvalidate={ficheActionInvalidationKeys}
            />
          </Field>

          {/* Partenaires */}
          <Field title="Partenaires">
            <PartenairesDropdown
              values={editedFiche.partenaires?.map((p) => p.id)}
              collectiviteIds={allFicheCollectiviteIds}
              onChange={({ partenaires }) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  partenaires,
                }))
              }
              additionalKeysToInvalidate={ficheActionInvalidationKeys}
            />
          </Field>

          {/* Cibles */}
          <Field title="Cibles">
            <CiblesDropdown
              values={editedFiche.cibles ?? []}
              onChange={({ cibles }) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  cibles,
                }))
              }
            />
          </Field>

          {/* Participation citoyenne */}
          <Field title="Participation citoyenne" className="md:col-span-2">
            <ParticipationCitoyenneDropdown
              values={editedFiche.participationCitoyenneType}
              onChange={(participation) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  participationCitoyenneType: participation ?? null,
                }))
              }
            />
            <Textarea
              value={editedFiche.participationCitoyenne ?? ''}
              onChange={(evt) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  participationCitoyenne: (evt.target as HTMLTextAreaElement)
                    .value,
                }))
              }
              placeholder="Détaillez la participation citoyenne"
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
              tracker(Event.fiches.updateActeurs);
              close();
            },
          }}
        />
      )}
    />
  );
};

export default ModaleActeurs;
