import classNames from 'classnames';
import ActionProgressBar from 'ui/referentiels/ActionProgressBar';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {ActionTopNav} from './ActionNav';
import {ActionSidePanelToolbar} from './ActionSidePanelToolbar';
import {PersoPotentiel} from '../PersoPotentielModal/PersoPotentiel';
import ScoreDisplay from '../../../../ui/referentiels/ScoreDisplay';
import {SuiviScoreRow} from '../EtatDesLieux/Referentiel/data/useScoreRealise';
import HeaderFixed from '../CollectivitePageLayout/HeaderFixed';

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
      render={({isScrolled}) => (
        <div
          className={classNames('bg-white', {
            'border-b border-b-[#e5e7eb]': isScrolled,
          })}
        >
          <div
            className={classNames(
              'flex flex-col justify-between bg-[#6A6AF4] text-white px-10',
              {
                'py-6': !isScrolled,
                'py-2': isScrolled,
              }
            )}
          >
            <div className="fr-container">
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
          </div>
          <div className="fr-container flex justify-between items-center text-sm my-4">
            <div className="flex gap-4 items-center pl-1 text-grey425">
              <ActionProgressBar
                action={action}
                className="border-r border-r-[#ddd] pr-5"
              />
              <ScoreDisplay
                score={actionScore?.points_realises ?? null}
                scoreMax={actionScore?.points_max_personnalises ?? null}
                legend="Score réalisé"
                size="sm"
              />
              {action.have_questions && (
                <div className="border-l border-l-[#ddd] pl-3">
                  <PersoPotentiel actionDef={action} />
                </div>
              )}
            </div>
            <ActionSidePanelToolbar action={action} />
          </div>
        </div>
      )}
    />
  );
};
