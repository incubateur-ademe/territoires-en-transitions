import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { useActionStatut } from '@/app/referentiels/actions/action-statut/use-action-statut';
import ActionField from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/action/action.field';
import SubactionCardActions from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/subaction/subaction.card-actions';
import SubactionHeader from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/subaction/subaction.header';
import { useState } from 'react';
import ScoreIndicatifLibelle from '../score-indicatif/score-indicatif.libelle';

type Props = {
  task: ActionDefinitionSummary;
  hideStatus: boolean;
  showJustifications: boolean;
};

const TaskCard = ({ task, hideStatus, showJustifications }: Props) => {
  const [openDetailledModal, setOpenDetailledModal] = useState(false);

  const { statut } = useActionStatut(task.id);
  const { avancement, concerne } = statut || {};

  const isDetailled = avancement === 'detaille';
  const shouldDisplayProgressBar = concerne !== false && isDetailled;

  return (
    <div className="flex flex-col gap-2 bg-grey-1 border border-grey-3 rounded-lg p-4">
      {/* En-tête */}
      <SubactionHeader
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

      {/* Actions */}
      <SubactionCardActions
        actionId={task.id}
        haveScoreIndicatif={task.haveScoreIndicatif}
        isDetailled={isDetailled}
        setOpenDetailledModal={setOpenDetailledModal}
      />

      {/* Ajout de commentaire */}
      {showJustifications && (
        <ActionField
          actionId={task.id}
          placeholder="Ce champ est facultatif, il ne sera pas considéré lors de l’audit"
        />
      )}
    </div>
  );
};

export default TaskCard;
