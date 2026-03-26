import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { PersoPotentiel } from '@/app/referentiels/personnalisations/PersoPotentielModal/PersoPotentiel';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import { ScoreRatioBadge } from '@/app/referentiels/scores/score.ratio-badge';

type Props = {
  action: ActionListItem;
};

export const Score = ({ action }: Props) => {
  return (
    <div className="flex gap-3 items-center flex-wrap text-grey-8 shrink-0">
      <ScoreRatioBadge action={action} size="xs" />

      <ScoreProgressBar action={action} className="w-80" />

      {action.questionIds.length > 0 && (
        <>
          <div className="w-[0.5px] h-5 bg-grey-5" />
          <PersoPotentiel action={action} />
        </>
      )}
    </div>
  );
};
