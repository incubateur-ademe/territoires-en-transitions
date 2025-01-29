import { trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';

/** Charge la définition détaillée d'un indicateur */
export const useIndicateurDefinition = (indicateurId: number | string) => {
  const collectiviteId = useCollectiviteId()!;

  const estIdReferentiel = typeof indicateurId === 'string';
  const { data } = trpc.indicateurs.definitions.list.useQuery({
    collectiviteId,
    ...(estIdReferentiel
      ? { identifiantsReferentiel: [indicateurId] }
      : { indicateurIds: [indicateurId] }),
  });
  return data?.[0];
};

/** Charge la définition détaillée de plusieurs indicateurs */
export const useIndicateurDefinitions = (indicateurIds: number[]) => {
  const collectiviteId = useCollectiviteId()!;

  return trpc.indicateurs.definitions.list.useQuery(
    {
      collectiviteId,
      indicateurIds,
    },
    {
      enabled: !!indicateurIds?.length,
    }
  );
};
