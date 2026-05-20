import { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { AnchorButtonProps, DefaultButtonProps } from './types';

type PillButtonProps = (
  | Omit<DefaultButtonProps, 'variant' | 'size'>
  | Omit<AnchorButtonProps, 'variant' | 'size'>
) & {
  isActive?: boolean;
};

export const PillButton = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  PillButtonProps
>(({ isActive, className, iconPosition = 'right', ...props }, ref) => (
  <Button
    {...props}
    ref={ref}
    aria-pressed={isActive}
    variant="unstyled"
    size="xs"
    iconPosition={iconPosition}
    className={cn(
      'px-2 py-1 font-medium rounded-md border-[1px] text-xs flex gap-1 items-center justify-center text-nowrap transition-colors',
      isActive
        ? 'bg-primary-9 border-primary-9 text-white hover:bg-primary-8 hover:border-primary-8'
        : 'text-grey-8 border-grey-4 hover:bg-primary-1 hover:border-primary-5 hover:text-primary-9',
      className
    )}
  />
));
PillButton.displayName = 'PillButton';
