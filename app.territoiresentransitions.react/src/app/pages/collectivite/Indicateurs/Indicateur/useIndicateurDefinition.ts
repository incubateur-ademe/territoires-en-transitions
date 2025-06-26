import { useCollectiviteId } from '@/api/collectivites/collectivite-context';
import { RouterInput, useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

type ListDefinitionsInput = RouterInput['indicateurs']['definitions']['list'];

/** Charge la définition détaillée d'un indicateur */
export const useIndicateurDefinition = (
  indicateurId: number | string,
  collectiviteId: number
) => {
  const trpc = useTRPC();
  const estIdReferentiel = typeof indicateurId === 'string';

  const { data, error, isLoading } = useQuery(
    trpc.indicateurs.definitions.list.queryOptions({
      collectiviteId,
      ...(estIdReferentiel
        ? { identifiantsReferentiel: [indicateurId] }
        : { indicateurIds: [indicateurId] }),
    })
  );

  return { data: data?.[0], error, isLoading };
};

/** Charge la définition détaillée de plusieurs indicateurs */
export const useIndicateurDefinitions = (
  input: ListDefinitionsInput | null,
  options?: {
    disabled?: boolean;
    doNotAddCollectiviteId?: boolean;
  }
) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.indicateurs.definitions.list.queryOptions(
      options?.doNotAddCollectiviteId
        ? input || {}
        : {
            ...input,
            collectiviteId,
          },
      {
        enabled: input !== null && !options?.disabled,
      }
    )
  );
};
