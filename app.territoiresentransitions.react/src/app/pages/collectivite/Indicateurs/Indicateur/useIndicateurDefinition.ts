import { useCollectiviteId } from '@/api/collectivites/collectivite-context';
import { trpc } from '@/api/utils/trpc/client';
import { ListDefinitionsInput } from '@/backend/indicateurs/list-definitions/list-definitions.input';

/** Charge la définition détaillée d'un indicateur */
export const useIndicateurDefinition = (indicateurId: number | string) => {
  const collectiviteId = useCollectiviteId();

  const estIdReferentiel = typeof indicateurId === 'string';
  const { data, ...other } = trpc.indicateurs.definitions.list.useQuery({
    collectiviteId,
    ...(estIdReferentiel
      ? { identifiantsReferentiel: [indicateurId] }
      : { indicateurIds: [indicateurId] }),
  });
  return { data: data?.[0], ...other };
};

/** Charge la définition détaillée de plusieurs indicateurs */
export const useIndicateurDefinitions = (
  input: ListDefinitionsInput | null,
  requested = true
) => {
  const collectiviteId = useCollectiviteId();

  return trpc.indicateurs.definitions.list.useQuery(
    {
      ...input,
      collectiviteId,
    },
    {
      enabled: input !== null && requested,
    }
  );
};
