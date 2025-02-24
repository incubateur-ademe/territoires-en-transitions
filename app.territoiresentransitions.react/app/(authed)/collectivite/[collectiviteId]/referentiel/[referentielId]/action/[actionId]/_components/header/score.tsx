import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { ProgressionRow } from '@/app/referentiels/DEPRECATED_scores.types';
import { PersoPotentiel } from '@/app/referentiels/personnalisations/PersoPotentielModal/PersoPotentiel';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import ScoreShow from '@/app/referentiels/scores/score.show';
import {
  ActionDetailed,
  useSnapshotFlagEnabled,
} from '@/app/referentiels/use-snapshot';

type Props = {
  actionDefinition: ActionDefinitionSummary;
  DEPRECATED_actionScore: ProgressionRow;
  action?: ActionDetailed;
};

const Score = ({ actionDefinition, action, DEPRECATED_actionScore }: Props) => {
  const FLAG_isSnapshotEnabled = useSnapshotFlagEnabled();
  return (
    <div className="flex gap-4 items-center text-grey-7">
      <ScoreProgressBar
        actionDefinition={actionDefinition}
        className="border-r border-r-[#ddd] pr-6"
        displayDoneValue
      />
      {FLAG_isSnapshotEnabled ? (
        <>
          <ScoreShow
            score={action?.score.pointFait ?? null}
            scoreMax={action?.score.pointPotentiel ?? null}
            legend="Score réalisé"
            size="sm"
          />
        </>
      ) : (
        <>
          <ScoreShow
            score={DEPRECATED_actionScore?.points_realises ?? null}
            scoreMax={DEPRECATED_actionScore?.points_max_personnalises ?? null}
            legend="Score réalisé"
            size="sm"
          />
        </>
      )}
      {actionDefinition.have_questions && (
        <div className="border-l border-l-[#ddd] pl-3">
          <PersoPotentiel actionDef={actionDefinition} />
        </div>
      )}
    </div>
  );
};

export default Score;
