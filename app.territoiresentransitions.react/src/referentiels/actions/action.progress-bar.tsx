import { avancementToLabel } from '@/app/app/labels';
import { actionAvancementColors } from '@/app/app/theme';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { useActionScore } from '@/app/referentiels/score-hooks';
import ProgressBarWithTooltip from '@/app/referentiels/scores/progress-bar-with-tooltip';
import { ProgressBarStyleOptions } from '../scores/progress-bar';

export const ActionProgressBar = ({
  action,
  // remettre actionId au lieu de action une fois l'affichage des scores par % généralisé
  className,
  progressBarStyleOptions,
  // TODO(temporary): This prop is a temporary patch to only display percentage
  // in ActionHeader and SubActionHeader components. Should be revisited during
  // the score display refactoring.
  TEMP_displayValue = false,
}: {
  action: ActionDefinitionSummary;
  className?: string;
  progressBarStyleOptions?: ProgressBarStyleOptions;
  TEMP_displayValue?: boolean; // TEMP: see comment above
}) => {
  const score = useActionScore(action.id);

  const isReglementaire = action.identifiant.split('.').includes('0');

  if (score === null || (score.point_potentiel < 1e-3 && !isReglementaire))
    return null;

  const progressScore = [
    {
      label: avancementToLabel.fait,
      value:
        action.type === 'tache' || isReglementaire
          ? score.fait_taches_avancement
          : score.point_fait,
      color: actionAvancementColors.fait,
    },
    {
      label: avancementToLabel.programme,
      value:
        action.type === 'tache' || isReglementaire
          ? score.programme_taches_avancement
          : score.point_programme,
      color: actionAvancementColors.programme,
    },
    {
      label: avancementToLabel.pas_fait,
      value:
        action.type === 'tache' || isReglementaire
          ? score.pas_fait_taches_avancement
          : score.point_pas_fait,
      color: actionAvancementColors.pas_fait,
    },
  ];

  return (
    <div data-test={`score-${score.action_id}`} className={className}>
      <ProgressBarWithTooltip
        score={progressScore}
        total={
          isReglementaire
            ? score.total_taches_count - score.pas_concerne_taches_avancement
            : score.point_potentiel
        }
        defaultScore={{
          label: avancementToLabel.non_renseigne,
          color: actionAvancementColors.non_renseigne,
        }}
        percent={action.type === 'tache'}
        progressBarStyleOptions={progressBarStyleOptions}
        valueToDisplay={TEMP_displayValue ? avancementToLabel.fait : undefined}
      />
    </div>
  );
};

export default ActionProgressBar;
