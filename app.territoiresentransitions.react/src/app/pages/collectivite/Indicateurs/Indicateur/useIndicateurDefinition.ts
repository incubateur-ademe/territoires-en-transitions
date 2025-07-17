import { useCollectiviteId } from '@/api/collectivites/collectivite-context';
import { RouterInput, trpc } from '@/api/utils/trpc/client';

type ListDefinitionsInput = RouterInput['indicateurs']['definitions']['list'];

/** Charge la définition détaillée d'un indicateur */
export const useIndicateurDefinition = (
  indicateurId: number | string,
  collectiviteId: number
) => {
  const estIdReferentiel = typeof indicateurId === 'string';
  const { data, error, isLoading } = trpc.indicateurs.definitions.list.useQuery(
    {
      collectiviteId,
      ...(estIdReferentiel
        ? { identifiantsReferentiel: [indicateurId] }
        : { indicateurIds: [indicateurId] }),
    }
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

  return trpc.indicateurs.definitions.list.useQuery(
    options?.doNotAddCollectiviteId
      ? input || {}
      : {
          ...input,
          collectiviteId,
        },
    {
      enabled: input !== null && !options?.disabled,
    }
  );
};
