import { useUserSession } from '@/api/users/user-provider';
import { trpc } from '@/api/utils/trpc/client';
import { ReferentielId } from '@/domain/referentiels';

/**
 * charge les données du parcours
 */
export const useLabellisationParcours = ({
  collectiviteId,
  referentielId,
}: {
  collectiviteId: number;
  referentielId: ReferentielId;
}) => {
  const session = useUserSession();

  // Nouvelle méthode : charge les données du parcours depuis le snapshot
  const { data: parcoursListFromSnapshot } =
    trpc.referentiels.labellisations.getParcours.useQuery(
      {
        collectiviteId,
        referentielId,
      },
      {
        enabled: Boolean(session?.user) && !session!.user.is_anonymous,
        refetchOnWindowFocus: true,
      }
    );

  return parcoursListFromSnapshot
    ? {
        ...parcoursListFromSnapshot,
        collectivite_id: collectiviteId,
        referentiel: referentielId,
      }
    : null;
};
