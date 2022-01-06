import {ActionReferentiel} from 'generated/models/action_referentiel';
import {Tooltip} from '@material-ui/core';
import {toFixed} from 'utils/toFixed';
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
    <div className="flex gap-3 items-center justify-end">
      <div className="text-sm font-bold">{toFixed(fait_width)} %</div>
      <div className="flex pt-1">
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
    </div>
  );
};
const _formatAvancementScore = (
  avancementPoint: number,
  potentielPoint: number,
  preffixIfSome: string,
  suffixIfSome: string
): string => {
  const avancementPercentage = potentielPoint
    ? toFixed((avancementPoint / potentielPoint) * 100)
    : 0;
  return avancementPercentage
    ? `${preffixIfSome}${avancementPercentage}%${suffixIfSome}`
    : '';
};

const _ProgressBarTooltipContent = ({score}: {score: ActionScore}) => {
  const point_non_concerne = Math.max(
    score.point_referentiel - score.point_potentiel,
    0
  );
  return (
    <div className="text-base">
      {_formatAvancementScore(
        score.point_fait,
        score.point_potentiel,
        'fait: ',
        ' / '
      )}
      {_formatAvancementScore(
        score.point_programme,
        score.point_potentiel,
        'programmé: ',
        ' / '
      )}
      {_formatAvancementScore(
        score.point_pas_fait,
        score.point_potentiel,
        'pas-fait: ',
        ' / '
      )}
      {_formatAvancementScore(
        point_non_concerne,
        score.point_potentiel,
        'non concerné: ',
        ' / '
      )}
      {_formatAvancementScore(
        score.point_non_renseigne,
        score.point_potentiel,
        'non renseigné: ',
        '.'
      )}
    </div>
  );
};
