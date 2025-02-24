import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { StatusToSavePayload } from '@/app/referentiels/actions/sub-action-statut.dropdown';
import { useActionCommentaire } from '@/app/referentiels/use-action-commentaire';
import Markdown from '@/app/ui/Markdown';
import { Button, InfoTooltip } from '@/ui';
import { useEffect, useRef, useState } from 'react';
import { ActionCommentaire } from '../action-commentaire';
import { getHashFromUrl } from './sub-action.card';

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
    <div
      data-test={`task-${task.id}`}
      ref={ref}
      className="p-4 border border-grey-3 rounded-xl flex flex-col gap-2"
    >
      {/* Première ligne */}
      {/* <SubActionHeader
        actionDefinition={task}
        hideStatus={hideStatus}
        statusWarningMessage={statusWarningMessage}
        onSaveStatus={onSaveStatus}
      /> */}
      <h6 className="text-base mb-0">
        {task.identifiant} {task.nom}{' '}
        {task.description && (
          <InfoTooltip
            label={
              <Markdown
                content={task.description}
                className="max-w-sm font-normal"
              />
            }
            activatedBy="click"
            iconClassName="ml-2"
          />
        )}
      </h6>

      {/* Ajout de commentaire */}
      <div className="p-0">
        {openCommentaire || !!actionCommentaire?.commentaire ? (
          <ActionCommentaire
            action={task}
            autoFocus={openCommentaire}
            onSave={() => setOpenCommentaire(false)}
          />
        ) : (
          <Button
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
