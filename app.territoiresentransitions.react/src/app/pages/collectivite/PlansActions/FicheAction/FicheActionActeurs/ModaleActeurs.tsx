import { FicheAction } from '@/api/plan-actions';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import PartenairesDropdown from '@/app/ui/dropdownLists/PartenairesDropdown/PartenairesDropdown';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import StructuresDropdown from '@/app/ui/dropdownLists/StructuresDropdown/StructuresDropdown';
import CiblesDropdown from '@/app/ui/dropdownLists/ficheAction/CiblesDropdown/CiblesDropdown';
import ParticipationCitoyenneDropdown from '@/app/ui/dropdownLists/ficheAction/ParticipationCitoyenneDropdown/ParticipationCitoyenneDropdown';
import {
  Field,
  FormSectionGrid,
  Modal,
  ModalFooterOKCancel,
  Textarea,
  useEventTracker,
} from '@/ui';
import _ from 'lodash';
import { useState } from 'react';
import { updateFicheActionTagInList } from '../utils';

type ModaleActeursProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const ModaleActeurs = ({
  isOpen,
  setIsOpen,
  fiche,
  updateFiche,
}: ModaleActeursProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);

  const tracker = useEventTracker('app/fiche-action');
  const collectivite = useCurrentCollectivite();
  const collectiviteId = collectivite?.collectivite_id || null;

  const handleSave = () => {
    if (!_.isEqual(fiche, editedFiche)) {
      updateFiche(editedFiche);
    }
  };

  return (
    <Modal
      openState={{ isOpen, setIsOpen }}
      title="Acteurs du projet"
      size="lg"
      render={({ descriptionId }) => (
        <FormSectionGrid formSectionId={descriptionId}>
          {/* Directions ou services pilote */}
          <Field title="Direction ou service pilote">
            <ServicesPilotesDropdown
              placeholder="Sélectionnez ou créez un pilote"
              values={editedFiche.services?.map((s) => s.id)}
              onChange={({ services }) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  services,
                }))
              }
              onTagEdit={(editedTag) => {
                setEditedFiche((prevState) => ({
                  ...prevState,
                  services: updateFicheActionTagInList(
                    prevState.services,
                    editedTag
                  ),
                }));
              }}
            />
          </Field>

          {/* Structures pilote */}
          <Field title="Structure pilote">
            <StructuresDropdown
              values={editedFiche.structures?.map((s) => s.id)}
              onChange={({ structures }) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  structures,
                }))
              }
              onTagEdit={(editedTag) => {
                setEditedFiche((prevState) => ({
                  ...prevState,
                  structures: updateFicheActionTagInList(
                    prevState.structures,
                    editedTag
                  ),
                }));
              }}
            />
          </Field>

          {/* Élu·e référent·e */}
          <Field title="Élu·e référent·e">
            <PersonnesDropdown
              values={editedFiche.referents?.map((r) => getPersonneStringId(r))}
              placeholder="Sélectionnez ou créez un·e élu·e référent·e"
              onChange={({ personnes }) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  referents: personnes,
                }))
              }
            />
          </Field>

          {/* Partenaires */}
          <Field title="Partenaires">
            <PartenairesDropdown
              values={editedFiche.partenaires?.map((p) => p.id)}
              onChange={({ partenaires }) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  partenaires,
                }))
              }
              onTagEdit={(editedTag) => {
                setEditedFiche((prevState) => ({
                  ...prevState,
                  partenaires: updateFicheActionTagInList(
                    prevState.partenaires,
                    editedTag
                  ),
                }));
              }}
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
              collectiviteId &&
                tracker('validation_modale_acteurs_fa', {
                  collectivite_id: collectiviteId,
                });
              handleSave();
              close();
            },
          }}
        />
      )}
    />
  );
};

export default ModaleActeurs;
