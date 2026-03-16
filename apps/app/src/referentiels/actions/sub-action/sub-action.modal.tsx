import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { omit } from 'es-toolkit';
import TasksList from '../../../../app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/task/task.cards-list';
import { useActionSummaryChildren } from '../../referentiel-hooks';
import {
  useActionStatut,
  useSaveActionStatut,
} from '../action-statut/use-action-statut';

type Props = {
  actionDefinition: ActionDefinitionSummary;
  openState: OpenState;
};

/**
 * Modale détaillant la liste des tâches d'une sous-action ("Détaillé à la tâche").
 * Evolution future : déplacement du contenu de la modale dans un panneau latéral
 * (à confirmer)
 */
const SubActionModal = ({ actionDefinition, openState }: Props) => {
  const { id: actionId, nom: actionName } = actionDefinition;
  const tasks = useActionSummaryChildren(actionDefinition);
  const { statut, isLoading } = useActionStatut(actionId);
  const collectiviteId = useCollectiviteId();
  const { saveActionStatut, isLoading: isSaving } = useSaveActionStatut();

  const handleValidate = () => {
    saveActionStatut({
      ...(statut ? omit(statut, ['modifiedAt', 'modifiedBy']) : {}),
      actionId,
      collectiviteId,
      avancement: 'non_renseigne',
      avancementDetaille: null,
      concerne: true,
    });
  };

  const isPending = isLoading || isSaving;

  return (
    <Modal
      size="xl"
      title="Détailler l'avancement à la tâche"
      subTitle={`${actionId.split('_')[1]} ${actionName}`}
      openState={openState}
      noCloseButton={isPending}
      render={() => (
        <div className="flex flex-col gap-8">
          {tasks.length > 0 && (
            <TasksList
              tasks={tasks}
              hideStatus={false}
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

export default SubActionModal;
