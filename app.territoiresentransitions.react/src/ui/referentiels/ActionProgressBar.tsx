import {Tooltip} from '@material-ui/core';
import {toFixed} from 'utils/toFixed';
import {observer} from 'mobx-react-lite';
import {ScoreBloc} from 'core-logic/observables/scoreBloc';
import {referentielId} from 'utils/actions';
import {ActionScore} from 'types/ClientScore';
import {actionAvancementColors} from 'app/theme';

export const ActionProgressBar = observer(
  ({actionId, scoreBloc}: {actionId: string; scoreBloc: ScoreBloc}) => {
    const score = scoreBloc.getScore(actionId, referentielId(actionId));

    if (score === null) return null;

    return (
      <Tooltip
        title={
          <div style={{whiteSpace: 'pre-line'}}>
            {<_ProgressBarTooltipContent score={score} />}
          </div>
        }
      >
        <div>
          <_ColoredBar score={score} />
        </div>
      </Tooltip>
    );
  }
);

const _ColoredBar = ({score}: {score: ActionScore}) => {
  const max_point = Math.max(score.point_referentiel, score.point_potentiel);

  const percentageAgainstMaxPoints = (x: number): number =>
    (100 * x) / max_point;
  const fait_width = percentageAgainstMaxPoints(score.point_fait);
  const programme_width =
    percentageAgainstMaxPoints(score.point_programme) + fait_width;
  const pas_fait_width =
    percentageAgainstMaxPoints(score.point_pas_fait) + programme_width;

  const non_concerne_width = percentageAgainstMaxPoints(
    Math.max(score.point_referentiel - score.point_potentiel, 0)
  );

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
            borderRadius: 5,
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
              borderRadius: 5,
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
              borderRadius: 5,
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
              borderRadius: 5,
            }}
          />
          <div
            style={{
              minWidth: `${non_concerne_width}%`,
              backgroundColor: actionAvancementColors.non_concerne,
              minHeight: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              borderRadius: 5,
            }}
          />
        </div>
      </div>
    </div>
  );
};
const _formatAvancementScore = (
  avancementPoint: number,
  maxPoint: number
): string => {
  return `${maxPoint ? toFixed((avancementPoint / maxPoint) * 100) : 0}%`;
};

const _ProgressBarTooltipAvancementContent = ({
  prefix,
  avancementPoint,
  maxPoint,
}: {
  prefix: string;
  avancementPoint: number;
  maxPoint: number;
}) =>
  avancementPoint < 1e-3 ? (
    <div>
      {prefix} : {_formatAvancementScore(avancementPoint, maxPoint)}{' '}
    </div>
  ) : null;

const _ProgressBarTooltipContent = ({score}: {score: ActionScore}) => {
  const max_point = Math.max(score.point_referentiel, score.point_potentiel);

  const point_non_concerne = Math.max(
    score.point_referentiel - score.point_potentiel,
    0
  );
  return (
    <div className="text-base">
      <_ProgressBarTooltipAvancementContent
        prefix={'Fait'}
        avancementPoint={score.point_fait}
        maxPoint={max_point}
      />
      <_ProgressBarTooltipAvancementContent
        prefix={'Programmé'}
        avancementPoint={score.point_programme}
        maxPoint={max_point}
      />
      <_ProgressBarTooltipAvancementContent
        prefix={'Pas fait'}
        avancementPoint={score.point_pas_fait}
        maxPoint={max_point}
      />

      <_ProgressBarTooltipAvancementContent
        prefix={'Non concerné'}
        avancementPoint={point_non_concerne}
        maxPoint={max_point}
      />
      <_ProgressBarTooltipAvancementContent
        prefix={'Non renseigné'}
        avancementPoint={score.point_non_renseigne}
        maxPoint={max_point}
      />
    </div>
  );
};
