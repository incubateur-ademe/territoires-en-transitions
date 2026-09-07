import { makeDemandesAvisUrl } from '@/app/app/paths';
import {
  collectiviteTypeEnumSchema,
  isServiceDeconcentre,
} from '@tet/domain/collectivites';

/**
 * La page d'accueil du service qu'un rattachement automatique vient d'ouvrir,
 * lue des paramètres que le callback OIDC a posés sur `/auth/verify`.
 *
 * Ne vaut que pour les structures dont l'espace **est** celui de l'instruction.
 * Un conseil régional se rejoint aussi par identité, mais garde son tableau de
 * bord : le renvoyer sur `demandes-avis` le priverait de son espace, et c'est la
 * résolution habituelle de `/` qui l'y conduit correctement.
 *
 * Les paramètres viennent d'une URL, donc de l'extérieur : un identifiant qui
 * n'est pas un entier positif ou un type inconnu ne donne aucune destination.
 * Le pire qu'un paramètre forgé obtienne est une page d'instruction dont les
 * gardes de route refuseront l'accès.
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
