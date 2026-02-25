import classNames from 'classnames';

import { Icon, IconValue } from '../Icon';

import { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { badgeClassnames } from './utils';

export type BadgeVariant =
  | 'default'
  | 'standard'
  | 'hight'
  | 'success'
  | 'warning'
  | 'new'
  | 'error'
  | 'info'
  | 'grey'
  | 'custom';

export type BadgeType = 'outlined' | 'solid' | 'inverted';

export type BadgeSize = 'xs' | 'sm';

export type BadgeProps = {
  /** Id pour les tests e2e */
  dataTest?: string;
  /** Libellé affiché dans le badge */
  title?: React.ReactNode;
  /** Variant */
  variant?: BadgeVariant;
  /** Type de badge */
  type?: BadgeType;
  /** Taille du badge */
  size?: BadgeSize;
  /** Icône à afficher dans le badge */
  icon?: IconValue;
  /** Position de l'icon dans le badge, à droite par défaut */
  iconPosition?: 'left' | 'right';
  /** Classnames appliquées directement sur l'icône */
  iconClassname?: string;
  /** Appelée lors du clic sur le bouton "Fermer". Ne pas spécifier pour masquer le bouton. */
  onClose?: () => void;
  /** Pour désactiver les interactions */
  disabled?: boolean;
  /** Permet de surcharger les styles du container */
  className?: string;
  /** Restreint le titre à une seule ligne, true par défaut */
  trim?: boolean;
  /** Met le texte du badge en majuscules */
  uppercase?: boolean;
};

/** Affiche un badge */
export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      title,
      onClose,
      variant = 'default',
      type = 'solid',
      size = 'sm',
      icon,
      iconPosition = 'right',
      iconClassname,
      disabled,
      className,
      trim = true,
      uppercase = true,
      dataTest,
    },
    ref
  ) => {
    const styles = badgeClassnames[variant][type];

    return (
      <div
        data-test={`Badge-${dataTest}`}
        ref={ref}
        className={cn(
          styles.background,
          styles.border,
          'flex items-center gap-1 max-w-max h-fit px-3 py-1 border border-solid rounded-md',
          {
            'flex-row-reverse': iconPosition === 'left',
            'px-1.5 py-0.5': size === 'xs',
          },
          className
        )}
      >
        {(!!title || onClose) && (
          <div className="flex items-center gap-1">
            {!!title && (
              <span
                className={classNames(
                  styles.text,
                  'font-bold leading-4 text-left',
                  {
                    'line-clamp-1': trim,
                    'text-xs': size === 'xs',
                    'mt-0.5 text-sm': size === 'sm',
                    uppercase,
                  }
                )}
              >
                {title}
              </span>
            )}

            {onClose && !disabled && (
              <div
                className="flex rounded-full cursor-pointer"
                onClick={(evt) => {
                  evt.stopPropagation();
                  onClose?.();
                }}
              >
                <Icon
                  icon="close-circle-line"
                  size={size}
                  className={cn(styles.icon)}
                />
              </div>
            )}
          </div>
        )}

        {icon && (
          <Icon
            icon={icon}
            size={size}
            className={cn(styles.icon, iconClassname)}
          />
        )}
      </div>
    );
  }
);

Badge.displayName = 'Badge';
