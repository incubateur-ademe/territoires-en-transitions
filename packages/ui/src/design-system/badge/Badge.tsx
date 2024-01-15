import classNames from 'classnames';
import {badgeClassnames} from './utils';
import {Icon, IconValue} from '../icons/Icon';

export type BadgeState =
  | 'default'
  | 'standard'
  | 'success'
  | 'warning'
  | 'new'
  | 'error'
  | 'info'
  | 'grey';

type Props = {
  /** Id pour les tests e2e */
  dataTest?: string;
  /** Libellé affiché dans le badge */
  title: string;
  /** État */
  state?: BadgeState;
  /** Taille du badge */
  size?: 'sm' | 'md';
  /** Affiche le badge en style light */
  light?: boolean;
  /** Icône à afficher dans le badge */
  icon?: IconValue;
  /** Position de l'icon dans le badge, à droite par défaut */
  iconPosition?: 'left' | 'right';
  /** Appelée lors du clic sur le bouton "Fermer". Ne pas spécifier pour masquer le bouton. */
  onClose?: () => void;
  /** Pour désactiver les interactions */
  disabled?: boolean;
  /** Permet de surcharger les styles du container */
  className?: string;
  /** Restreint le titre à une seule ligne, true par défaut */
  trim?: boolean;
};

/** Affiche un badge */
export const Badge = ({
  title,
  onClose,
  state = 'default',
  size = 'md',
  icon = 'close-circle-fill',
  iconPosition = 'right',
  light = false,
  disabled,
  className,
  trim = true,
  dataTest,
}: Props) => {
  const styles = badgeClassnames[state];

  return (
    <div
      data-test={`Badge-${dataTest}`}
      className={classNames(
        styles.background,
        styles.border,
        'flex items-center gap-1 max-w-max px-3 py-1 border border-solid rounded',
        {
          'flex-row-reverse': iconPosition === 'left',
          'border-grey-4 bg-white': light,
          '!px-1.5 !py-0.5': size === 'sm',
        },
        className
      )}
    >
      <span
        className={classNames(
          styles.text,
          'font-bold uppercase leading-4 text-left',
          {
            'line-clamp-1': trim,
            'text-xs': size === 'sm',
            'mt-0.5 text-sm': size === 'md',
          }
        )}
      >
        {title}
      </span>
      {onClose && !disabled && (
        <div
          className="flex rounded-full cursor-pointer"
          onClick={evt => {
            evt.stopPropagation();
            onClose();
          }}
        >
          <Icon
            icon={icon}
            size={size === 'sm' ? 'xs' : 'sm'}
            className={styles.icon}
          />
        </div>
      )}
    </div>
  );
};
