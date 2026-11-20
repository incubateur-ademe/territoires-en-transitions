import { makeDemandesAvisUrl, makeTdbCollectiviteUrl } from '@/app/app/paths';
import { RouterOutput } from '@tet/api';
import { isServiceDeconcentre } from '@tet/domain/collectivites';

export type ConsumedInvitations =
  RouterOutput['collectivites']['membres']['invitations']['consumePendings'];

/**
 * La page d'arrivée dans la première collectivité qu'une invitation reprise
 * vient d'ouvrir : l'instruction pour un service déconcentré, dont le tableau
 * de bord répond 404, le tableau de bord sinon.
 */
export function makeConsumedInvitationsLanding(
  consumed: ConsumedInvitations
): string | null {
  const [first] = consumed;
  if (!first) {
    return null;
  }
  const { collectiviteId, collectiviteType } = first;
  return isServiceDeconcentre(collectiviteType)
    ? makeDemandesAvisUrl({ collectiviteId })
    : makeTdbCollectiviteUrl({ collectiviteId });
}
