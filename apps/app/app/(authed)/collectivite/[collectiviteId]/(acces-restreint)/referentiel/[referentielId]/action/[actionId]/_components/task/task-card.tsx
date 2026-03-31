import { useActionStatut } from '@/app/referentiels/actions/action-statut/use-action-statut';
import { useHideAction } from '@/app/referentiels/actions/action-statut/use-hide-action';
import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { getIdentifiantFromActionId } from '@tet/domain/referentiels';
import { ActionJustificationField } from '../action/action.justification-field';
import ScoreIndicatifLibelle from '../score-indicatif/score-indicatif.libelle';
import SubactionCardActions from '../subaction/subaction-card.actions';
import { SubactionCardHeader } from '../subaction/subaction-card.header';

type Props = {
  task: ActionDefinitionSummary;
  hideStatus: boolean;
  showJustifications: boolean;
};

const TaskCard = ({ task, hideStatus, showJustifications }: Props) => {
  const { statut } = useActionStatut(task.id);
  const { hide } = useHideAction(task.id);
  const { avancement, concerne } = statut || {};

  const isDetailled = avancement === 'detaille';
  const shouldDisplayProgressBar = concerne === true && isDetailled;

  if (hide) {
    return null;
  }

  return (
    <div
      data-test={`Tache-${getIdentifiantFromActionId(task.id) || task.id}`}
      className="flex flex-col gap-2 bg-grey-1 border border-grey-3 rounded-lg p-4"
    >
      {/* En-tête */}
      <SubactionCardHeader
        subAction={task}
        hideStatus={hideStatus}
        shouldDisplayProgressBar={shouldDisplayProgressBar}
      />

      {/* Informations sur les scores indicatifs */}
      <ScoreIndicatifLibelle actionId={task.id} />

      {/* Actions */}
      <SubactionCardActions action={task} />

      {/* Ajout de commentaire */}
      {showJustifications && (
        <ActionJustificationField
          actionId={task.id}
          placeholder="Ce champ est facultatif, il ne sera pas considéré lors de l’audit"
        />
      )}
    </div>
  );
};

export default TaskCard;
