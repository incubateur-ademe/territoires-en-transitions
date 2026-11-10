import { appLabels } from '@/app/labels/catalog';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';

export const usePlanCreationCapabilities = () => {
  const trpc = useTRPC();
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const canMutatePlan = hasCollectivitePermission('plans.mutate');
  const query = useQuery(
    trpc.plans.plans.getCreationCapabilities.queryOptions(
      { collectiviteId },
      { enabled: canMutatePlan, retry: false, staleTime: 0 }
    )
  );

  const canCreateType = (typeId: number | null | undefined): boolean =>
    canMutatePlan &&
    (typeId == null ||
      (query.isSuccess && !query.data.unavailableTypeIds.includes(typeId)));

  const getDisabledReason = (
    typeId: number | null | undefined
  ): string | undefined => {
    if (canCreateType(typeId)) return undefined;
    if (query.isPending && canMutatePlan) return appLabels.chargement;
    if (query.isError) return appLabels.planCreationVerificationIndisponible;
    return appLabels.planCreationTypeIndisponible;
  };

  return { canCreateType, getDisabledReason };
};
