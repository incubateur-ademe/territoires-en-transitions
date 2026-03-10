import { useCollectiviteId } from '@tet/api/collectivites';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import TasksList from '../../../../app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/task/task.cards-list';
import { useSaveActionStatut } from '../action-statut/use-action-statut';
import { ActionListItem } from '../use-list-actions';

type Props = {
  action: ActionListItem;
  openState: OpenState;
};

/**
 * Modale détaillant la liste des tâches d'une sous-action ("Détaillé à la tâche").
 * Evolution future : déplacement du contenu de la modale dans un panneau latéral
 * (à confirmer)
 */
const SubActionModal = ({ action, openState }: Props) => {
  const { actionId, nom: actionName } = action;
  const taskIds = action.childrenIds;

  const collectiviteId = useCollectiviteId();
  const { saveActionStatut, isLoading } = useSaveActionStatut();

  const handleValidate = () => {
    saveActionStatut({
      ...action.score,
      actionId,
      collectiviteId,
      avancement: 'non_renseigne',
      avancementDetaille: null,
      concerne: true,
    });
  };

  return (
    <Modal
      size="xl"
      title="Détailler l'avancement à la tâche"
      subTitle={`${actionId.split('_')[1]} ${actionName}`}
      openState={openState}
      noCloseButton={isLoading}
      render={() => (
        <div className="flex flex-col gap-8">
          {taskIds.length > 0 && (
            <TasksList taskIds={taskIds} shouldShowJustifications />
          )}
        </div>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnOKProps={{
            variant: 'primary',
            children: 'Valider',
            disabled: isLoading,
            onClick: () => {
              handleValidate();
              close();
            },
          }}
        />
      )}
    />
  );
};

export default SubActionModal;
