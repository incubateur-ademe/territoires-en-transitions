import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
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
      openState={{ isOpen: openState.isOpen, setIsOpen: openState.setIsOpen }}
      size="xl"
    >
      <Modal.Header>
        <Modal.Title>{appLabels.detaillerAvancementTache}</Modal.Title>
        <Modal.Subtitle>
          {`${actionId.split('_')[1]} ${actionName}`}
        </Modal.Subtitle>
      </Modal.Header>
      <Modal.Body>
        {tasks.length > 0 && (
          <TasksList
            tasks={tasks}
            hideStatus={false}
            shouldShowJustifications
          />
        )}
      </Modal.Body>
      <Modal.Footer>
        <Modal.Ok
          pending={isPending}
          onClick={() => {
            handleValidate();
            openState.setIsOpen(false);
          }}
        >
          {appLabels.valider}
        </Modal.Ok>
      </Modal.Footer>
    </Modal>
  );
};

export default SubActionModal;
