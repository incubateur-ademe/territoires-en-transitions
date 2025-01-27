import { ActionDefinitionSummary } from '@/app/core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import ActionProgressBar from '@/app/ui/referentiels/ActionProgressBar';
import classNames from 'classnames';
import ScoreDisplay from '../../../../ui/referentiels/ScoreDisplay';
import HeaderFixed from '../CollectivitePageLayout/HeaderFixed';
import { SuiviScoreRow } from '../EtatDesLieux/Referentiel/data/useScoreRealise';
import { PersoPotentiel } from '../PersoPotentielModal/PersoPotentiel';
import { ActionTopNav } from './ActionNav';
import { ActionSidePanelToolbar } from './ActionSidePanelToolbar';
import PageContainer from '@/ui/components/layout/page-container';

/**
 * Affiche la partie de l'en-tête de la page Action sensible à la position du
 * défilement vertical
 */
export const ActionHeader = ({
  action,
  actionScore,
  nextActionLink,
  prevActionLink,
}: {
  action: ActionDefinitionSummary;
  actionScore: SuiviScoreRow;
  nextActionLink: string | undefined;
  prevActionLink: string | undefined;
}) => {
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
              {action.identifiant} {action.nom}
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
                action={action}
                className="border-r border-r-[#ddd] fr-pr-5v"
                // TODO(temporary): Temporary patch to display percentage
                TEMP_displayValue={true}
              />
              <ScoreDisplay
                score={actionScore?.points_realises ?? null}
                scoreMax={actionScore?.points_max_personnalises ?? null}
                legend="Score réalisé"
                size="sm"
              />
              {action.have_questions && (
                <div className="border-l border-l-[#ddd] fr-pl-3v">
                  <PersoPotentiel actionDef={action} />
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
