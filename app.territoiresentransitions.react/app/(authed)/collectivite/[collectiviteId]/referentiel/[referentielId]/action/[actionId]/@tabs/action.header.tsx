import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { ActionTopNav } from '@/app/referentiels/actions/action.nav';
import { ActionSidePanelToolbar } from '@/app/referentiels/actions/action.side-panel.toolbar';
import { ProgressionRow } from '@/app/referentiels/DEPRECATED_scores.types';
import { PersoPotentiel } from '@/app/referentiels/personnalisations/PersoPotentielModal/PersoPotentiel';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import ScoreShow from '@/app/referentiels/scores/score.show';
import {
  ActionDetailed,
  useSnapshotFlagEnabled,
} from '@/app/referentiels/use-snapshot';

/**
 * Affiche la partie de l'en-tête de la page Action sensible à la position du
 * défilement vertical
 */
export const ActionHeader = ({
  actionDefinition,
  DEPRECATED_actionScore,
  action,
  nextActionLink,
  prevActionLink,
}: {
  actionDefinition: ActionDefinitionSummary;
  DEPRECATED_actionScore: ProgressionRow;
  action?: ActionDetailed;
  nextActionLink: string | undefined;
  prevActionLink: string | undefined;
}) => {
  const FLAG_isSnapshotEnabled = useSnapshotFlagEnabled();
  return (
    <>
      <div className="flex flex-col justify-between gap-4 bg-primary text-white px-10 py-6">
        <p className="text-white font-bold !mb-0 text-[1.375rem]">
          {actionDefinition.identifiant} {actionDefinition.nom}
        </p>

        <ActionTopNav
          prevActionLink={prevActionLink}
          nextActionLink={nextActionLink}
        />
      </div>

      <div className="flex justify-between items-center my-4 !py-0">
        <div className="flex gap-4 items-center text-grey-7">
          <ScoreProgressBar
            actionDefinition={actionDefinition}
            className="border-r border-r-[#ddd] pr-6"
            // TODO(temporary): Temporary patch to display percentage
            TEMP_displayValue={true}
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
                scoreMax={
                  DEPRECATED_actionScore?.points_max_personnalises ?? null
                }
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
        <ActionSidePanelToolbar action={actionDefinition} />
      </div>
    </>
  );
};
