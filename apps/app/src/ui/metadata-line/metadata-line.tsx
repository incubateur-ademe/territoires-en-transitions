import { cn } from '@tet/ui';
import { ReactNode } from 'react';

export const MetadataLine = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      'flex flex-wrap gap-x-4 gap-y-0 items-center text-sm leading-5 text-primary-9',
      className
    )}
  >
    {children}
  </div>
);
