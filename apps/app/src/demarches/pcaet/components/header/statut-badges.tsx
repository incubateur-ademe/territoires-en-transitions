import { appLabels } from '@/app/labels/catalog';
import { Badge } from '@tet/ui';
import { JSX } from 'react';

export const StatutBadges = ({
  isPublished,
}: {
  isPublished: boolean;
}): JSX.Element | null =>
  isPublished ? (
    <Badge
      title={appLabels.demarcheBadgePubliee}
      variant="success"
      size="xs"
    />
  ) : null;
