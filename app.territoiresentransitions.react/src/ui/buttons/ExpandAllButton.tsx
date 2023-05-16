import classNames from 'classnames';
import AnchorAsButton from './AnchorAsButton';

type ExpendAllButtonProps = {
  open: boolean;
  onToggleOpen: () => void;
  className?: string;
};

/**
 * Bouton permettant l'ouverture ou la fermeture de
 * toutes les éléments d'une liste
 */

const ExpandAllButton = ({
  open,
  onToggleOpen,
  className = '',
}: ExpendAllButtonProps) => {
  return (
    <div className={className}>
      <AnchorAsButton
        className={classNames('underline_href fr-link fr-link--icon-right', {
          'fr-icon-arrow-up-line': open,
          'fr-icon-arrow-down-line': !open,
        })}
        onClick={onToggleOpen}
      >
        {open ? 'Tout replier' : 'Tout déplier'}
      </AnchorAsButton>
    </div>
  );
};

export default ExpandAllButton;
