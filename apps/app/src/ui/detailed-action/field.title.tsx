import { cn } from '@tet/ui';
import type { JSX, ReactNode } from 'react';

const FieldTitle = ({
  children,
  size = 'large',
}: {
  readonly children: ReactNode;
  readonly size?: 'large' | 'normal';
}): JSX.Element => (
  <h2
    className={cn('m-0 text-primary-10 font-bold text-lg', {
      'text-base': size === 'normal',
      'font-normal': size === 'normal',
    })}
  >
    {children}
  </h2>
);

export { FieldTitle };
