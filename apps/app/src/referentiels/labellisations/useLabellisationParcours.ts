import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useUserSession } from '@tet/api/users';
import { ReferentielId } from '@tet/domain/referentiels';

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
  const trpc = useTRPC();

  // Nouvelle méthode : charge les données du parcours depuis le snapshot
  const { data: parcoursListFromSnapshot } = useQuery(
    trpc.referentiels.labellisations.getParcours.queryOptions(
      {
        collectiviteId,
        referentielId,
      },
      {
        enabled: Boolean(session?.user) && !session?.user?.is_anonymous,
        refetchOnWindowFocus: true,
      }
    )
  );

  return parcoursListFromSnapshot
    ? {
        ...parcoursListFromSnapshot,
        collectivite_id: collectiviteId,
        referentiel: referentielId,
      }
    : null;
};
