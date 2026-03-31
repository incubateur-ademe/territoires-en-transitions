import { StatutAvancementEnum } from '@tet/domain/referentiels';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import TaskCardsList from '../../../../app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/task/task.cards-list';
import { ActionListItem, useListActions } from '../use-list-actions';
import { useUpdateActionStatut } from './use-update-action-statut';

type Props = {
  action: Pick<ActionListItem, 'actionId' | 'nom' | 'childrenIds'>;
  openState: OpenState;
};

/**
 * Modale détaillant la liste des tâches d'une sous-action ("Détaillé à la tâche").
 * Evolution future : déplacement du contenu de la modale dans un panneau latéral
 * (à confirmer)
 */
export const ActionStatutDetailleALaTacheModal = ({
  action,
  openState,
}: Props) => {
  const { actionId, nom: actionName, childrenIds } = action;

  const { data: tasks = [] } = useListActions({
    actionIds: childrenIds,
  });

  const tasksWithStatusVisible = tasks.map((task) => ({
    ...task,
    score: {
      ...task.score,
      statut: task.score.avancement,
    },
  }));

  const { mutate: updateActionStatut, isPending } = useUpdateActionStatut();

  const handleValidate = () => {
    updateActionStatut({
      actionId,
      statut: StatutAvancementEnum.NON_RENSEIGNE,
    });
  };

  return (
    <Modal
      size="xl"
      title="Détailler l'avancement à la tâche"
      subTitle={`${actionId.split('_')[1]} ${actionName}`}
      openState={openState}
      noCloseButton={isPending}
      render={() => (
        <div className="flex flex-col gap-8">
          {tasksWithStatusVisible.length > 0 && (
            <TaskCardsList
              tasks={tasksWithStatusVisible}
              shouldShowJustifications
            />
          )}
        </div>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnOKProps={{
            variant: 'primary',
            children: 'Valider',
            disabled: isPending,
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
