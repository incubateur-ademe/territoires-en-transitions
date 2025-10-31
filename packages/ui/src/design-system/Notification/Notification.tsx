import { cn } from '@/ui/utils/cn';
import { Icon, IconValue } from '../Icon';

export type NotificationVariant =
  | 'default'
  | 'warning'
  | 'info'
  | 'error'
  | 'success';

export type NotificationSize = 'xs' | 'sm' | 'md';

export type NotificationProps = {
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
  success: 'text-white fill-white bg-success-1',
};

const sizeToClassname: Record<NotificationSize, string> = {
  md: 'h-8 min-w-[2rem] text-base p-2',
  sm: 'h-7 min-w-[1.75rem] text-sm p-1.5',
  xs: 'h-6 min-w-[1.5rem] text-xs p-1.5',
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
}: NotificationProps) => {
  return (
    <div
      className={cn(
        variantToClassname[variant],
        sizeToClassname[size],
        'inline-flex items-center justify-center gap-1 rounded-full border-2 border-grey-1 shadow',
        classname
      )}
    >
      {number !== undefined && (
        <span
          className={cn('font-extrabold leading-none', {
            'pt-0.5': !!icon,
          })}
        >
          {number}
        </span>
      )}
      {icon && <Icon icon={icon} size={size} />}
    </div>
  );
};
