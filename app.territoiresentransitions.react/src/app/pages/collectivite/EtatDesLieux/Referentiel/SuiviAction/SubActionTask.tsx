import { ActionDefinitionSummary } from '@/app/core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import { useActionCommentaire } from '@/app/core-logic/hooks/useActionCommentaire';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { StatusToSavePayload } from 'ui/referentiels/ActionStatusDropdown';
import { ActionCommentaire } from 'ui/shared/actions/ActionCommentaire';
import { SuiviScoreRow } from '../data/useScoreRealise';
import SubActionHeader from './SubActionHeader';

type SubActionTaskProps = {
  task: ActionDefinitionSummary;
  actionScores: { [actionId: string]: SuiviScoreRow };
  hideStatus?: boolean;
  statusWarningMessage?: boolean;
  onSaveStatus?: (payload: StatusToSavePayload) => void;
};

/**
 * Détail d'une tâche dans l'onglet suivi de l'action
 */

const SubActionTask = ({
  task,
  actionScores,
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
        action={task}
        actionScores={actionScores}
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
