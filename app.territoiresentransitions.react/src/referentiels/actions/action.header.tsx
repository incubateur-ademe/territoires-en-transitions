import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import ActionProgressBar from '@/app/referentiels/actions/action.progress-bar';
import PageContainer from '@/ui/components/layout/page-container';
import classNames from 'classnames';
import HeaderFixed from '../../app/pages/collectivite/CollectivitePageLayout/HeaderFixed';
import { PersoPotentiel } from '../../app/pages/collectivite/PersoPotentielModal/PersoPotentiel';
import { ActionDetailed, useSnapshotFlagEnabled } from '../use-snapshot';
import { ActionTopNav } from './action.nav';
import { ActionSidePanelToolbar } from './action.side-panel.toolbar';
import ScoreShow from './score.show';
import { SuiviScoreRow } from './useScoreRealise';

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
  DEPRECATED_actionScore: SuiviScoreRow;
  action: ActionDetailed;
  nextActionLink: string | undefined;
  prevActionLink: string | undefined;
}) => {
  const FLAG_isSnapshotEnabled = useSnapshotFlagEnabled();
  return (
    <HeaderFixed
      render={({ isScrolled }) => (
        <div
          className={classNames('bg-white', {
            'border-b border-b-[#e5e7eb]': isScrolled,
          })}
        >
          <div
            className={classNames(
              'flex flex-col justify-between bg-[#6A6AF4] text-white fr-px-5w',
              {
                'fr-py-3w': !isScrolled,
                'fr-py-1w': isScrolled,
              }
            )}
          >
            <p
              className={classNames('text-white font-bold !mb-0', {
                'text-[1.375rem]': !isScrolled,
                'text-md': isScrolled,
              })}
            >
              {actionDefinition.identifiant} {actionDefinition.nom}
            </p>
            {!isScrolled && (
              <ActionTopNav
                prevActionLink={prevActionLink}
                nextActionLink={nextActionLink}
              />
            )}
          </div>
          <PageContainer
            bgColor="white"
            innerContainerClassName="flex justify-between items-center fr-text--sm my-4 !py-0"
          >
            <div className="flex gap-4 items-center fr-pl-1v text-grey425">
              <ActionProgressBar
                actionDefinition={actionDefinition}
                className="border-r border-r-[#ddd] fr-pr-5v"
                // TODO(temporary): Temporary patch to display percentage
                TEMP_displayValue={true}
              />
              {FLAG_isSnapshotEnabled ? (
                <>
                  <ScoreShow
                    score={action.score.pointFait ?? null}
                    scoreMax={action.score.pointPotentiel ?? null}
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
                <div className="border-l border-l-[#ddd] fr-pl-3v">
                  <PersoPotentiel actionDef={actionDefinition} />
                </div>
              )}
            </div>
            <ActionSidePanelToolbar action={action} />
          </PageContainer>
        </div>
      )}
    />
  );
};
