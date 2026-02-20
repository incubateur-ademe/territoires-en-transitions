import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { ActionStatutCreate } from '@tet/domain/referentiels';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
import TasksList from '../../../../app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/task/task.cards-list';
import { useActionSummaryChildren } from '../../referentiel-hooks';
import { useSaveActionStatut } from '../action-statut/use-action-statut';
import AvancementDetailleSliderWithCheckbox from '../avancement-detaille/avancement-detaille.slider.with-checkbox';

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
  const [actionStatutUpdate, setActionStatutUpdate] =
    useState<ActionStatutCreate | null>(null);
  const { saveActionStatut } = useSaveActionStatut();
  const [percentageAvancement, setPercentageAvancement] = useState(false);

  return (
    <Modal
      size="xl"
      title="Détailler l'avancement"
      subTitle={`${actionId.split('_')[1]} ${actionName}`}
      openState={openState}
      render={() => (
        <div className="flex flex-col gap-8">
          {/* Slider pour détailler le score manuellement */}
          <AvancementDetailleSliderWithCheckbox
            className="my-8 px-12"
            actionId={actionId}
            conditionnalDisplay={tasks.length > 0}
            onAvancementDetailleUpdate={(actionStatutUpdate) => {
              actionStatutUpdate.avancement === 'detaille'
                ? setPercentageAvancement(true)
                : setPercentageAvancement(false);
              setActionStatutUpdate(actionStatutUpdate);
            }}
          />

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
            variant: percentageAvancement ? 'primary' : 'outlined',
            children: percentageAvancement ? 'Valider' : 'Fermer',
            onClick: () => {
              if (percentageAvancement && actionStatutUpdate) {
                saveActionStatut(actionStatutUpdate);
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
