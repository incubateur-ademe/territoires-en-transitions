import classNames from 'classnames';
import { Icon, IconValue } from '../Icon';

export type NotificationVariant = 'default' | 'warning' | 'info' | 'error';

export type NotificationSize = 'xs' | 'sm' | 'md';

type Props = {
  /** Variante de couleur */
  variant?: NotificationVariant;
  /** Variante de taille */
  size?: NotificationSize;
  /**  Icône */
  icon?: IconValue;
  /** Nombre affiché dans le composant */
  number?: number;
  /** Surcharge des classnames du composant */
  classname?: string;
};

const variantToClassname: Record<NotificationVariant, string> = {
  default: 'text-primary fill-primary bg-primary-3',
  warning: 'text-white fill-white bg-warning-1',
  info: 'text-white fill-white bg-info-1',
  error: 'text-white fill-white bg-error-1',
};

const sizeToClassname: Record<NotificationSize, string> = {
  md: 'text-base',
  sm: 'text-sm',
  xs: 'text-xs',
};

/**
 * Affiche un nombre et/ou une icône dans un cercle.
 */
export const Notification = ({
  variant = 'default',
  size = 'md',
  icon,
  number,
  classname,
}: Props) => {
  return (
    <div
      className={classNames(
        variantToClassname[variant],
        sizeToClassname[size],
        'inline-flex items-center gap-1 p-2 rounded-full border-2 border-grey-1 shadow',
        classname
      )}
    >
      {number !== undefined && (
        <span className="font-extrabold leading-none">{number}</span>
      )}
      {icon && <Icon icon={icon} size={size} />}
    </div>
  );
};
