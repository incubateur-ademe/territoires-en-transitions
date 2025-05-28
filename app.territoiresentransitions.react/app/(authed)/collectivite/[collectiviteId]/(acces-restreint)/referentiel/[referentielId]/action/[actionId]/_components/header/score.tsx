import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { PersoPotentiel } from '@/app/referentiels/personnalisations/PersoPotentielModal/PersoPotentiel';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import ScoreShow from '@/app/referentiels/scores/score.show';
import { ActionDetailed } from '@/app/referentiels/use-snapshot';

type Props = {
  actionDefinition: ActionDefinitionSummary;
  action?: ActionDetailed;
};

const Score = ({ actionDefinition, action }: Props) => {
  return (
    <div className="flex gap-4 items-center text-grey-7">
      <ScoreProgressBar
        id={actionDefinition.id}
        identifiant={actionDefinition.identifiant}
        type={actionDefinition.type}
        className="border-r border-r-[#ddd] pr-6"
        displayDoneValue
      />

      <ScoreShow
        score={action?.score.pointFait ?? null}
        scoreMax={action?.score.pointPotentiel ?? null}
        legend="Score réalisé"
        size="sm"
      />

      {actionDefinition.haveQuestions && (
        <div className="border-l border-l-[#ddd] pl-3">
          <PersoPotentiel actionDef={actionDefinition} />
        </div>
      )}
    </div>
  );
};

export default Score;
