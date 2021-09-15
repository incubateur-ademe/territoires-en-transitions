import {useActionReferentielScore} from 'core-logic/hooks/actionReferentielScore';
import {ActionReferentielScoreStorable} from 'storables/ActionReferentielScoreStorable';
import {ActionReferentiel} from 'generated/models/action_referentiel';
import {useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core';
import {progressStateColors} from 'app/theme';
import * as R from 'ramda';
import {
  inferStateFromScore,
  percentageTextFromScore,
  ProgressState,
} from 'utils/progressStat';

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
  score: ActionReferentielScoreStorable | null;
  showPoints: boolean;
}) => {
  const percentageText = percentageTextFromScore(score);
  const pointsRatioText = score
    ? `(${score.points.toFixed(2)}/${score.potentiel.toFixed(2)})`
    : '(../..)';

  if (score?.avancement === 'non_concernee') {
    return <span className="text-gray-700"> non concernée</span>;
  }
  return (
    <>
      <strong className="font-bold">{percentageText}</strong>
      {showPoints && pointsRatioText}
    </>
  );
};

export const ProgressStatStatic = ({
  action,
  position,
  className,
  showPoints,
}: {
  action: ActionReferentiel;
  position: 'left' | 'right';
  className?: string;
  showPoints: boolean;
}) => {
  const classes = useStyle();

  const storableId = ActionReferentielScoreStorable.buildId(action.id);
  const score = useActionReferentielScore(storableId);

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
      className={`py-1 text-base font-normal bg-white  bg-y ${classes[state]} ${
        className ? className : ''
      } ${positionDependentStyle}`}
    >
      <TextProgressStatStatic score={score} showPoints={showPoints} />
    </div>
  );
};

export const UiGaugeProgressStat = ({
  score,
}: {
  score: ActionReferentielScoreStorable | null;
}) => {
  const makeStyle = (score: ActionReferentielScoreStorable | null) => {
    const state = inferStateFromScore(score);
    const color = progressStateColors[state];
    return {
      width: percentageTextFromScore(score),
      backgroundColor: color,
    };
  };
  return (
    <div className="flex items-center justify-between">
      <div className="font-bold text-xs">{percentageTextFromScore(score)}</div>
      <div className="w-2"></div>
      <div className="w-10">
        <div className="h-2 bg-gray-300 rounded-md">
          <div
            className="rounded-md block relative h-2"
            style={makeStyle(score)}
          ></div>
        </div>
      </div>
    </div>
  );
};

export const CurrentEpciGaugeProgressStat = ({
  action,
}: {
  action: ActionReferentiel;
}) => {
  const storableId = ActionReferentielScoreStorable.buildId(action.id);
  const score = useActionReferentielScore(storableId);

  return <UiGaugeProgressStat score={score} />;
};
