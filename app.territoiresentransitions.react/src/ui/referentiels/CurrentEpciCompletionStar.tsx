import {ActionReferentiel} from 'generated/models';
import {ActionReferentielScoreStorable} from 'storables';
import {useActionReferentielScore} from 'core-logic/hooks/actionReferentielScore';
import {useEffect, useState} from 'react';
import star from './star.png';

const JaugeStar = (props: {fillPercentage: number}) => {
  const cacheStyle = {
    height: `${20 * (1 - props.fillPercentage / 100)}px`,
  };

  return (
    <div className="relative flex justify-center">
      <div className="bg-white opacity-70 w-5 absolute" style={cacheStyle} />
      <div className="">
        <img className="h-5 w-5" src={star} />
      </div>
    </div>
  );
};

export const CompletionStar = ({
  score,
}: {
  score: ActionReferentielScoreStorable | null;
}) => {
  const [completion, setCompletion] = useState(0);
  useEffect(() => {
    setCompletion((score?.completion ?? 0) * 100);
  }, [score]);

  return (
    <div className="">
      <JaugeStar fillPercentage={completion} />
      <div className="text-red-600 text-xs flex justify-end">
        ({completion.toFixed()}%)
      </div>
    </div>
  );
};

export const CurrentEpciCompletionStar = ({
  action,
}: {
  action: ActionReferentiel;
}) => {
  const storableId = ActionReferentielScoreStorable.buildId(action.id);
  const score = useActionReferentielScore(storableId);

  return <CompletionStar score={score} />;
};
