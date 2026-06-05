import { formatDemarcheStatut } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import type { DemarchePcaet } from '@/app/demarches/pcaet/demarche-pcaet.types';
import { appLabels } from '@/app/labels/catalog';
import { Badge } from '@tet/ui';
import { JSX } from 'react';
import { Separator } from './separator';

export const StatutBadges = ({
  statut,
  isPublished,
}: {
  statut: DemarchePcaet['statut'];
  isPublished: boolean;
}): JSX.Element => (
  <div className="flex items-center gap-2">
    <Badge title={formatDemarcheStatut(statut)} variant="info" size="xs" />
    {isPublished ? (
      <>
        <Separator />
        <Badge
          title={appLabels.demarchePcaetBadgePubliee}
          variant="success"
          size="xs"
        />
      </>
    ) : null}
  </div>
);
