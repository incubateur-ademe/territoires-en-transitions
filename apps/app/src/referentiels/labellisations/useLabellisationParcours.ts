import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useUserSession } from '@tet/api/users';
import { ParcoursLabellisation, ReferentielId } from '@tet/domain/referentiels';

/**
 * charge les données du parcours
 */
export const useLabellisationParcours = ({
  collectiviteId,
  referentielId,
}: {
  collectiviteId: number;
  referentielId: ReferentielId;
}): {
  parcours: ParcoursLabellisation | null;
  isLoading: boolean;
  isError: boolean;
} => {
  const session = useUserSession();
  const trpc = useTRPC();

  const {
    data: parcoursListFromSnapshot,
    isLoading,
    isError,
  } = useQuery(
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

  const parcours = parcoursListFromSnapshot
    ? {
        ...parcoursListFromSnapshot,
        collectivite_id: collectiviteId,
        referentiel: referentielId,
      }
    : null;

  return { parcours, isLoading, isError };
};
