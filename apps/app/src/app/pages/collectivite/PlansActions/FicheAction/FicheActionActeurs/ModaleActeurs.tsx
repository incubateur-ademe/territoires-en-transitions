import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import SelectPartenairesCombobox from '@/app/collectivites/tags/select-partenaires.combobox';
import SelectPersonnesCombobox from '@/app/collectivites/tags/select-personnes.combobox';
import SelectServicesPilotesCombobox from '@/app/collectivites/tags/select-service-pilotes.combobox';
import SelectStructuresCombobox from '@/app/collectivites/tags/select-structures.combobox';
import { getFicheAllEditorCollectiviteIds } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import CiblesDropdown from '@/app/ui/dropdownLists/ficheAction/CiblesDropdown/CiblesDropdown';
import ParticipationCitoyenneDropdown from '@/app/ui/dropdownLists/ficheAction/ParticipationCitoyenneDropdown/ParticipationCitoyenneDropdown';
import { FicheWithRelations } from '@tet/domain/plans';
import {
  Event,
  Field,
  FormSectionGrid,
  ModalFooterOKCancel,
  Textarea,
  useEventTracker,
} from '@tet/ui';
import { isEqual } from 'es-toolkit/predicate';
import { useState } from 'react';
import BaseUpdateFicheModal from '../FicheActionPlanning/base-update-fiche-modal';

type ModaleActeursProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: FicheWithRelations;
};

const ModaleActeurs = ({ isOpen, setIsOpen, fiche }: ModaleActeursProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);
  const { mutate: updateFiche } = useUpdateFiche();

  const tracker = useEventTracker();

  const handleSave = () => {
    if (!isEqual(fiche, editedFiche)) {
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
            <SelectServicesPilotesCombobox
              placeholder="Sélectionnez ou créez un pilote"
              collectiviteIds={allFicheCollectiviteIds}
              values={editedFiche.services?.map((s) => s.id)}
              onChange={({ services }) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  services,
                }))
              }
            />
          </Field>

          {/* Structures pilote */}
          <Field title="Structure pilote">
            <SelectStructuresCombobox
              values={editedFiche.structures?.map((s) => s.id)}
              collectiviteIds={allFicheCollectiviteIds}
              onChange={({ structures }) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  structures,
                }))
              }
            />
          </Field>

          {/* Élu·e référent·e */}
          <Field title="Élu·e référent·e">
            <SelectPersonnesCombobox
              values={editedFiche.referents?.map((r) => getPersonneStringId(r))}
              collectiviteIds={allFicheCollectiviteIds}
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
            <SelectPartenairesCombobox
              values={editedFiche.partenaires?.map((p) => p.id)}
              collectiviteIds={allFicheCollectiviteIds}
              onChange={({ partenaires }) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  partenaires,
                }))
              }
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
