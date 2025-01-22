import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { ActionCommentaire } from '@/app/referentiels/actions/action-commentaire';
import { StatusToSavePayload } from '@/app/referentiels/actions/sub-action-statut.dropdown';
import { useActionCommentaire } from '@/app/referentiels/use-action-commentaire';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
  const { hash } = useLocation();

  useEffect(() => {
    const id = hash.slice(1); // enlève le "#" au début du hash
    if (id === task.id && ref && ref.current) {
      setTimeout(() => {
        ref.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }, 0);
    }
  }, [hash, ref]);

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
          <button
            className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-pencil-line box-border"
            title="Explications sur l'état d'avancement"
            onClick={() => setOpenCommentaire(true)}
          />
        )}
      </div>
    </div>
  );
};

export default SubActionTask;
