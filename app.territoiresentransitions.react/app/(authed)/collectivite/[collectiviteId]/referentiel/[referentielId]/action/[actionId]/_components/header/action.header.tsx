import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { ActionSidePanelToolbar } from '@/app/referentiels/actions/action.side-panel.toolbar';
import { ProgressionRow } from '@/app/referentiels/DEPRECATED_scores.types';
import { ActionDetailed } from '@/app/referentiels/use-snapshot';
import { Button } from '@/ui';
import Breadcrumb from './breadcrumb';
import Score from './score';

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
  return (
    <>
      {/** Titre */}
      <h1 className="mt-12 mb-3 text-4xl">
        {actionDefinition.identifiant} {actionDefinition.nom}
      </h1>

      {/** Breadcrumb */}
      <Breadcrumb action={actionDefinition} />

      {/** Score | Informations | Options */}
      <div className="flex items-center gap-4 my-3 !py-0 text-sm text-grey-7">
        <Score
          action={action}
          actionDefinition={actionDefinition}
          DEPRECATED_actionScore={DEPRECATED_actionScore}
        />
          />
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
