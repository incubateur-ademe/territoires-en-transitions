import classNames from 'classnames';
import {Icon, IconValue} from '@design-system/icons/Icon';

export type NotifVariant = 'default' | 'warning' | 'info' | 'error';

export type NotifSize = 'xs' | 'sm' | 'md';

type Props = {
  /** Variante de couleur */
  variant?: NotifVariant;
  /** Variante de taille */
  size?: NotifSize;
  /**  Icône */
  icon?: IconValue;
  /** Nombre affiché dans le composant */
  number?: number;
};

const variantToClassname: Record<NotifVariant, string> = {
  default: 'text-primary fill-primary bg-primary-3',
  warning: 'text-white fill-white bg-warning-1',
  info: 'text-white fill-white bg-info-1',
  error: 'text-white fill-white bg-error-1',
};

const sizeToClassname: Record<NotifSize, string> = {
  md: 'text-md',
  sm: 'text-sm',
  xs: 'text-xs',
};

/**
 * Affiche un nombre et/ou un icon dans un cercle.
 */
export const Notif = ({
  variant = 'default',
  size = 'md',
  icon,
  number,
}: Props) => {
  return (
    <div
      className={classNames(
        variantToClassname[variant],
        sizeToClassname[size],
        'inline-flex items-center gap-1 p-2 rounded-full border-2 border-grey-1 shadow'
      )}
    >
      {!!number && (
        <span className="font-extrabold leading-none">{number}</span>
      )}
      <Icon icon={icon} size={size} />
    </div>
  );
};
