import { cn } from '@/ui/utils/cn';
import { forwardRef, HTMLAttributes, Ref } from 'react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type IconValue =
  | JSX.Element
  | ((className: string) => JSX.Element)
  | string;

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

    // On utilise les icônes Remix lorsqu'on passe une string.
    // Remix utilise la font-size pour définir la taille de l'icône,
    // il faut donc fournir une font-size en rem.
    // https://remixicon.com/
    if (typeof icon === 'string') {
      return (
        <span
          {...props}
          ref={ref}
          className={cn(
            `ri-${icon}`,
            'font-normal text-center',
            sizeClassnames,
            {
              // 14px
              'text-[0.875rem] leading-[0.875rem]': size === 'xs',
              // 16px
              'text-[1rem] leading-[1rem]': size === 'sm',
              // 20px
              'text-[1.25rem] leading-[1.25rem]': size === 'md',
              // 24px
              'text-[1.5rem] leading-[1.5rem]': size === 'lg',
              //28px
              'text-[1.75rem] leading-[1.75rem]': size === 'xl',
              //32px
              'text-[2rem] leading-[2rem]': size === '2xl',
            },
            className
          )}
        />
      );
    }
    if (typeof icon === 'function') {
      return icon(cn(sizeClassnames, className));
    }
    return icon;
  }
);
