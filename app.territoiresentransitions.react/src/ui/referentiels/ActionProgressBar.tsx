import {Tooltip} from '@material-ui/core';
import {toFixed} from 'utils/toFixed';
import {ActionScore} from 'types/ClientScore';
import {actionAvancementColors} from 'app/theme';
import {useActionScore} from 'core-logic/hooks/scoreHooks';
import {TweenText} from 'ui/shared/TweenText';
import {TActionAvancementExt} from 'types/alias';
import {avancementToLabel} from 'app/labels';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';

export const ActionProgressBar = ({
  score,
  actionType,
  // actionType ne sera plus nécessaire une fois l'affichage des scores par % généralisé
  className,
}: {
  score: ActionScore | null;
  actionType: string;
  className?: string;
}) => {
  if (score === null || score.point_potentiel < 1e-3) return null;

  return (
    <Tooltip
      title={
        <div style={{whiteSpace: 'pre-line'}}>
          {<ProgressBarTooltipContent actionType={actionType} score={score} />}
        </div>
      }
    >
      <div data-test={`score-${score.action_id}`} className={className}>
        <ColoredBar actionType={actionType} score={score} />
      </div>
    </Tooltip>
  );
};

const ColoredBar = ({
  actionType,
  score,
}: {
  actionType: string;
  score: ActionScore;
}) => {
  const percentageAgainstPotentiel = (x: number): number =>
    (100 * x) / score.point_potentiel;
  const fait_width =
    actionType === 'tache'
      ? score.fait_taches_avancement * 100
      : percentageAgainstPotentiel(score.point_fait);
  const programme_width =
    (actionType === 'tache'
      ? score.programme_taches_avancement * 100
      : percentageAgainstPotentiel(score.point_programme)) + fait_width;
  const pas_fait_width =
    (actionType === 'tache'
      ? score.pas_fait_taches_avancement * 100
      : percentageAgainstPotentiel(score.point_pas_fait)) + programme_width;

  const _barStyle = {borderRadius: 4};
  const animationClasses = 'transition-width duration-500 ease-in-out';
  return (
    <div className="flex gap-3 items-center justify-end">
      <div className="text-sm font-bold">
        <TweenText text={`${toFixed(fait_width)} %`} align-right />
      </div>
      <div className="flex pt-1">
        <div
          style={{
            minWidth: 100,
            minHeight: 10,
            backgroundColor: actionAvancementColors.non_renseigne,
            position: 'relative',
            ..._barStyle,
          }}
          className={animationClasses}
        >
          <div
            style={{
              minWidth: `${pas_fait_width}%`,
              backgroundColor: actionAvancementColors.pas_fait,
              minHeight: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              ..._barStyle,
            }}
            className={animationClasses}
          />
          <div
            style={{
              minWidth: `${programme_width}%`,
              backgroundColor: actionAvancementColors.programme,
              minHeight: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              ..._barStyle,
            }}
            className={animationClasses}
          />
          <div
            style={{
              minWidth: `${fait_width}%`,
              backgroundColor: actionAvancementColors.fait,
              minHeight: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              ..._barStyle,
            }}
            className={animationClasses}
          />
        </div>
      </div>
    </div>
  );
};

const formatAvancementScore = (
  avancementPoint: number,
  maxPoint: number
): string => {
  return `${maxPoint ? toFixed((avancementPoint / maxPoint) * 100) : 0}`;
};

const Square = ({size, color}: {size: number; color: string}) => (
  <svg width={size} height={size}>
    <rect fill={color} stroke="white" width={size} height={size} />
  </svg>
);

const ProgressBarTooltipAvancementContent = ({
  actionType,
  avancement,
  avancementPoint,
  potentielPoint,
  avancementScore,
}: {
  actionType: string;
  avancement: TActionAvancementExt;
  avancementPoint: number;
  potentielPoint: number;
  avancementScore: number;
}) =>
  avancementPoint > 1e-3 ? (
    <div className="flex flex-row items-center">
      <Square size={16} color={actionAvancementColors[avancement]} />
      <span className="pl-2">
        {`${avancementToLabel[avancement]} : ${
          actionType === 'tache'
            ? avancementScore * 100
            : formatAvancementScore(avancementPoint, potentielPoint)
        } %`}
      </span>
    </div>
  ) : null;

const ProgressBarTooltipContent = ({
  actionType,
  score,
}: {
  actionType: string;
  score: ActionScore;
}) => {
  return (
    <div className="text-base">
      <ProgressBarTooltipAvancementContent
        actionType={actionType}
        avancement="fait"
        avancementPoint={score.point_fait}
        potentielPoint={score.point_potentiel}
        avancementScore={score.fait_taches_avancement}
      />
      <ProgressBarTooltipAvancementContent
        actionType={actionType}
        avancement="programme"
        avancementPoint={score.point_programme}
        potentielPoint={score.point_potentiel}
        avancementScore={score.programme_taches_avancement}
      />
      <ProgressBarTooltipAvancementContent
        actionType={actionType}
        avancement="pas_fait"
        avancementPoint={score.point_pas_fait}
        potentielPoint={score.point_potentiel}
        avancementScore={score.pas_fait_taches_avancement}
      />

      <ProgressBarTooltipAvancementContent
        actionType={actionType}
        avancement="non_renseigne"
        avancementPoint={score.point_non_renseigne}
        potentielPoint={score.point_potentiel}
        avancementScore={
          1 -
          score.fait_taches_avancement -
          score.programme_taches_avancement -
          score.pas_fait_taches_avancement
        }
      />
    </div>
  );
};

const ActionProgressBarConnected = ({
  action,
  // remettre actionId au lieu de action une fois l'affichage des scores par % généralisé
  className,
}: {
  action: ActionDefinitionSummary;
  className?: string;
}) => {
  const score = useActionScore(action.id);
  return (
    <ActionProgressBar
      actionType={action.type}
      score={score}
      className={className}
    />
  );
};

export default ActionProgressBarConnected;
