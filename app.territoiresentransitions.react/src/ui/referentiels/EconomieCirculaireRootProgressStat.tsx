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
  const classes = useStyle();

  return (
    <div className={`font-bold text-lg px-2 py-1 ${classes[state]}`}>
      {percentageTextFromScore(score)}
    </div>
  );
};
