import { cn, Icon } from '@tet/ui';
import { JSX } from 'react';

export const DragHandle = ({ className }: { className?: string }): JSX.Element => (
  <Icon icon="draggable" size="xs" className={cn('text-grey-5', className)} />
);
