import { avancementToLabel } from '@/app/app/labels';
import { actionAvancementColors } from '@/app/app/theme';
import ProgressBarWithTooltip from '@/app/referentiels/scores/progress-bar-with-tooltip';
import { ActionTypeEnum } from '@tet/domain/referentiels';
import { ActionListItem } from '../actions/use-list-actions';

type ScoreProgressBarProps = {
  className?: string;
  displayDoneValue?: boolean;
  valuePosition?: 'left' | 'right';
  action?: ActionListItem;
};

export function ScoreProgressBar({
  action,
  className,
  displayDoneValue = false,
  valuePosition,
}: ScoreProgressBarProps) {
  if (!action) {
    return null;
  }

  const score = action.score;
  const isReglementaire = action.identifiant.split('.').includes('0');

  if (
    score === undefined ||
    score.concerne !== true ||
    (score.pointPotentiel < 1e-3 && !isReglementaire)
  ) {
    return null;
  }

  const isTache = action.actionType === ActionTypeEnum.TACHE;

  const progressScore = [
    {
      label: avancementToLabel.fait,
      value:
        isTache || isReglementaire
          ? score.faitTachesAvancement
          : score.pointFait,
      color: actionAvancementColors.fait,
    },
    {
      label: avancementToLabel.programme,
      value:
        isTache || isReglementaire
          ? score.programmeTachesAvancement
          : score.pointProgramme,
      color: actionAvancementColors.programme,
    },
    {
      label: avancementToLabel.pas_fait,
      value:
        isTache || isReglementaire
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
      percent={isTache}
      className={className}
    />
  );
}
