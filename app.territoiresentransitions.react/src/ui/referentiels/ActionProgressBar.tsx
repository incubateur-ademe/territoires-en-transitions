import {actionAvancementColors} from 'app/theme';
import {useActionScore} from 'core-logic/hooks/scoreHooks';
import {avancementToLabel} from 'app/labels';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import ProgressBarWithTooltip from 'ui/score/ProgressBarWithTooltip';

export const ActionProgressBar = ({
  action,
  // remettre actionId au lieu de action une fois l'affichage des scores par % généralisé
  className,
}: {
  action: ActionDefinitionSummary;
  className?: string;
}) => {
  const score = useActionScore(action.id);

  if (score === null || score.point_potentiel < 1e-3) return null;

  const progressScore = [
    {
      label: avancementToLabel.fait,
      value:
        action.type === 'tache'
          ? score.fait_taches_avancement
          : score.point_fait,
      color: actionAvancementColors.fait,
    },
    {
      label: avancementToLabel.programme,
      value:
        action.type === 'tache'
          ? score.programme_taches_avancement
          : score.point_programme,
      color: actionAvancementColors.programme,
    },
    {
      label: avancementToLabel.pas_fait,
      value:
        action.type === 'tache'
          ? score.pas_fait_taches_avancement
          : score.point_pas_fait,
      color: actionAvancementColors.pas_fait,
    },
  ];

  return (
    <div data-test={`score-${score.action_id}`} className={className}>
      <ProgressBarWithTooltip
        score={progressScore}
        total={score.point_potentiel}
        defaultScore={{
          label: avancementToLabel.non_renseigne,
          color: actionAvancementColors.non_renseigne,
        }}
        valueToDisplay={avancementToLabel.fait}
        percent={action.type === 'tache'}
      />
    </div>
  );
};

export default ActionProgressBar;
