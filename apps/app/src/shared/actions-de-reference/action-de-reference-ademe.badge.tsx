import { appLabels } from '@/app/labels/catalog';
import { Badge } from '@tet/ui';
import type { JSX } from 'react';

export const ActionDeReferenceAdemeBadge = (): JSX.Element => (
  <Badge
    title={appLabels.actionDeReferenceAdeme}
    variant="warning"
    size="sm"
    className="w-fit"
  />
);
