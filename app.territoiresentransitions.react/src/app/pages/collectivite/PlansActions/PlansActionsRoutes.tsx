'use client';
import { useGetCurrentCollectivite } from '@/api/collectivites/use-get-current-collectivite';
import { useTRPC } from '@/api/utils/trpc/client';
import { PanelProvider } from '@/app/app/pages/collectivite/CollectivitePageLayout/Panel/PanelContext';
import {
  collectivitePlanActionLandingPath,
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsNouveauUrl,
} from '@/app/app/paths';
import { useQuery } from '@tanstack/react-query';
import { Redirect, Route } from 'react-router-dom';

/**
 * Routes starting with collectivite/:collectiviteId/plans see CollectiviteRoutes.tsx
 */
export const PlansActionsRoutes = ({
  collectivite_id,
}: {
  collectivite_id: number;
}) => {
  const collectivite = useGetCurrentCollectivite(collectivite_id);
  const readonly = collectivite?.isReadOnly;
  const trpcClient = useTRPC();
  const { data } = useQuery(
    trpcClient.plans.plans.list.queryOptions({
      collectiviteId: collectivite_id,
    })
  );
  const planIds = data?.plans.map((plan) => plan.id);

  if (!planIds || !collectivite) return null;

  return (
    <PanelProvider>
      <Route exact path={collectivitePlanActionLandingPath}>
        {readonly && planIds.length === 0 ? (
          <div className="flex">
            <div className="mt-64 mx-auto leading-relaxed text-grey-6 text-center">
              Aucun plan d&apos;action n&apos;a été ajouté
              <br />
              par cette collectivité pour le moment.
            </div>
          </div>
        ) : (
          <Redirect
            to={
              planIds.length > 0
                ? makeCollectivitePlanActionUrl({
                    collectiviteId: collectivite_id,
                    planActionUid: planIds.at(0)?.toString() || '',
                  })
                : makeCollectivitePlansActionsNouveauUrl({
                    collectiviteId: collectivite_id,
                  })
            }
          />
        )}
      </Route>
    </PanelProvider>
  );
};
