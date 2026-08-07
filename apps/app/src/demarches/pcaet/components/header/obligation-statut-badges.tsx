import { formatDemarcheStatut } from '@/app/demarches/pcaet/constants';
import { DemarchePcaetObligationEnum } from '@tet/domain/demarches';
import type { DemarchePcaet } from '@/app/demarches/types';
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
        obligation === DemarchePcaetObligationEnum.OBLIGATOIRE
          ? appLabels.demarcheObligationObligatoire
          : appLabels.demarcheObligationVolontaire
      }
      variant={
        obligation === DemarchePcaetObligationEnum.OBLIGATOIRE
          ? 'error'
          : 'standard'
      }
      size="xs"
    />
    <Separator />
    <Badge title={formatDemarcheStatut(statut)} variant="info" size="xs" />
    {isPublished ? (
      <Badge
        title={appLabels.demarcheBadgePubliee}
        variant="success"
        size="xs"
      />
    ) : null}
  </div>
);
