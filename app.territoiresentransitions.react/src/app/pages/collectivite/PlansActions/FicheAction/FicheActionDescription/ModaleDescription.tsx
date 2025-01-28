import { FicheAction } from '@/api/plan-actions';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import SousThematiquesDropdown from '@/app/ui/dropdownLists/SousThematiquesDropdown/SousThematiquesDropdown';
import TagsSuiviPersoDropdown from '@/app/ui/dropdownLists/TagsSuiviPersoDropdown/TagsSuiviPersoDropdown';
import ThematiquesDropdown from '@/app/ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import { getMaxLengthMessage } from '@/app/utils/formatUtils';
import { Thematique } from '@/domain/shared';
import {
  AutoResizedTextarea,
  Button,
  Field,
  FormSectionGrid,
  Input,
  Modal,
  ModalFooterOKCancel,
  useEventTracker,
} from '@/ui';
import _ from 'lodash';
import { useState } from 'react';

const DESCRIPTION_MAX_LENGTH = 20000;
const MOYENS_MAX_LENGTH = 10000;
const INSTANCES_MAX_LENGTH = 10000;

/**
 * Bouton + modale pour l'édition des informations principales d'une fiche action
 */
type ModaleDescriptionProps = {
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const ModaleDescription = ({ fiche, updateFiche }: ModaleDescriptionProps) => {
  const [editedFiche, setEditedFiche] = useState(fiche);

  const tracker = useEventTracker('app/fiche-action');
  const { collectiviteId, niveauAcces, role } = useCurrentCollectivite()!;

  const handleSave = () => {
    if (!_.isEqual(fiche, editedFiche)) {
      const titleToSave = (editedFiche.titre ?? '').trim();
      updateFiche({
        ...editedFiche,
        titre: titleToSave.length ? titleToSave : null,
      });
    }
  };

  return (
    <Modal
      title="Modifier la fiche"
      size="lg"
      render={({ descriptionId }) => (
        <FormSectionGrid formSectionId={descriptionId}>
          {/* Nom de la fiche action */}
          <Field title="Nom de la fiche action" className="col-span-2">
            <Input
              type="text"
              value={editedFiche.titre ?? ''}
              onChange={(evt) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  titre: evt.target.value,
                }))
              }
            />
          </Field>

          {/* Dropdown thématiques */}
          <Field title="Thématique">
            <ThematiquesDropdown
              values={editedFiche.thematiques?.map((t) => t.id)}
              onChange={({ thematiques }) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  thematiques: thematiques,
                }))
              }
            />
          </Field>

          {/* Dropdown sous-thématiques */}
          <Field title="Sous-thématique">
            <SousThematiquesDropdown
              thematiques={(editedFiche.thematiques ?? []).map(
                (t: Thematique) => t.id
              )}
              sousThematiques={editedFiche.sousThematiques}
              onChange={({ sousThematiques }) => {
                setEditedFiche((prevState) => ({
                  ...prevState,
                  sousThematiques,
                }));
              }}
            />
          </Field>

          {/* Dropdown tags personnalisés */}
          <Field title="Mes tags de suivi" className="col-span-2">
            <TagsSuiviPersoDropdown
              values={editedFiche.libresTag?.map((t) => t.id)}
              onChange={({ libresTag }) =>
                setEditedFiche((prevState) => ({ ...prevState, libresTag }))
              }
              additionalKeysToInvalidate={[
                ['fiche_action', fiche.id.toString()],
              ]}
            />
          </Field>

          {/* Description */}
          <Field
            title="Description de l'action"
            className="col-span-2"
            state={
              editedFiche.description?.length === DESCRIPTION_MAX_LENGTH
                ? 'info'
                : 'default'
            }
            message={getMaxLengthMessage(
              editedFiche.description ?? '',
              DESCRIPTION_MAX_LENGTH
            )}
          >
            <AutoResizedTextarea
              className="min-h-[100px]"
              value={editedFiche.description ?? ''}
              maxLength={DESCRIPTION_MAX_LENGTH}
              onChange={(evt) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  description: (evt.target as HTMLTextAreaElement).value,
                }))
              }
            />
          </Field>

          {/* Ressources */}
          <Field
            title="Moyens humains et techniques"
            className="col-span-2"
            state={
              editedFiche.ressources?.length === MOYENS_MAX_LENGTH
                ? 'info'
                : 'default'
            }
            message={getMaxLengthMessage(
              editedFiche.ressources ?? '',
              MOYENS_MAX_LENGTH
            )}
          >
            <AutoResizedTextarea
              className="min-h-[100px]"
              value={editedFiche.ressources ?? ''}
              maxLength={MOYENS_MAX_LENGTH}
              onChange={(evt) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  ressources: (evt.target as HTMLTextAreaElement).value,
                }))
              }
            />
          </Field>

          {/* Instances de gouvernance */}
          <Field
            title="Instances de gouvernance"
            className="col-span-2"
            state={
              editedFiche.instanceGouvernance?.length === INSTANCES_MAX_LENGTH
                ? 'info'
                : 'default'
            }
            message={getMaxLengthMessage(
              editedFiche.instanceGouvernance ?? '',
              INSTANCES_MAX_LENGTH
            )}
          >
            <AutoResizedTextarea
              className="min-h-[100px]"
              value={editedFiche.instanceGouvernance ?? ''}
              maxLength={INSTANCES_MAX_LENGTH}
              onChange={(evt) =>
                setEditedFiche((prevState) => ({
                  ...prevState,
                  instanceGouvernance: (evt.target as HTMLTextAreaElement)
                    .value,
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
              collectiviteId &&
                tracker('validation_modale_modifier_fa', {
                  collectiviteId,
                  niveauAcces,
                  role,
                });
              handleSave();
              close();
            },
          }}
        />
      )}
    >
      {/* Bouton d'ouverture de la modale */}
      <Button
        icon="edit-fill"
        title="Modifier les informations"
        variant="white"
        size="xs"
        className="h-fit"
        onClick={() => setEditedFiche(fiche)}
      />
    </Modal>
  );
};

export default ModaleDescription;
