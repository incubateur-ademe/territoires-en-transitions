import { useActionStatut } from '@/app/referentiels/actions/action-statut/use-action-statut';
import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Divider } from '@tet/ui';
import { useState } from 'react';
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
  const { isReadOnly } = useCurrentCollectivite();

  const [openDetailledModal, setOpenDetailledModal] = useState(false);

  const { statut } = useActionStatut(task.id);
  const { avancement, concerne } = statut || {};

  const isDetailled = avancement === 'detaille';
  const shouldDisplayProgressBar = concerne === true && isDetailled;

  return (
    <div className="flex flex-col gap-2 bg-grey-1 border border-grey-3 rounded-lg p-4">
      {/* En-tête */}
      <SubactionCardHeader
        subAction={task}
        hideStatus={hideStatus}
        shouldDisplayProgressBar={shouldDisplayProgressBar}
        openDetailledState={{
          isOpen: openDetailledModal,
          setIsOpen: setOpenDetailledModal,
        }}
      />

      {/* Informations sur les scores indicatifs */}
      <ScoreIndicatifLibelle actionId={task.id} />

      {!isReadOnly && (isDetailled || task.haveScoreIndicatif) && (
        <Divider color="light" className="-mb-6 mt-auto" />
      )}

      {/* Actions */}
      <SubactionCardActions
        actionId={task.id}
        haveScoreIndicatif={task.haveScoreIndicatif}
        isDetailled={isDetailled}
        setOpenDetailledModal={setOpenDetailledModal}
      />

      {/* Ajout de commentaire */}
      {showJustifications && (
        <>
          {!isReadOnly && (isDetailled || task.haveScoreIndicatif) && (
            <Divider color="light" className="-mb-6" />
          )}

          <ActionJustificationField
            actionId={task.id}
            placeholder="Ce champ est facultatif, il ne sera pas considéré lors de l’audit"
          />
        </>
      )}
    </div>
  );
};

export default TaskCard;
