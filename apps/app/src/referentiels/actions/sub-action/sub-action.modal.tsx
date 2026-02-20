import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { useCollectiviteId } from '@tet/api/collectivites';
import { ActionStatutCreate } from '@tet/domain/referentiels';
import { Checkbox, Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { omit } from 'es-toolkit';
import { ChangeEvent, useEffect, useState } from 'react';
import TasksList from '../../../../app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/task/task.cards-list';
import { useActionSummaryChildren } from '../../referentiel-hooks';
import { AVANCEMENT_DETAILLE_PAR_STATUT } from '../../utils';
import {
  useActionStatut,
  useSaveActionStatut,
} from '../action-statut/use-action-statut';
import AvancementDetailleSlider, {
  AvancementValues,
} from '../avancement-detaille/avancement-detaille.slider';

type Props = {
  actionDefinition: ActionDefinitionSummary;
  openState: OpenState;
};

/**
 * Modale détaillant la liste des tâches d'une sous-action
 * Evolution future : déplacement du contenu de la modale dans un panneau latéral
 * (à confirmer)
 */

const SubActionModal = ({ actionDefinition, openState }: Props) => {
  const { id: actionId, nom: actionName } = actionDefinition;
  const tasks = useActionSummaryChildren(actionDefinition);
  const { statut, isLoading } = useActionStatut(actionId);
  const collectiviteId = useCollectiviteId();
  const [actionStatutUpdate, setActionStatutUpdate] =
    useState<ActionStatutCreate | null>(null);
  const { saveActionStatut } = useSaveActionStatut();
  const [percentageAvancement, setPercentageAvancement] = useState(false);

  useEffect(() => {
    if (!isLoading && statut && !actionStatutUpdate) {
      setActionStatutUpdate(omit(statut, ['modifiedAt', 'modifiedBy']));
      setPercentageAvancement(statut.avancement === 'detaille');
    }
  }, [statut]);

  if (!actionStatutUpdate) {
    return null;
  }

  // Switch entre les deux types de remplissage de l'avancement
  // Sauvegarde du nouveau statut (détaillé / non renseigné) au click sur le switch
  const handleSwitchPercentageScore = (evt: ChangeEvent<HTMLInputElement>) => {
    const isChecked = evt.currentTarget.checked;
    const { avancementDetaille } = actionStatutUpdate || {};
    const isScoreDetailleFilled =
      avancementDetaille?.length === 3 &&
      !avancementDetaille.find((av) => av === 1);
    const newActionStatutUpdate: ActionStatutCreate = isChecked
      ? {
          ...actionStatutUpdate,
          collectiviteId,
          avancement: 'detaille',
          avancementDetaille: (isScoreDetailleFilled
            ? avancementDetaille
            : AVANCEMENT_DETAILLE_PAR_STATUT.detaille) as AvancementValues,
          concerne: true,
        }
      : {
          ...actionStatutUpdate,
          collectiviteId,
          avancement: 'non_renseigne',
          avancementDetaille: null,
          concerne: true,
        };

    setActionStatutUpdate(newActionStatutUpdate);
    setPercentageAvancement(isChecked);
  };

  const handleSaveScoreDetaille = (values: AvancementValues) => {
    // Si la jauge est à 100% dans un des statuts, le statut
    // est mis à jour automatiquement
    const avancement =
      values[0] === 1
        ? 'fait'
        : values[1] === 1
        ? 'programme'
        : values[2] === 1
        ? 'pas_fait'
        : 'detaille';

    const newActionStatutUpdate: ActionStatutCreate = {
      ...actionStatutUpdate,
      collectiviteId,
      avancement,
      avancementDetaille: values,
      concerne: true,
    };

    setActionStatutUpdate(newActionStatutUpdate);
  };

  return (
    <Modal
      size="xl"
      title="Détailler l'avancement"
      subTitle={`${actionId.split('_')[1]} ${actionName}`}
      openState={openState}
      render={() => (
        <div className="flex flex-col gap-8">
          {/* Slider pour détailler le score manuellement */}
          <div className="flex flex-col gap-4">
            {/* Switch pour passer au mode manuel */}
            <Checkbox
              variant="switch"
              label="Détailler l’avancement au pourcentage"
              checked={percentageAvancement}
              onChange={handleSwitchPercentageScore}
            />

            {/* Slider pour détailler le score manuellement */}
            {percentageAvancement && (
              <AvancementDetailleSlider
                avancement={
                  (actionStatutUpdate.avancementDetaille ||
                    AVANCEMENT_DETAILLE_PAR_STATUT.detaille) as AvancementValues
                }
                onChange={handleSaveScoreDetaille}
              />
            )}
          </div>

          {/* Liste des tâches */}
          {tasks.length > 0 && (
            <TasksList
              tasks={tasks}
              hideStatus={percentageAvancement}
              shouldShowJustifications
            />
          )}
        </div>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={
            percentageAvancement
              ? {
                  children: 'Annuler',
                  onClick: close,
                }
              : undefined
          }
          btnOKProps={{
            variant: 'primary',
            children: 'Valider',
            onClick: () => {
              if (percentageAvancement) {
                saveActionStatut(actionStatutUpdate);
              } else {
                // Si on valide le détaillé à la tâche, on met le statut de la sous-action à non renseigné. Un peu étrang, mais manière dont cela fonctionne actuellement.
                saveActionStatut({
                  ...(statut ? omit(statut, ['modifiedAt', 'modifiedBy']) : {}),
                  actionId,
                  collectiviteId,
                  avancement: 'non_renseigne',
                  avancementDetaille: null,
                  concerne: true,
                });
              }
              close();
            },
          }}
        />
      )}
    />
  );
};

export default SubActionModal;
