import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { PersoPotentiel } from '@/app/referentiels/personnalisations/PersoPotentielModal/PersoPotentiel';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import { ScoreRatioBadge } from '@/app/referentiels/scores/score.ratio-badge';

type Props = {
  actionDefinition: ActionDefinitionSummary;
};

export const Score = ({ actionDefinition }: Props) => {
  return (
    <div className="flex gap-3 items-center flex-wrap text-grey-8 shrink-0">
      <ScoreRatioBadge actionId={actionDefinition.id} size="sm" />

      <ScoreProgressBar
        id={actionDefinition.id}
        identifiant={actionDefinition.identifiant}
        type={actionDefinition.type}
        className="w-80"
      />

      {actionDefinition.haveQuestions && (
        <>
          <div className="w-[0.5px] h-5 bg-grey-5" />
          <PersoPotentiel actionDef={actionDefinition} />
        </>
      )}
    </div>
  );
};
