import { formatDemarcheStatut } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import type { DemarchePcaet } from '@/app/demarches/pcaet/demarche-pcaet.types';
import { appLabels } from '@/app/labels/catalog';
import { Badge } from '@tet/ui';
import { JSX } from 'react';
import { Separator } from './separator';

export const ObligationStatutBadges = ({
  obligation,
  statut,
  isPublished,
}: {
  obligation: DemarchePcaet['obligation'];
  statut: DemarchePcaet['statut'];
  isPublished: boolean;
}): JSX.Element => (
  <div className="flex items-center gap-2">
    <Badge
      title={
        obligation === 'obligatoire'
          ? appLabels.demarchePcaetObligationObligatoire
          : appLabels.demarchePcaetObligationVolontaire
      }
      variant={obligation === 'obligatoire' ? 'error' : 'standard'}
      size="xs"
    />
    <Separator />
    <Badge title={formatDemarcheStatut(statut)} variant="info" size="xs" />
    {isPublished ? (
      <Badge
        title={appLabels.demarchePcaetBadgePubliee}
        variant="success"
        size="xs"
      />
    ) : null}
  </div>
);
