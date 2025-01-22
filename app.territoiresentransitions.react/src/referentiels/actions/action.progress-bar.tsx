import { avancementToLabel } from '@/app/app/labels';
import { actionAvancementColors } from '@/app/app/theme';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { useActionScore } from '@/app/referentiels/DEPRECATED_score-hooks';
import ProgressBarWithTooltip from '@/app/referentiels/scores/progress-bar-with-tooltip';
import { ProgressBarStyleOptions } from '../scores/progress-bar';
import { useScore, useSnapshotFlagEnabled } from '../use-snapshot';

export const ActionProgressBar = ({
  actionDefinition,
  // remettre actionId au lieu de actionDefinition une fois l'affichage des scores par % généralisé
  className,
  progressBarStyleOptions,
  // TODO(temporary): This prop is a temporary patch to only display percentage
  // in ActionHeader and SubActionHeader components. Should be revisited during
  // the score display refactoring.
  TEMP_displayValue = false,
}: {
  actionDefinition: ActionDefinitionSummary;
  className?: string;
  progressBarStyleOptions?: ProgressBarStyleOptions;
  TEMP_displayValue?: boolean; // TEMP: see comment above
}) => {
  const score = useActionScore(actionDefinition.id);
  const isReglementaire = actionDefinition.identifiant.split('.').includes('0');

  const isSnapshotEnabled = useSnapshotFlagEnabled();
  if (isSnapshotEnabled) {
    return (
      <ActionProgressBar_Snapshot
        actionDefinition={actionDefinition}
        className={className}
        progressBarStyleOptions={progressBarStyleOptions}
        TEMP_displayValue={TEMP_displayValue}
      />
    );
  }

  if (score === null || (score.point_potentiel < 1e-3 && !isReglementaire)) {
    return null;
  }

  const progressScore = [
    {
      label: avancementToLabel.fait,
      value:
        actionDefinition.type === 'tache' || isReglementaire
          ? score.fait_taches_avancement
          : score.point_fait,
      color: actionAvancementColors.fait,
    },
    {
      label: avancementToLabel.programme,
      value:
        actionDefinition.type === 'tache' || isReglementaire
          ? score.programme_taches_avancement
          : score.point_programme,
      color: actionAvancementColors.programme,
    },
    {
      label: avancementToLabel.pas_fait,
      value:
        actionDefinition.type === 'tache' || isReglementaire
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
        percent={actionDefinition.type === 'tache'}
        progressBarStyleOptions={progressBarStyleOptions}
        valueToDisplay={TEMP_displayValue ? avancementToLabel.fait : undefined}
      />
    </div>
  );
};

export default ActionProgressBar;

// TODO-FLAG promot this component to replace the old one when snapshots will be validated in production
function ActionProgressBar_Snapshot({
  actionDefinition,
  progressBarStyleOptions,
  className,
  TEMP_displayValue = false,
}: {
  actionDefinition: ActionDefinitionSummary;
  progressBarStyleOptions?: ProgressBarStyleOptions;
  className?: string;
  // TODO(temporary): This prop is a temporary patch to only display percentage
  // in ActionHeader and SubActionHeader components. Should be revisited during
  // the score display refactoring.
  TEMP_displayValue?: boolean; // TEMP: see comment above
}) {
  const score = useScore(actionDefinition.id);
  const isReglementaire = actionDefinition.identifiant.split('.').includes('0');

  if (
    score === undefined ||
    (score.pointPotentiel < 1e-3 && !isReglementaire)
  ) {
    return null;
  }

  const progressScore = [
    {
      label: avancementToLabel.fait,
      value:
        actionDefinition.type === 'tache' || isReglementaire
          ? score.faitTachesAvancement
          : score.pointFait,
      color: actionAvancementColors.fait,
    },
    {
      label: avancementToLabel.programme,
      value:
        actionDefinition.type === 'tache' || isReglementaire
          ? score.programmeTachesAvancement
          : score.pointProgramme,
      color: actionAvancementColors.programme,
    },
    {
      label: avancementToLabel.pas_fait,
      value:
        actionDefinition.type === 'tache' || isReglementaire
          ? score.pasFaitTachesAvancement
          : score.pointPasFait,
      color: actionAvancementColors.pas_fait,
    },
  ];

  return (
    <div data-test={`score-${score.actionId}`} className={className}>
      <ProgressBarWithTooltip
        score={progressScore}
        total={
          isReglementaire
            ? score.totalTachesCount - (score.pasConcerneTachesAvancement ?? 0)
            : score.pointPotentiel ?? 0
        }
        defaultScore={{
          label: avancementToLabel.non_renseigne,
          color: actionAvancementColors.non_renseigne,
        }}
        valueToDisplay={TEMP_displayValue ? avancementToLabel.fait : undefined}
        percent={actionDefinition.type === 'tache'}
        progressBarStyleOptions={progressBarStyleOptions}
      />
    </div>
  );
}
