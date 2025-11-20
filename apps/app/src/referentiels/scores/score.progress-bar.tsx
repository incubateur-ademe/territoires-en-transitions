import { avancementToLabel } from '@/app/app/labels';
import { actionAvancementColors } from '@/app/app/theme';
import ProgressBarWithTooltip from '@/app/referentiels/scores/progress-bar-with-tooltip';
import { ActionType } from '@tet/domain/referentiels';
import { useScore } from '../use-snapshot';

type ScoreProgressBarProps = {
  className?: string;
  displayDoneValue?: boolean;
  valuePosition?: 'left' | 'right';
  id: string;
  identifiant: string;
  type: ActionType;
  externalCollectiviteId?: number;
};

export function ScoreProgressBar({
  id,
  identifiant,
  type,
  className,
  displayDoneValue = false,
  valuePosition,
  externalCollectiviteId,
}: ScoreProgressBarProps) {
  const score = useScore(id, externalCollectiviteId);
  const isReglementaire = identifiant.split('.').includes('0');

  if (
    score === undefined ||
    score.concerne !== true ||
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
