import classNames from 'classnames';
import {TIndicateurPredefini} from '../types';
import {Badge} from 'ui/shared/Badge';
import {BadgeACompleter} from 'ui/shared/Badge/BadgeACompleter';
import {ExpandToggle} from 'ui/icons/ExpandToggle';

/** Affiche l'en-tête du détail d'un indicateur enfant */
export const IndicateurEnfantHeader = ({
  definition,
  open,
  toggle,
}: {
  definition: TIndicateurPredefini;
  open: boolean;
  toggle: () => void;
}) => {
  return (
    <div
      className={classNames(
        'flex justify-between items-center px-6 py-4 rounded-lg cursor-pointer sticky top-[86px] z-[30]',
        {
          'bg-[#f5f5fE]': open,
          'hover:bg-grey975': !open,
        }
      )}
      onClick={toggle}
    >
      <div>
        <ExpandToggle open={open} />
        <span className="font-bold">{definition.nom}</span>
      </div>
      <div>
        {definition.participation_score && (
          <Badge status="no-icon" className="fr-mr-1w">
            Participe au score
          </Badge>
        )}
        <BadgeACompleter
          className="min-w-max"
          a_completer={!definition.rempli}
        />
      </div>
    </div>
  );
};
