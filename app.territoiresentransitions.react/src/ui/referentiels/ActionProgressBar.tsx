import {ActionReferentiel} from 'generated/models/action_referentiel';
import {Tooltip} from '@material-ui/core';
import {toFixed} from 'utils/progressStat';
import {observer} from 'mobx-react-lite';
import {ScoreBloc} from 'core-logic/observables/scoreBloc';
import {referentielId} from 'utils/actions';
import {ActionScore} from 'types/ClientScore';
import {avancementColors} from 'app/colors';

export const ActionProgressBar = observer(
  ({action, scoreBloc}: {action: ActionReferentiel; scoreBloc: ScoreBloc}) => {
    const score = scoreBloc.getScore(action.id, referentielId(action.id));

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
    <div>
      <div className="flex">
        <div
          style={{
            minWidth: 100,
            minHeight: 10,
            backgroundColor: avancementColors.non_renseigne,
            position: 'relative',
            borderRadius: 5,
          }}
        >
          <div
            style={{
              minWidth: `${pas_fait_width}%`,
              backgroundColor: avancementColors.pas_fait,
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
              backgroundColor: avancementColors.programme,
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
              backgroundColor: avancementColors.fait,
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
              backgroundColor: avancementColors.non_concerne,
              minHeight: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              borderRadius: 5,
            }}
          />
        </div>
      </div>
      <div>
        <div>
          {' '}
          <span className="text-base">{toFixed(fait_width)}%</span>{' '}
          <span className="text-sm font-light">réalisé</span>
        </div>{' '}
        <div>
          {' '}
          <span className="text-base">{toFixed(programme_width)}%</span>{' '}
          <span className="text-sm font-light">prévisionnel</span>
        </div>{' '}
      </div>
    </div>
  );
};
const _formatScoreWithLabelAndPercentage = (
  avancementPoint: number,
  potentielPoint: number,
  suffixIfSome: string,
  labelIfZero: string
): string => {
  const avancementPercentage = potentielPoint
    ? toFixed((avancementPoint / potentielPoint) * 100)
    : 0;
  return (
    (avancementPoint
      ? `${toFixed(avancementPoint)} ${suffixIfSome}`
      : labelIfZero) + ` (${avancementPercentage}%)`
  );
};

const _ProgressBarTooltipContent = ({score}: {score: ActionScore}) => (
  <ul>
    <li>{toFixed(score.point_referentiel)} points selon le référentiel</li>
    <li>
      {toFixed(score.point_potentiel)} points après redistribution
      {score.point_potentiel ? ' dont :' : ''}
    </li>
    {score.point_potentiel ? (
      <ul className="mt-0 pt-0">
        <li>
          {`${_formatScoreWithLabelAndPercentage(
            score.point_fait,
            score.point_potentiel,
            'points faits',
            'aucun point fait'
          )}`}
        </li>
        <li>
          {`${_formatScoreWithLabelAndPercentage(
            score.point_programme,
            score.point_potentiel,
            'points programmés',
            'aucun point programmé'
          )}`}
        </li>
        <li>
          {`${_formatScoreWithLabelAndPercentage(
            score.point_pas_fait,
            score.point_potentiel,
            'points pas faits',
            'aucun point pas fait'
          )}`}
        </li>
        <li>
          {`${_formatScoreWithLabelAndPercentage(
            score.point_non_renseigne,
            score.point_potentiel,
            'points non renseignés',
            'aucun point non renseigné'
          )}`}
        </li>
      </ul>
    ) : (
      ''
    )}
  </ul>
);
