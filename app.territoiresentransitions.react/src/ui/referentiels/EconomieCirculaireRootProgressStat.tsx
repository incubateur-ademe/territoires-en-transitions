import {makeStyles} from '@material-ui/core';
import {progressStateColors} from 'app/theme';
import {useActionReferentielScore} from 'core-logic/hooks/actionReferentielScore';
import * as R from 'ramda';
import {useEffect, useState} from 'react';
import {ActionReferentielScoreStorable} from 'storables/ActionReferentielScoreStorable';
import {
  inferStateFromScore,
  percentageTextFromScore,
  ProgressState,
} from 'utils/progressStat';

const useStyle = makeStyles(
  R.mapObjIndexed(
    color => ({
      borderBottom: `solid .3rem ${color}`,
    }),
    progressStateColors
  )
);

export const RootProgressStat = (props: {
  state: ProgressState;
  score: ActionReferentielScoreStorable | null;
}) => {
  const classes = useStyle();
  return (
    <div className={`font-bold text-lg px-2 py-1 ${classes[props.state]}`}>
      {percentageTextFromScore(props.score)}
    </div>
  );
};

export const EconomieCirculaireRootProgressStat = () => {
  const storableId = ActionReferentielScoreStorable.buildId(
    'economie_circulaire'
  );
  const score = useActionReferentielScore(storableId);
  useEffect(() => {
    const state = inferStateFromScore(score);
    setState(state);
  }, [score]);

  const [state, setState] = useState<ProgressState>('alert');

  return <RootProgressStat score={score} state={state} />;
};
