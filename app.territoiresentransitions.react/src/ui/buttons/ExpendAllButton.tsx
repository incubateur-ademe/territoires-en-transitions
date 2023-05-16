import classNames from 'classnames';

type ExpendAllButtonProps = {
  open: boolean;
  onToggleOpen: () => void;
  className?: string;
};

/**
 * Bouton permettant l'ouverture ou la fermeture de
 * toutes les éléments d'une liste
 */

const ExpendAllButton = ({
  open,
  onToggleOpen,
  className = '',
}: ExpendAllButtonProps) => {
  return (
    <div className={className}>
      <a
        className={classNames('underline_href fr-link fr-link--icon-right', {
          'fr-icon-arrow-up-line': open,
          'fr-icon-arrow-down-line': !open,
        })}
        href="/"
        onClick={evt => {
          evt.preventDefault();
          onToggleOpen();
        }}
      >
        {open ? 'Tout replier' : 'Tout déplier'}
      </a>
    </div>
  );
};

export default ExpendAllButton;
