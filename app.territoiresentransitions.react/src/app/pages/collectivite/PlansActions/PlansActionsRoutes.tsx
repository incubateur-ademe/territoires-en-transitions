'use client';
import { useGetCurrentCollectivite } from '@/api/collectivites/use-get-current-collectivite';
import { PanelProvider } from '@/app/app/pages/collectivite/CollectivitePageLayout/Panel/PanelContext';
import FichesNonClassees from '@/app/app/pages/collectivite/PlansActions/FichesNonClassees';
import {
  collectiviteFichesNonClasseesPath,
  collectivitePlanActionLandingPath,
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsNouveauUrl,
} from '@/app/app/paths';
import { Redirect, Route } from 'react-router-dom';
import { usePlansNavigation } from './PlanAction/data/usePlansNavigation';

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
  const { data: axes } = usePlansNavigation();

  if (!axes || !collectivite) return null;

  return (
    <PanelProvider>
      <Route exact path={collectivitePlanActionLandingPath}>
        {readonly && axes.length === 0 ? (
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
              axes.length > 0
                ? makeCollectivitePlanActionUrl({
                    collectiviteId: collectivite_id,
                    planActionUid:
                      axes
                        .filter((axe) => axe.depth === 0)
                        .at(0)
                        ?.id.toString() || '',
                  })
                : makeCollectivitePlansActionsNouveauUrl({
                    collectiviteId: collectivite_id,
                  })
            }
          />
        )}
      </Route>

      {/* Liste des fiches non classées */}
      <Route exact path={[collectiviteFichesNonClasseesPath]}>
        <FichesNonClassees collectivite={collectivite} />
      </Route>
    </PanelProvider>
  );
};
