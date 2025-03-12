import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { useEffect, useRef } from 'react';
import { useActionCommentaire } from '../../use-action-commentaire';
import { ActionCommentaire } from '../action-commentaire';
import { getHashFromUrl } from '../sub-action/sub-action.card';
import TaskHeader from './sub-action-task.header';

type SubActionTaskProps = {
  task: ActionDefinitionSummary;
  hideStatus?: boolean;
};

/**
 * Détail d'une tâche dans l'onglet suivi de l'action
 */

const SubActionTask = ({
  task,
  hideStatus = false,
}: SubActionTaskProps): JSX.Element => {
  const ref = useRef<HTMLDivElement>(null);
  const collectivite = useCurrentCollectivite();
  const { actionCommentaire } = useActionCommentaire(task.id);

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
      className="p-4 border border-grey-3 rounded-xl flex flex-col gap-4"
    >
      {/* Header */}
      <TaskHeader {...{ task, hideStatus }} />

      {/* Ajout de commentaire */}
      {!collectivite?.isReadOnly ? (
        <ActionCommentaire
          action={task}
          placeholder="Ajouter une description"
        />
      ) : (
        !!actionCommentaire && (
          <p className="text-sm text-grey-8 mb-0">
            {actionCommentaire.commentaire}
          </p>
        )
      )}
    </div>
  );
};

export default SubActionTask;
