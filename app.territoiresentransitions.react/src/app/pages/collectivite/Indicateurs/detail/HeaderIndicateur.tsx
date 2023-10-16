import classNames from 'classnames';
import {Link} from 'react-router-dom';
import HeaderTitle from 'ui/HeaderTitle';
import {usePrevAndNextIndicateurLinks} from './usePrevAndNextIndicateurLinks';

/** Affiche l'en-tête d'une page détail d'un indicateur */
type HeaderProps = {
  title: string;
  isReadonly?: boolean;
  onUpdate?: (value: string) => void;
};
export const HeaderIndicateur = ({
  title,
  isReadonly,
  onUpdate,
}: HeaderProps) => {
  const readonly = isReadonly ?? true;

  return (
    <>
      <HeaderTitle
        titre={title}
        customClass={{
          container: classNames('!bg-bf925 sticky top-0 z-40', {
            'pb-0': !readonly,
          }),
          text: classNames('!text-[#3a3a3a] text-[1rem]', {'pb-4': !readonly}),
        }}
        onUpdate={onUpdate}
        isReadonly={readonly}
      />
      <IndicateurTopNav />
    </>
  );
};

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
