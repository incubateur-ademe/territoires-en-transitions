import classNames from 'classnames';
import {badgeClassnames} from './utils';

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
  /** Donne un id pour les tests e2e */
  dataTest?: string;
  /** Libellé affiché dans le badge */
  title: string;
  /** État */
  state?: BadgeState;
  /** Taille du badge */
  size?: 'sm' | 'md';
  /** Affiche le badge en style light */
  light?: boolean;
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
  iconPosition = 'right',
  light = false,
  disabled,
  className,
  trim = true,
  dataTest,
}: Props) => {
  const {text, background, border, icon} =
    badgeClassnames[disabled ? 'grey' : state];

  return (
    <div
      data-test={`Badge-${dataTest}`}
      className={classNames(
        background,
        border,
        'flex items-center gap-1 max-w-max px-3 py-0.5 rounded',
        {
          'flex-row-reverse': iconPosition === 'left',
          '!px-2': size === 'sm',
          'border border-solid border-grey-4 !bg-white': light,
        },
        className
      )}
    >
      <span
        className={classNames(text, 'font-bold uppercase text-sm text-left', {
          'line-clamp-1': trim,
          '!text-xs': size === 'sm',
        })}
      >
        {title}
      </span>
      {onClose && !disabled && (
        <div
          className={classNames(
            'flex fr-icon-close-circle-fill before:w-4 before:h-4 rounded-full cursor-pointer',
            {'before:!w-3 before:!h-3': size === 'sm'},
            icon
          )}
          onClick={evt => {
            evt.stopPropagation();
            onClose();
          }}
        ></div>
      )}
    </div>
  );
};
