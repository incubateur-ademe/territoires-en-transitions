import { useCollectiviteId } from '@/api/collectivites/collectivite-context';
import { trpc } from '@/api/utils/trpc/client';

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
  indicateurIds: number[],
  requested = true
) => {
  const collectiviteId = useCollectiviteId();

  return trpc.indicateurs.definitions.list.useQuery(
    {
      collectiviteId,
      indicateurIds,
    },
    {
      enabled: !!indicateurIds?.length && requested,
    }
  );
};
