import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useUserSession } from '@tet/api/users';
import {
  Etoile,
  ParcoursLabellisation,
  ReferentielId,
} from '@tet/domain/referentiels';

export const useLabellisationParcours = ({
  collectiviteId,
  referentielId,
  etoileVisee,
}: {
  collectiviteId: number;
  referentielId: ReferentielId;
  etoileVisee?: Etoile;
}): {
  parcours: ParcoursLabellisation | null;
  isLoading: boolean;
  isError: boolean;
} => {
  const session = useUserSession();
  const trpc = useTRPC();

  const {
    data: parcours,
    isLoading,
    isError,
  } = useQuery(
    trpc.referentiels.labellisations.getParcours.queryOptions(
      {
        collectiviteId,
        referentielId,
        etoileVisee,
      },
      {
        enabled: Boolean(session?.user) && !session?.user?.is_anonymous,
        refetchOnWindowFocus: true,
        placeholderData: keepPreviousData,
      }
    )
  );

  return { parcours: parcours ?? null, isLoading, isError };
};
