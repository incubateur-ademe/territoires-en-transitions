import {ActionReferentiel} from 'generated/models/action_referentiel';
import {useEffect, useState} from 'react';
import {makeStyles, Tooltip} from '@material-ui/core';
import {progressStateColors} from 'app/theme';
import * as R from 'ramda';
import {
  inferStateFromScore,
  percentageTextFromScore,
  pointsTextFromScore,
  ProgressState,
  toFixed,
} from 'utils/progressStat';
import {observer} from 'mobx-react-lite';
import {ScoreBloc} from 'core-logic/observables/scoreBloc';
import {referentielId} from 'utils/actions';
import {ActionScore} from 'types/ClientScore';
import {avancementColors} from 'app/colors';

const useStyle = makeStyles(
  R.mapObjIndexed(
    color => ({
      borderColor: color,
    }),
    progressStateColors
  )
);

const TextProgressStatStatic = ({
  score,
  showPoints,
}: {
  score: ActionScore | null;
  showPoints: boolean;
}) => {
  const percentageText = percentageTextFromScore(score);

  if (score?.concerne === false) {
    return <span className="text-gray-700"> non concernée</span>;
  }
  return showPoints ? (
    <>
      <strong className="font-bold">{percentageText}</strong>
      {pointsTextFromScore(score)}
    </>
  ) : (
    <>
      <strong className="font-bold">{percentageText}</strong>
    </>
  );
};

export const ProgressStatStatic = observer(
  ({
    action,
    position,
    className,
    showPoints,
    scoreBloc,
  }: {
    action: ActionReferentiel;
    position: 'left' | 'right';
    className?: string;
    showPoints: boolean;
    scoreBloc: ScoreBloc;
  }) => {
    const classes = useStyle();

    // const storableId = ActionReferentielScoreStorable.buildId(action.id);
    // const score = useActionReferentielScore(storableId);
    const score = scoreBloc.getScore(action.id, referentielId(action.id));

    useEffect(() => {
      const state = inferStateFromScore(score);
      setState(state);
    }, [score]);

    const [state, setState] = useState<ProgressState>('nc');

    const positionDependentStyle =
      position === 'left'
        ? 'bl-8 pl-3 border-l-8'
        : 'bl-0 br-8 pl-2 pr-3 border-r-8';

    return (
      <div
        className={`py-1 text-base font-normal bg-white  bg-y ${
          classes[state]
        } ${className ? className : ''} ${positionDependentStyle}`}
      >
        <TextProgressStatStatic score={score} showPoints={showPoints} />
      </div>
    );
  }
);

const Gauge = (props: {score: ActionScore | null}) => {
  const makeStyle = (score: ActionScore | null) => {
    const state = inferStateFromScore(score);
    const color = progressStateColors[state];
    console.log(state, color);
    return {
      width: percentageTextFromScore(score),
      backgroundColor: color,
    };
  };
  return (
    <div className="w-9">
      <div className="h-2 bg-gray-300 rounded-md">
        <div
          className="rounded-md block relative h-2"
          style={makeStyle(props.score)}
        ></div>
      </div>
    </div>
  );
};

export const UiGaugeProgressStat = ({
  score,
  size,
  showPoints,
}: {
  score: ActionScore | null;
  size: 'xs' | 'sm';
  showPoints: boolean;
}) => {
  return (
    <div className="flex flex-col text-xs justify-items-end">
      <div className="flex items-center w-full justify-end space-x-1">
        <div className={`font-bold text-${size}`}>
          {percentageTextFromScore(score)}
        </div>
        <div className="w-10">
          <Gauge score={score} />
        </div>
      </div>
      <div className={`${showPoints ? 'flex justify-end pr-2' : 'hidden'}`}>
        {pointsTextFromScore(score)}
      </div>
    </div>
  );
};

export const ActionProgressBar = observer(
  ({
    action,
    size,
    scoreBloc,
  }: {
    action: ActionReferentiel;
    size: 'sm' | 'xs';
    scoreBloc: ScoreBloc;
  }) => {
    const score = scoreBloc.getScore(action.id, referentielId(action.id));
    return <UiGaugeProgressStat score={score} size={size} showPoints={true} />;
  }
);

export const ProgressBarStatic = observer(
  ({action, scoreBloc}: {action: ActionReferentiel; scoreBloc: ScoreBloc}) => {
    const score = scoreBloc.getScore(action.id, referentielId(action.id));

    if (score === null) return null;
    console.log('score', score);

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
