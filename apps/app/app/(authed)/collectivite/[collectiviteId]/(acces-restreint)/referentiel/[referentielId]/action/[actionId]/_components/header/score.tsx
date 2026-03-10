import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import { ScoreRatioBadge } from '@/app/referentiels/scores/score.ratio-badge';
import { ReferentielId } from '@tet/domain/referentiels';
import { PointsPotentiels } from './points-potentiels.label';

type Props = {
  actionDefinition: ActionDefinitionSummary;
};

const showPotentielPointsForReferentielIds: ReferentielId[] = [
  'cae',
  'eci',
] as const;

export const Score = ({ actionDefinition }: Props) => {
  return (
    <div className="flex gap-3 items-center flex-wrap text-grey-8 min-w-0">
      <ScoreProgressBar
        id={actionDefinition.id}
        identifiant={actionDefinition.identifiant}
        type={actionDefinition.type}
        className="w-80 hidden md:block"
      />
      <ScoreRatioBadge actionId={actionDefinition.id} size="xs" />

      {actionDefinition.haveQuestions &&
        showPotentielPointsForReferentielIds.includes(
          actionDefinition.referentiel
        ) && (
          <>
            <div className="w-[0.5px] h-5 bg-grey-5" />
            <PointsPotentiels actionId={actionDefinition.id} />
          </>
        )}
    </div>
  );
};
