import { useCurrentCollectivite } from '@/api/collectivites';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { useActionStatut } from '@/app/referentiels/actions/action-statut/use-action-statut';
import { Divider } from '@/ui';
import ActionJustificationField from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/action/action.justification-field';
import SubactionCardActions from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/subaction/subaction-card.actions';
import SubactionCardHeader from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/subaction/subaction-card.header';
import { useState } from 'react';
import ScoreIndicatifLibelle from '../score-indicatif/score-indicatif.libelle';

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
