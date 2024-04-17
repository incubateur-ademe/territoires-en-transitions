import {Badge} from '@design-system/Badge';
import classNames from 'classnames';
import {ButtonMenu} from './ButtonMenu';
import {NotificationButton} from '@design-system/Button';

export type BadgeType = {
  /** Label du badge */
  label: string;
  /** Détecte la suppression du badge */
  onClose?: () => void;
};

type BadgesMenuProps = {
  /** Comportement par défaut avec menu flottant sous le bouton, ou comportement custom activé par le click */
  variant?: 'default' | 'custom';
  /** Permet la customisation de l'icône */
  icon?: string;
  /** Liste des badges à afficher */
  badgesList: BadgeType[];
  /** Contenu du menu (uniquement avec le variant `default`) */
  menuContent?: React.ReactNode;
  /** Surcouche sur la classname du menu */
  className?: string;
  /** Détecte le click sur le bouton */
  onClick?: () => void;
  /** Détecte le clear sur l'ensemble des badges */
  onClearBadges?: () => void;
};

export const BadgesMenu = ({
  variant = 'default',
  icon = 'equalizer-fill',
  badgesList,
  menuContent,
  className,
  onClick,
  onClearBadges,
}: BadgesMenuProps) => {
  return (
    <div className={classNames('flex justify-between items-start', className)}>
      <div className="flex gap-2 flex-wrap">
        {/* Liste des badges */}
        {!!badgesList &&
          badgesList.map(badge => (
            <Badge
              key={badge.label}
              title={badge.label}
              size="sm"
              state="standard"
              uppercase={false}
              light
              onClose={badge.onClose}
            />
          ))}

        {/* Badge pour effacer tous les filtres sélectionnés */}
        {!!badgesList && badgesList.length > 0 && !!onClearBadges && (
          <div
            onClick={onClearBadges} // tout le badge est clickable
            className="cursor-pointer"
          >
            <Badge
              title="Supprimer tous les filtres"
              icon="delete-bin-6-line"
              iconPosition="left"
              size="sm"
              state="grey"
              uppercase={false}
              light
              onClose={() => {}}
            />
          </div>
        )}
      </div>

      {/* Bouton par défaut avec ouverture du menu flottant */}
      {variant === 'default' && (
        <ButtonMenu
          icon={icon}
          notificationValue={badgesList?.length || undefined}
          onClick={onClick}
        >
          <div className="flex flex-col gap-4 w-72">{menuContent}</div>
        </ButtonMenu>
      )}

      {/* Bouton classique avec trigger custom au click */}
      {variant === 'custom' && (
        <div className="mx-2 w-fit">
          <NotificationButton
            size="xs"
            icon={icon}
            notificationValue={badgesList?.length || undefined}
            onClick={onClick}
          />
        </div>
      )}
    </div>
  );
};
