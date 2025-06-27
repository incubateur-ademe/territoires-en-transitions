import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { PersoPotentiel } from '@/app/referentiels/personnalisations/PersoPotentielModal/PersoPotentiel';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import { ScoreRatioBadge } from '@/app/referentiels/scores/score.ratio-badge';
import { ActionDetailed } from '@/app/referentiels/use-snapshot';

type Props = {
  actionDefinition: ActionDefinitionSummary;
  action?: ActionDetailed;
};

const Score = ({ actionDefinition, action }: Props) => {
  return (
    <div className="flex gap-3 items-center flex-wrap text-grey-8 shrink-0">
      <ScoreProgressBar
        id={actionDefinition.id}
        identifiant={actionDefinition.identifiant}
        type={actionDefinition.type}
        className="w-80"
      />

      <ScoreRatioBadge actionId={actionDefinition.id} size="sm" />

      {actionDefinition.haveQuestions && (
        <>
          <div className="w-[0.5px] h-5 bg-grey-5" />
          <PersoPotentiel actionDef={actionDefinition} />
        </>
      )}
    </div>
  );
};

export default Score;
