import { HTMLAttributes, JSX } from 'react';

import { cn } from '../../utils/cn';

type Props = {
  className?: string;
  color?: 'grey' | 'primary';
  orientation?: 'horizontal' | 'vertical';
} & HTMLAttributes<HTMLHRElement>;

export const Divider = ({
  color = 'grey',
  orientation = 'horizontal',
  className,
  'aria-hidden': ariaHidden,
}: Props): JSX.Element => {
  return (
    <hr
      aria-orientation={orientation}
      aria-hidden={ariaHidden}
      className={cn(
        {
          'border-grey-3': color === 'grey',
          'border-primary-3': color === 'primary',
        },
        {
          'border-t w-full': orientation === 'horizontal',
          'border-l w-px h-full': orientation === 'vertical',
        },
        className
      )}
    />
  );
};
