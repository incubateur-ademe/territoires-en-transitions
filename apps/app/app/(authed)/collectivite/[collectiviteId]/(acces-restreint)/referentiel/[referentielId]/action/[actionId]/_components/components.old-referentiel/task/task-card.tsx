import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import {
  getIdentifiantFromActionId,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { ActionExplicationField } from '../../action-explication.field';
import ScoreIndicatifLibelle from '../../score-indicatif/score-indicatif.libelle';
import SubactionCardActions from '../subaction/subaction-card.actions';
import { SubactionCardHeader } from '../subaction/subaction-card.header';

type Props = {
  task: ActionListItem;
};

const TaskCard = ({ task }: Props) => {
  const { statut, concerne } = task.score;

  const isDetailled = statut === StatutAvancementEnum.DETAILLE_AU_POURCENTAGE;
  const shouldDisplayProgressBar = concerne === true && isDetailled;

  return (
    <div
      data-test={`Tache-${
        getIdentifiantFromActionId(task.actionId) || task.actionId
      }`}
      className="flex flex-col gap-2 bg-grey-1 border border-grey-3 rounded-lg p-4"
    >
      {/* En-tête */}
      <SubactionCardHeader
        subAction={task}
        shouldDisplayProgressBar={shouldDisplayProgressBar}
      />

      {/* Informations sur les scores indicatifs */}
      <ScoreIndicatifLibelle action={task} />

      {/* Actions */}
      <SubactionCardActions action={task} />

      {/* Ajout de commentaire */}
      <ActionExplicationField
        action={task}
        placeholder="Ce champ est facultatif, il ne sera pas considéré lors de l’audit"
      />
    </div>
  );
};

export default TaskCard;
