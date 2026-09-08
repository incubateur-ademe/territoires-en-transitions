import { makeDemandesAvisUrl } from '@/app/app/paths';
import {
  collectiviteTypeEnumSchema,
  isServiceDeconcentre,
} from '@tet/domain/collectivites';

/**
 * La page d'accueil du service qu'un rattachement vient d'ouvrir, lue des
 * paramètres posés sur `/auth/verify`.
 *
 * Rien pour un conseil régional : il se rejoint par identité mais garde son
 * tableau de bord, où la résolution habituelle de `/` le conduit. Les
 * paramètres venant d'une URL, un identifiant ou un type invalide ne donne
 * aucune destination.
 */
export function readAutoAttachmentLanding(
  searchParams: URLSearchParams
): string | null {
  const collectiviteId = Number(searchParams.get('rattachement'));
  const type = collectiviteTypeEnumSchema.safeParse(
    searchParams.get('rattachement-type')
  );

  if (
    !Number.isInteger(collectiviteId) ||
    collectiviteId <= 0 ||
    !type.success
  ) {
    return null;
  }

  return isServiceDeconcentre(type.data)
    ? makeDemandesAvisUrl({ collectiviteId })
    : null;
}
