import { Badge } from '@tet/ui';
import { JSX } from 'react';
import {
  DREAL_STATUT_BADGE_VARIANT,
  DREAL_STATUT_LABEL,
  type DrealDepotStatut,
} from '../vue-dreal.mock';

/**
 * Badge de statut de dépôt PCAET — mapping statut → couleur centralisé
 * (cf. vue-dreal.mock). Utilisé à l'identique dans le tableau (écran 1) et
 * le header du dossier (écran 2) pour garantir la cohérence.
 */
export const DrealStatutBadge = ({
  statut,
}: {
  statut: DrealDepotStatut;
}): JSX.Element => (
  <Badge
    title={DREAL_STATUT_LABEL[statut]}
    variant={DREAL_STATUT_BADGE_VARIANT[statut]}
    size="sm"
    trim={false}
  />
);
