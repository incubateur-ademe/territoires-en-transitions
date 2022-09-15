import {Tooltip} from '@material-ui/core';
import {toFixed} from 'utils/toFixed';
import {ActionScore} from 'types/ClientScore';
import {actionAvancementColors} from 'app/theme';
import {useActionScore} from 'core-logic/hooks/scoreHooks';

export const ActionProgressBar = ({score}: {score: ActionScore | null}) => {
  if (score === null) return null;

  return (
    <Tooltip
      title={
        <div style={{whiteSpace: 'pre-line'}}>
          {<ProgressBarTooltipContent score={score} />}
        </div>
      }
    >
      <div data-test={`score-${score.action_id}`}>
        <ColoredBar score={score} />
      </div>
    </Tooltip>
  );
};

const ColoredBar = ({score}: {score: ActionScore}) => {
  if (score.point_potentiel < 1e-3) return null;
  const percentageAgainstPotentiel = (x: number): number =>
    (100 * x) / score.point_potentiel;
  const fait_width = percentageAgainstPotentiel(score.point_fait);
  const programme_width =
    percentageAgainstPotentiel(score.point_programme) + fait_width;
  const pas_fait_width =
    percentageAgainstPotentiel(score.point_pas_fait) + programme_width;

  const _barStyle = {borderRadius: 4};
  return (
    <div className="flex gap-3 items-center justify-end">
      <div className="text-sm font-bold">{toFixed(fait_width)} %</div>
      <div className="flex pt-1">
        <div
          style={{
            minWidth: 100,
            minHeight: 10,
            backgroundColor: actionAvancementColors.non_renseigne,
            position: 'relative',
            ..._barStyle,
          }}
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
  return `${maxPoint ? toFixed((avancementPoint / maxPoint) * 100) : 0}%`;
};

const ProgressBarTooltipAvancementContent = ({
  prefix,
  avancementPoint,
  potentielPoint,
}: {
  prefix: string;
  avancementPoint: number;
  potentielPoint: number;
}) =>
  avancementPoint > 1e-3 ? (
    <div>
      {prefix} : {formatAvancementScore(avancementPoint, potentielPoint)}{' '}
    </div>
  ) : null;

const ProgressBarTooltipContent = ({score}: {score: ActionScore}) => {
  return (
    <div className="text-base">
      <ProgressBarTooltipAvancementContent
        prefix={'Fait'}
        avancementPoint={score.point_fait}
        potentielPoint={score.point_potentiel}
      />
      <ProgressBarTooltipAvancementContent
        prefix={'Programmé'}
        avancementPoint={score.point_programme}
        potentielPoint={score.point_potentiel}
      />
      <ProgressBarTooltipAvancementContent
        prefix={'Pas fait'}
        avancementPoint={score.point_pas_fait}
        potentielPoint={score.point_potentiel}
      />

      <ProgressBarTooltipAvancementContent
        prefix={'Non renseigné'}
        avancementPoint={score.point_non_renseigne}
        potentielPoint={score.point_potentiel}
      />
    </div>
  );
};

export default ({actionId}: {actionId: string}) => {
  const score = useActionScore(actionId);
  return <ActionProgressBar score={score} />;
};
