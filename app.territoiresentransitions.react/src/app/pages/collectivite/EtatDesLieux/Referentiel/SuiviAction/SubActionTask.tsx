import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useActionCommentaire} from 'core-logic/hooks/useActionCommentaire';
import {useState} from 'react';
import {ActionCommentaire} from 'ui/shared/actions/ActionCommentaire';
import SubActionHeader from './SubActionHeader';

type SubActionTaskProps = {
  task: ActionDefinitionSummary;
};

/**
 * Détail d'une tâche dans l'onglet suivi de l'action
 */

const SubActionTask = ({task}: SubActionTaskProps): JSX.Element => {
  const [openCommentaire, setOpenCommentaire] = useState(false);
  const {actionCommentaire} = useActionCommentaire(task.id);

  return (
    <div data-test={`task-${task.id}`}>
      {/* Première ligne */}
      <SubActionHeader action={task} />

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
