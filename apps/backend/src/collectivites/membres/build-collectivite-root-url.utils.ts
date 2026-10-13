import {
  CollectiviteType,
  isServiceDeconcentre,
} from '@tet/domain/collectivites';

/**
 * La page d'arrivée d'un membre dans une collectivité, pour les liens de mail.
 *
 * Pas `/` : il ouvre la collectivité courante de l'utilisateur, pas celle du
 * lien. Pas `/tableau-de-bord` pour un service déconcentré : `StandardOnlyLayout`
 * lui répond 404 avant que la page ne redirige vers l'instruction.
 */
export const buildCollectiviteRootUrl = ({
  appUrl,
  collectiviteId,
  collectiviteType,
}: {
  appUrl: string;
  collectiviteId: number;
  collectiviteType: CollectiviteType;
}): string =>
  isServiceDeconcentre(collectiviteType)
    ? `${appUrl}/collectivite/${collectiviteId}/demandes-avis`
    : `${appUrl}/collectivite/${collectiviteId}/tableau-de-bord`;
