import type { DemarchePcaet } from '@/app/demarches/pcaet/demarche-pcaet.types';
import { appLabels } from '@/app/labels/catalog';
import { Badge } from '@tet/ui';
import { JSX } from 'react';

export const StatutBadges = ({
  isPublished,
}: {
  statut: DemarchePcaet['statut'];
  isPublished: boolean;
}): JSX.Element | null =>
  isPublished ? (
    <Badge
      title={appLabels.demarchePcaetBadgePubliee}
      variant="success"
      size="xs"
    />
  ) : null;
