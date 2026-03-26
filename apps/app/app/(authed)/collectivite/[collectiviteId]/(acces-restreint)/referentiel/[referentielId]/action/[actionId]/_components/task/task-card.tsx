import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  getIdentifiantFromActionId,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { Divider } from '@tet/ui';
import { useState } from 'react';
import { ActionJustificationField } from '../action/action.justification-field';
import ScoreIndicatifLibelle from '../score-indicatif/score-indicatif.libelle';
import SubactionCardActions from '../subaction/subaction-card.actions';
import { SubactionCardHeader } from '../subaction/subaction-card.header';

type Props = {
  task: ActionListItem;
  showJustifications: boolean;
};

const TaskCard = ({ task, showJustifications }: Props) => {
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const canEditReferentiel = hasCollectivitePermission('referentiels.mutate');

  const [openDetailledModal, setOpenDetailledModal] = useState(false);

  const { statut, concerne } = task.score;

  const isDetailled = statut === StatutAvancementEnum.DETAILLE;
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
        openDetailledState={{
          isOpen: openDetailledModal,
          setIsOpen: setOpenDetailledModal,
        }}
      />

      {/* Informations sur les scores indicatifs */}
      <ScoreIndicatifLibelle actionId={task.actionId} />

      {canEditReferentiel && (isDetailled || task.scoreIndicatif) && (
        <Divider />
      )}

      {/* Actions */}
      <SubactionCardActions
        actionId={task.actionId}
        haveScoreIndicatif={Boolean(task.scoreIndicatif)}
        isDetailled={isDetailled}
        setOpenDetailledModal={setOpenDetailledModal}
      />

      {/* Ajout de commentaire */}
      {showJustifications && (
        <>
          {canEditReferentiel &&
            (isDetailled || Boolean(task.scoreIndicatif)) && <Divider />}

          <ActionJustificationField
            actionId={task.actionId}
            placeholder="Ce champ est facultatif, il ne sera pas considéré lors de l’audit"
          />
        </>
      )}
    </div>
  );
};

export default TaskCard;
