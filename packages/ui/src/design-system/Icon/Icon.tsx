import { RemixiconComponentType } from '@remixicon/react';
import {
  cloneElement,
  forwardRef,
  HTMLAttributes,
  isValidElement,
  JSX,
  ReactElement,
  Ref,
} from 'react';
import { cn } from '../../utils/cn';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type IconValue = ReactElement<RemixiconComponentType>;

type IconProps = {
  icon: IconValue;
  size?: IconSize;
  className?: string;
} & HTMLAttributes<HTMLSpanElement>;

export const Icon = forwardRef(
  (
    { icon, size = 'md', className, ...props }: IconProps,
    ref?: Ref<HTMLSpanElement>
  ) => {
    const sizeClassnames = {
      // 14px
      'h-3.5 w-3.5': size === 'xs',
      // 16px
      'h-4 w-4': size === 'sm',
      // 20px
      'h-5 w-5': size === 'md',
      // 24px
      'h-6 w-6': size === 'lg',
      // 28px
      'h-7 w-7': size === 'xl',
      // 32px
      'h-8 w-8': size === '2xl',
    };

    // Icônes @remixicon/react (composants SVG) : on applique la taille via les
    // classes h/w en préservant une éventuelle className portée par l'icône,
    // et en propageant les props/ref éventuellement passés à <Icon>.
    if (isValidElement(icon)) {
      const iconClassName = (icon.props as { className?: string })?.className;
      return cloneElement(icon as JSX.Element, {
        ...props,
        ref,
        className: cn(sizeClassnames, iconClassName, className),
      });
    }
    return icon;
  }
);
Icon.displayName = 'Icon';
