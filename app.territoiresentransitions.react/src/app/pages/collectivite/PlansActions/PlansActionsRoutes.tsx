import { useGetCurrentCollectivite } from '@/api/collectivites/use-get-current-collectivite';
import { useUser } from '@/api/users/user-provider';
import { useCreateFicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction';
import FichesNonClassees from '@/app/app/pages/collectivite/PlansActions/FichesNonClassees';
import { ImportPlanButton } from '@/app/app/pages/collectivite/PlansActions/ParcoursCreationPlan/Import/import-plan.button';
import {
  collectiviteFichesNonClasseesPath,
  collectivitePlanActionLandingPath,
  collectivitePlansActionsCreerPath,
  collectivitePlansActionsImporterPath,
  collectivitePlansActionsNouveauPath,
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsNouveauUrl,
} from '@/app/app/paths';
import { useDemoMode } from '@/app/users/demo-mode-support-provider';
import { Button, Event, useEventTracker } from '@/ui';
import { Redirect, Route } from 'react-router-dom';
import CollectivitePageLayout from '../CollectivitePageLayout/CollectivitePageLayout';
import { useFichesNonClasseesListe } from './FicheAction/data/useFichesNonClasseesListe';
import { CreerPlanPage } from './ParcoursCreationPlan/CreerPlanPage';
import { ImporterPlanPage } from './ParcoursCreationPlan/ImporterPlanPage';
import { SelectionPage } from './ParcoursCreationPlan/SelectionPage';
import {
  generatePlanActionNavigationLinks,
  usePlansNavigation,
} from './PlanAction/data/usePlansNavigation';

type Props = {
  collectivite_id: number;
  readonly: boolean;
};

/**
 * Routes starting with collectivite/:collectiviteId/plans see CollectiviteRoutes.tsx
 */
export const PlansActionsRoutes = ({ collectivite_id, readonly }: Props) => {
  const collectivite = useGetCurrentCollectivite(collectivite_id);
  const user = useUser();
  const { isDemoMode } = useDemoMode();

  const { data: axes } = usePlansNavigation();
  const { data: fichesNonClasseesListe } = useFichesNonClasseesListe();

  const { mutate: createFicheAction } = useCreateFicheAction();

  const trackEvent = useEventTracker();

  const hasFicheNonClassees =
    (fichesNonClasseesListe && fichesNonClasseesListe.length > 0) || false;

  if (!axes || !collectivite) return null;

  return (
    <CollectivitePageLayout
      dataTest="PlansAction"
      sideNav={{
        links: generatePlanActionNavigationLinks(
          collectivite_id,
          hasFicheNonClassees,
          axes
        ),
        actions: (
          <div className="flex flex-col gap-2 mb-6 -mt-6">
            {!readonly && (
              <>
                <Button
                  data-test="CreerFicheAction"
                  variant="outlined"
                  size="sm"
                  onClick={() => createFicheAction()}
                >
                  Créer une fiche action
                </Button>
                <Button
                  data-test="AjouterPlanAction"
                  size="sm"
                  href={makeCollectivitePlansActionsNouveauUrl({
                    collectiviteId: collectivite_id,
                  })}
                  onClick={() =>
                    trackEvent(Event.plans.sideNavAjouterPlanClick)
                  }
                >
                  Ajouter un plan d&apos;action
                </Button>
              </>
            )}
            {user.isSupport && !isDemoMode && (
              <ImportPlanButton collectiviteId={collectivite?.collectiviteId} />
            )}
          </div>
        ),
      }}
    >
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

      {/* Menu de création d'un plan */}
      <Route exact path={collectivitePlansActionsNouveauPath}>
        <SelectionPage />
      </Route>

      {/* Importation d'un plan */}
      <Route exact path={collectivitePlansActionsImporterPath}>
        <ImporterPlanPage />
      </Route>

      {/* Création d'un plan */}
      <Route exact path={collectivitePlansActionsCreerPath}>
        <CreerPlanPage />
      </Route>

      {/* Liste des fiches non classées */}
      <Route exact path={[collectiviteFichesNonClasseesPath]}>
        <FichesNonClassees collectivite={collectivite} />
      </Route>
    </CollectivitePageLayout>
  );
};
