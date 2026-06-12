import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import {
  getIdentifiantFromActionId,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { ActionExplicationField } from '../action/action-explication.field';
import ScoreIndicatifLibelle from '../score-indicatif/score-indicatif.libelle';
import SubactionCardActions from '../subaction/subaction-card.actions';
import { SubactionCardHeader } from '../subaction/subaction-card.header';

type Props = {
  task: ActionListItem;
  showJustifications: boolean;
};

const TaskCard = ({ task, showJustifications }: Props) => {
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
      {showJustifications && (
        <ActionExplicationField
          action={task}
          placeholder="Ce champ n'est pas nécessairement consulté, merci de privilégier la description à la sous-mesure."
        />
      )}
    </div>
  );
};

export default TaskCard;
