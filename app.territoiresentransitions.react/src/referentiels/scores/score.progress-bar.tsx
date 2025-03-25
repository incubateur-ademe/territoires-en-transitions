import { avancementToLabel } from '@/app/app/labels';
import { actionAvancementColors } from '@/app/app/theme';
import { useActionScore } from '@/app/referentiels/DEPRECATED_score-hooks';
import ProgressBarWithTooltip from '@/app/referentiels/scores/progress-bar-with-tooltip';
import { ActionType } from '@/domain/referentiels';
import { useScore, useSnapshotFlagEnabled } from '../use-snapshot';

type ScoreProgressBarProps = {
  className?: string;
  displayDoneValue?: boolean;
  valuePosition?: 'left' | 'right';
  id: string;
  identifiant: string;
  type: ActionType;
};

export const ScoreProgressBar = ({
  id,
  identifiant,
  type,
  className,
  displayDoneValue = false,
  valuePosition,
}: ScoreProgressBarProps) => {
  const isSnapshotEnabled = useSnapshotFlagEnabled();
  const score = useActionScore(id, !isSnapshotEnabled);
  const isReglementaire = identifiant.split('.').includes('0');

  if (isSnapshotEnabled) {
    return (
      <ActionProgressBar_Snapshot
        displayDoneValue={displayDoneValue}
        valuePosition={valuePosition}
        className={className}
        id={id}
        identifiant={identifiant}
        type={type}
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
        type === 'tache' || isReglementaire
          ? score.fait_taches_avancement
          : score.point_fait,
      color: actionAvancementColors.fait,
    },
    {
      label: avancementToLabel.programme,
      value:
        type === 'tache' || isReglementaire
          ? score.programme_taches_avancement
          : score.point_programme,
      color: actionAvancementColors.programme,
    },
    {
      label: avancementToLabel.pas_fait,
      value:
        type === 'tache' || isReglementaire
          ? score.pas_fait_taches_avancement
          : score.point_pas_fait,
      color: actionAvancementColors.pas_fait,
    },
  ];

  return (
    <ProgressBarWithTooltip
      dataTest={`score-${score.action_id}`}
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
      percent={type === 'tache'}
      className={className}
      valueToDisplay={displayDoneValue ? avancementToLabel.fait : undefined}
      valuePosition={valuePosition}
    />
  );
};

export default ScoreProgressBar;

// TODO-FLAG promot this component to replace the old one when snapshots will be validated in production
function ActionProgressBar_Snapshot({
  id,
  identifiant,
  type,
  className,
  displayDoneValue = false,
  valuePosition,
}: ScoreProgressBarProps) {
  const score = useScore(id);
  const isReglementaire = identifiant.split('.').includes('0');

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
        type === 'tache' || isReglementaire
          ? score.faitTachesAvancement
          : score.pointFait,
      color: actionAvancementColors.fait,
    },
    {
      label: avancementToLabel.programme,
      value:
        type === 'tache' || isReglementaire
          ? score.programmeTachesAvancement
          : score.pointProgramme,
      color: actionAvancementColors.programme,
    },
    {
      label: avancementToLabel.pas_fait,
      value:
        type === 'tache' || isReglementaire
          ? score.pasFaitTachesAvancement
          : score.pointPasFait,
      color: actionAvancementColors.pas_fait,
    },
  ];

  return (
    <ProgressBarWithTooltip
      dataTest={`score-${score.actionId}`}
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
      valueToDisplay={displayDoneValue ? avancementToLabel.fait : undefined}
      valuePosition={valuePosition}
      percent={type === 'tache'}
      className={className}
    />
  );
}
