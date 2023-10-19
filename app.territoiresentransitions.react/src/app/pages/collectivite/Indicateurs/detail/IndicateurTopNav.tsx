import {Link} from 'react-router-dom';
import {usePrevAndNextIndicateurLinks} from './usePrevAndNextIndicateurLinks';

/**
 * Affiche les boutons "Indicateur précédent" et "Indicateur suivant" en haut de page
 */
export const IndicateurTopNav = () => {
  const {prevIndicateurLink, nextIndicateurLink} =
    usePrevAndNextIndicateurLinks();

  return prevIndicateurLink || nextIndicateurLink ? (
    <div className="!bg-bf925 min-h-[1.5rem] flex justify-between fr-text--sm !m-0 fr-pb-3w fr-px-5w overflow-hidden">
      {prevIndicateurLink ? (
        <Link
          to={prevIndicateurLink}
          className="fr-fi-arrow-left-line fr-btn--icon-left active-transparent"
        >
          Indicateur précédent
        </Link>
      ) : (
        <div />
      )}
      {nextIndicateurLink && (
        <Link
          to={nextIndicateurLink}
          className="justify-self-end fr-fi-arrow-right-line fr-btn--icon-right active-transparent"
        >
          Indicateur suivant
        </Link>
      )}
    </div>
  ) : null;
};
