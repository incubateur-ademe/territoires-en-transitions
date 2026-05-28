import { appLabels } from '@/app/labels/catalog';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import TaskCardsList from '../../../../app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/components.old-referentiel/task/task.cards-list';
import { ActionListItem, useListActions } from '../use-list-actions';

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

  return (
    <Modal
      size="xl"
      title={appLabels.detaillerAvancementTache}
      subTitle={`${actionId.split('_')[1]} ${actionName}`}
      openState={openState}
      render={() => (
        <div className="flex flex-col gap-8">
          {tasks.length > 0 && <TaskCardsList tasks={tasks} />}
        </div>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnOKProps={{
            variant: 'primary',
            children: appLabels.valider,
            onClick: close,
          }}
        />
      )}
    />
  );
};
