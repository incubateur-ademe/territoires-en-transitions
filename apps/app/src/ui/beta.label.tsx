import { appLabels } from '@/app/labels/catalog';
import { Badge } from '@tet/ui';
import { JSX, ReactNode } from 'react';

export const BetaLabel = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element => (
  <span className="inline-flex items-center gap-2">
    {children}
    <Badge title={appLabels.beta} variant="new" size="sm" />
  </span>
);
