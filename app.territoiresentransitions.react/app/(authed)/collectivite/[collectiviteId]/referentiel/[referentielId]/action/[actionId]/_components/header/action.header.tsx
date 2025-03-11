import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { ActionSidePanelToolbar } from '@/app/referentiels/actions/action.side-panel.toolbar';
import { ProgressionRow } from '@/app/referentiels/DEPRECATED_scores.types';
import { PersoPotentiel } from '@/app/referentiels/personnalisations/PersoPotentielModal/PersoPotentiel';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import ScoreShow from '@/app/referentiels/scores/score.show';
import {
  ActionDetailed,
  useSnapshotFlagEnabled,
} from '@/app/referentiels/use-snapshot';
import { Button } from '@/ui';
import { ActionBreadcrumb } from './action.breadcrumb';

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
      {/** Titre */}
      <h1 className="mb-3 text-4xl">
        {actionDefinition.identifiant} {actionDefinition.nom}
      </h1>

      {/** Breadcrumb */}
      <ActionBreadcrumb action={actionDefinition} />

      {/** Score & options */}
      <div className="flex justify-between items-center my-3 !py-0">
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

      {/** Action précédente / suivante */}
      <div className="flex justify-between py-2 border-y border-y-primary-3">
        {!!prevActionLink && (
          <Button
            className="border-b-transparent hover:text-primary-9"
            variant="underlined"
            icon="arrow-left-line"
            size="sm"
            href={prevActionLink}
          >
            Action précédente
          </Button>
        )}
        {!!nextActionLink && (
          <Button
            className="border-b-transparent hover:text-primary-9"
            variant="underlined"
            icon="arrow-right-line"
            iconPosition="right"
            size="sm"
            href={nextActionLink}
          >
            Action suivante
          </Button>
        )}
      </div>
    </>
  );
};
