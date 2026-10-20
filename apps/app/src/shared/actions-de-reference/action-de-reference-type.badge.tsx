import { appLabels } from '@/app/labels/catalog';
import { Badge } from '@tet/ui';
import type { JSX } from 'react';

export const ActionDeReferenceTypeBadge = (): JSX.Element => (
  <Badge
    title={appLabels.actionDeReference}
    variant="warning"
    size="sm"
    className="w-fit"
  />
);
