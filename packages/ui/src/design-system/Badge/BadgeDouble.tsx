import { cn } from '../../utils/cn';
import { Badge, BadgeProps, BadgeSize, BadgeType, BadgeVariant } from './Badge';
import { badgeClassnames } from './utils';

type SingleBadgeProps = Pick<
  BadgeProps,
  'title' | 'icon' | 'iconPosition' | 'trim' | 'uppercase'
>;

type Props = {
  className?: string;
  variant?: BadgeVariant;
  type?: BadgeType;
  size?: BadgeSize;
  badgeLeft: SingleBadgeProps;
  badgeRight: SingleBadgeProps;
};

/**
 * Seulement certaines props sont appliquées aux deux badges afin de limiter les possibilités de combinaisons
 * et erreurs de mauvaises configurations.
 *
 * @param className - Classnames appliquées directement sur le container
 * @param variant - Variant du groupe de badges
 * @param type - Type du badge appliqué au badge de gauche (voir Figma-> https://www.figma.com/design/rjOc9l175upyV1FlQU86SX/DSTET?node-id=4746-27023&t=qeo3GBmAL0TNzt5T-4)
 * @param size - Taille du badge appliqué aux deux badges
 * @param badgeLeft - Props du badge de gauche
 * @param badgeRight - Props du badge de droite
 */
export const BadgeDouble = ({
  className,
  variant = 'default',
  type = 'outlined',
  size = 'sm',
  badgeLeft,
  badgeRight,
}: Props) => {
  const { border } = badgeClassnames[variant]['inverted'];

  return (
    <div className={cn('flex items-center', className)}>
      <Badge
        {...badgeLeft}
        className={cn('rounded-r-none', border)}
        variant={variant}
        type={type}
        size={size}
      />
      <Badge
        {...badgeRight}
        className={cn('rounded-l-none border-l-0', border)}
        variant={variant}
        size={size}
        type="outlined"
      />
    </div>
  );
};
