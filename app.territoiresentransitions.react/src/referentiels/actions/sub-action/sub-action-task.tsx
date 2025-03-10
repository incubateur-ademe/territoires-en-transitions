import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { ActionCommentaire } from '@/app/referentiels/actions/action-commentaire';
import { StatusToSavePayload } from '@/app/referentiels/actions/sub-action-statut.dropdown';
import { useActionCommentaire } from '@/app/referentiels/use-action-commentaire';
import { Button } from '@/ui';
import { useEffect, useRef, useState } from 'react';
import { getHashFromUrl } from './sub-action.card';
import SubActionHeader from './sub-action.header';

type SubActionTaskProps = {
  task: ActionDefinitionSummary;
  hideStatus?: boolean;
  statusWarningMessage?: boolean;
  onSaveStatus?: (payload: StatusToSavePayload) => void;
};

/**
 * Détail d'une tâche dans l'onglet suivi de l'action
 */

const SubActionTask = ({
  task,
  hideStatus = false,
  statusWarningMessage = false,
  onSaveStatus,
}: SubActionTaskProps): JSX.Element => {
  const [openCommentaire, setOpenCommentaire] = useState(false);
  const { actionCommentaire } = useActionCommentaire(task.id);
  const ref = useRef<HTMLDivElement>(null);

  // scroll jusqu'à la tâche indiquée dans l'url
  const hash = getHashFromUrl();

  useEffect(() => {
    if (hash === task.id && ref && ref.current) {
      setTimeout(() => {
        ref.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }, 0);
    }
  }, [hash, ref, task.id]);

  return (
    <div data-test={`task-${task.id}`} ref={ref}>
      {/* Première ligne */}
      <SubActionHeader
        actionDefinition={task}
        hideStatus={hideStatus}
        statusWarningMessage={statusWarningMessage}
        onSaveStatus={onSaveStatus}
      />

      {/* Ajout de commentaire */}
      <div className="p-0 pb-4">
        {openCommentaire || !!actionCommentaire?.commentaire ? (
          <ActionCommentaire
            action={task}
            autoFocus={openCommentaire}
            onSave={() => setOpenCommentaire(false)}
          />
        ) : (
          <Button
            dataTest="btn-commentaire"
            icon="pencil-line"
            title="Explications sur l'état d'avancement"
            onClick={() => setOpenCommentaire(true)}
            variant="grey"
            size="xs"
          />
        )}
      </div>
    </div>
  );
};

export default SubActionTask;
