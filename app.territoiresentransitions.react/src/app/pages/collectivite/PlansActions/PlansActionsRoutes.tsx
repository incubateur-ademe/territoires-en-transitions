import { Redirect, Route } from 'react-router-dom';
import FichesNonClassees from 'app/pages/collectivite/PlansActions/FichesNonClassees';
import {
  collectiviteFichesNonClasseesPath,
  collectivitePlanActionAxePath,
  collectivitePlanActionLandingPath,
  collectivitePlanActionPath,
  collectivitePlansActionsCreerPath,
  collectivitePlansActionsImporterPath,
  collectivitePlansActionsNouveauPath,
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsNouveauUrl,
} from 'app/paths';
import CollectivitePageLayout from '../CollectivitePageLayout/CollectivitePageLayout';
import { useFichesNonClasseesListe } from './FicheAction/data/useFichesNonClasseesListe';
import { CreerPlanPage } from './ParcoursCreationPlan/CreerPlanPage';
import { ImporterPlanPage } from './ParcoursCreationPlan/ImporterPlanPage';
import { SelectionPage } from './ParcoursCreationPlan/SelectionPage';
import { PlanActionPage } from './PlanAction/PlanActionPage';
import {
  generatePlanActionNavigationLinks,
  usePlansNavigation,
} from './PlanAction/data/usePlansNavigation';
import { useCreateFicheAction } from '@tet/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction';
import Link from 'next/link';

type Props = {
  collectivite_id: number;
  readonly: boolean;
};

/**
 * Routes starting with collectivite/:collectiviteId/plans see CollectiviteRoutes.tsx
 */
export const PlansActionsRoutes = ({ collectivite_id, readonly }: Props) => {
  const { data: axes } = usePlansNavigation();
  const { data: fichesNonClasseesListe } =
    useFichesNonClasseesListe(collectivite_id);

  const { mutate: createFicheAction } = useCreateFicheAction();

  const hasFicheNonClassees =
    (fichesNonClasseesListe && fichesNonClasseesListe.length > 0) || false;

  return (
    <CollectivitePageLayout
      dataTest="PlansAction"
      sideNav={{
        links: generatePlanActionNavigationLinks(
          collectivite_id,
          hasFicheNonClassees,
          axes
        ),
        actions: !readonly && (
          <>
            <li className="fr-sidemenu_item p-0 list-none">
              <button
                data-test="CreerFicheAction"
                className="fr-btn fr-btn--primary"
                onClick={() => createFicheAction()}
              >
                Créer une fiche action
              </button>
            </li>
            <li className="fr-sidemenu_item mt-6 p-0 list-none">
              <Link
                data-test="AjouterPlanAction"
                className="fr-btn fr-btn--tertiary"
                href={makeCollectivitePlansActionsNouveauUrl({
                  collectiviteId: collectivite_id,
                })}
              >
                Ajouter un plan d&apos;action
              </Link>
            </li>
          </>
        ),
      }}
    >
      <Route exact path={collectivitePlanActionLandingPath}>
        <Redirect
          to={makeCollectivitePlanActionUrl({
            collectiviteId: collectivite_id,
            planActionUid:
              axes
                ?.filter((axe) => axe.depth === 0)
                .at(0)
                ?.id.toString() || '',
          })}
        />
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

      {/** Vue détaillée d'un plan action */}
      <Route exact path={collectivitePlanActionPath}>
        <PlanActionPage />
      </Route>

      {/** Vue détaillée d'un axe */}
      <Route exact path={collectivitePlanActionAxePath}>
        <PlanActionPage />
      </Route>

      {/* Liste des fiches non classées */}
      <Route exact path={[collectiviteFichesNonClasseesPath]}>
        <FichesNonClassees />
      </Route>
    </CollectivitePageLayout>
  );
};
