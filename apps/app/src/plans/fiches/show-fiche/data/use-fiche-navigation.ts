import { makeCollectiviteActionUrl } from '@/app/app/paths';
import { useListFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { skipToken, useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useSelectedLayoutSegment } from 'next/navigation';
import { isFicheSectionId } from '../content/type';
import { PlanFicheNavigation } from '../navigation/plan-fiche-navigation';

export const useFicheNavigation = ({
  ficheId,
  planId,
}: {
  ficheId: number;
  planId?: number;
}) => {
  const trpc = useTRPC();
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const segment = useSelectedLayoutSegment();
  const content = segment && isFicheSectionId(segment) ? segment : 'details';
  const canReadPlan = hasCollectivitePermission('plans.read');
  const canReadFichesRestreintes = hasCollectivitePermission(
    'plans.fiches.read_confidentiel'
  );
  const enabled = planId !== undefined && canReadPlan;

  const { data: plan, error: planError } = useQuery(
    trpc.plans.plans.get.queryOptions(enabled ? { planId } : skipToken)
  );
  const { fiches, error: fichesError } = useListFiches(
    collectiviteId,
    {
      filters: {
        planActionIds: planId === undefined ? [] : [planId],
        ...(canReadFichesRestreintes ? {} : { restreint: false }),
      },
      queryOptions: {
        sort: [{ field: 'titre', direction: 'asc' }],
        limit: 'all',
      },
    },
    enabled
  );

  if (
    !enabled ||
    !plan ||
    plan.collectiviteId !== collectiviteId ||
    planError ||
    fichesError
  ) {
    return undefined;
  }

  const { previousId, nextId } = PlanFicheNavigation.getAdjacentFiches({
    planId,
    axes: plan.axes,
    orderedFicheIds: fiches.map((fiche) => fiche.id),
    ficheId,
  });
  if (previousId === undefined && nextId === undefined) return undefined;

  const makeUrl = (id: number) =>
    makeCollectiviteActionUrl({
      collectiviteId,
      ficheUid: id.toString(),
      planId,
      content,
    });

  return {
    previousHref: previousId === undefined ? undefined : makeUrl(previousId),
    nextHref: nextId === undefined ? undefined : makeUrl(nextId),
  };
};
