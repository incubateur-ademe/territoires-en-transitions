import {makeStyles} from '@material-ui/core';
import {progressStateColors} from 'app/theme';
import * as R from 'ramda';
import {inferStateFromScore, percentageTextFromScore} from 'utils/progressStat';
import {ActionScore} from 'types/ClientScore';

const useStyle = makeStyles(
  R.mapObjIndexed(
    color => ({
      borderBottom: `solid .3rem ${color}`,
    }),
    progressStateColors
  )
);

export const RootProgressStat = (props: {score: ActionScore | null}) => {
  const classes = useStyle();
  const state = inferStateFromScore(props.score);

  return (
    <div className={`font-bold text-lg px-2 py-1 ${classes[state]}`}>
      {percentageTextFromScore(props.score)}
    </div>
  );
};
