import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import { ReferentielId } from '@tet/domain/referentiels';
import { PointsPotentiels } from './points-potentiels.label';

type Props = {
  action: ActionListItem;
};

const showPotentielPointsForReferentielIds: ReferentielId[] = [
  'cae',
  'eci',
] as const;

export const Score = ({ action }: Props) => {
  return (
    <div className="flex gap-3 items-center flex-wrap text-grey-8 min-w-0">
      <ScoreProgressBar action={action} className="w-80 hidden md:block" />

      {action.questionIds.length > 0 &&
        showPotentielPointsForReferentielIds.includes(action.referentielId) && (
          <>
            <div className="w-[0.5px] h-5 bg-grey-5" />
            <PointsPotentiels score={action.score} />
          </>
        )}
    </div>
  );
};
