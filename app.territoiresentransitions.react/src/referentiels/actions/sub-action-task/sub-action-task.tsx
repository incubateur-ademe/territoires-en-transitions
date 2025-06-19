import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import ActionField from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/action/action.field';
import { useEffect, useRef } from 'react';
import { getHashFromUrl } from '../../../../app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/subaction/subaction.card';
import { useActionCommentaire } from '../../use-action-commentaire';
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
      <ActionField
        actionId={task.id}
        placeholder="Ce champ est facultatif, il ne sera pas considéré lors de l’audit"
      />
    </div>
  );
};

export default SubActionTask;
