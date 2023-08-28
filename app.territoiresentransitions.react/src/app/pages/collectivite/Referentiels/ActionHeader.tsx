import classNames from 'classnames';
import ActionProgressBar from 'ui/referentiels/ActionProgressBar';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useScrollTop} from 'utils/useScrollTop';
import {ActionTopNav} from './ActionNav';
import {ActionSidePanelToolbar} from './ActionSidePanelToolbar';
import {PersoPotentiel} from '../PersoPotentielModal/PersoPotentiel';
import ScoreDisplay from '../../../../ui/referentiels/ScoreDisplay';
import {SuiviScoreRow} from '../EtatDesLieux/Referentiel/data/useScoreRealise';
import {Ref, useEffect, useRef, useState} from 'react';

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
  // détermine si la page a suffisamment défilée pour afficher la version
  // réduite de l'en-tête
  const scrollTop = useScrollTop('main');
  const isScrolled = scrollTop >= 183;

  const headerRef: Ref<HTMLDivElement> = useRef(null);

  /**
   * Nous devons gérer la hauteur de la <div /> qui englobe tout le composant sticky.
   * Si nous ne le faisons pas, quand le header passe en version réduite, cela modifie la hauteur du scroll de la page et
   * rentre dans une boucle infinie au moment où le header devient sticky.
   */
  const [controlledHeight, setHeaderHeight] = useState<number | undefined>();
  const [headerOriginalHeight, setHeaderOriginalHeight] = useState<
    number | undefined
  >();
  const [headerOriginalWidth, setHeaderOriginalWidth] = useState<
    number | undefined
  >();

  /** Au montage du composant, nous stockons les valeurs initiales du header */
  useEffect(() => {
    setHeaderOriginalHeight(
      document.getElementById('action-header')?.clientHeight
    );
    setHeaderOriginalWidth(
      document.getElementById('action-header')?.clientWidth
    );
  }, []);

  /**
   * Quand le header change de largeur (toggle de la sidenav ou du panel),
   * nous modifions la hauteur car le titre du header peut passer sur plusieurs ligne
   * et donc augmenter la taille du header visible à l'écran, ce qui refait flicker le header au scroll.
   */
  useEffect(() => {
    if (headerRef.current) {
      if (headerOriginalWidth === headerRef.current?.clientWidth) {
        setHeaderHeight(headerOriginalHeight);
      } else {
        setHeaderHeight(document.getElementById('action-header')?.clientHeight);
      }
    }
  }, [headerRef.current?.clientWidth]);

  return (
    <div
      ref={headerRef}
      id="action-header"
      style={{minHeight: `${controlledHeight}px`}}
      className="sticky top-0 z-40 pointer-events-none"
    >
      <div
        className={classNames('bg-white pointer-events-auto', {
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
        <div className="fr-container flex justify-between items-center fr-text--sm fr-my-2w">
          <div className="flex gap-4 items-center fr-pl-1v text-grey425">
            <ActionProgressBar
              action={action}
              className="border-r border-r-[#ddd] fr-pr-5v"
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
        </div>
      </div>
    </div>
  );
};
