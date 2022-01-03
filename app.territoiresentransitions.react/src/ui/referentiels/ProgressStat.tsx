import {ActionReferentiel} from 'generated/models/action_referentiel';
import {useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core';
import {progressStateColors} from 'app/theme';
import * as R from 'ramda';
import {
  inferStateFromScore,
  percentageTextFromScore,
  pointsTextFromScore,
  ProgressState,
} from 'utils/progressStat';
import {observer} from 'mobx-react-lite';
import {ScoreBloc} from 'core-logic/observables/scoreBloc';
import {referentielId} from 'utils/actions';
import {ActionScore} from 'types/ClientScore';

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

export const CurrentEpciGaugeProgressStat = observer(
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
