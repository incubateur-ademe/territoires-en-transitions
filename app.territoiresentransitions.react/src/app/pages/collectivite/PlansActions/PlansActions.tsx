import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {PlansActionsRoutes} from './PlansActionsRoutes';
import CollectivitePageLayout from '../CollectivitePageLayout/CollectivitePageLayout';
import {
  generatePlanActionNavigationLinks,
  usePlansNavigation,
} from './PlanAction/data/usePlansNavigation';
import {useFichesNonClasseesListe} from './FicheAction/data/useFichesNonClasseesListe';
import {useCreateFicheAction} from './FicheAction/data/useUpsertFicheAction';
import {useCreatePlanAction} from './PlanAction/data/useUpsertAxe';

const PlansActions = () => {
  const collectivite = useCurrentCollectivite();

  const {data: planListe} = usePlansNavigation();
  const fichesNonClasseesListe = useFichesNonClasseesListe(
    collectivite?.collectivite_id!
  );

  const {mutate: createFicheAction} = useCreateFicheAction();

  const {mutate: createPlanAction} = useCreatePlanAction();

  if (!collectivite) return null;

  return (
    <CollectivitePageLayout
      sideNav={{
        links: generatePlanActionNavigationLinks(
          collectivite.collectivite_id,
          planListe,
          fichesNonClasseesListe?.count
        ),
        actions: !collectivite.readonly && (
          <>
            <li className="fr-sidemenu_item p-0 list-none">
              <button
                data-test="CreerFicheAction"
                className="fr-btn fr-btn--secondary"
                onClick={() => createFicheAction()}
              >
                Créer une fiche action
              </button>
            </li>
            <li className="fr-sidemenu_item mt-6 p-0 list-none">
              <button
                data-test="AjouterPlanAction"
                className="fr-btn fr-btn--tertiary"
                onClick={() => createPlanAction()}
              >
                Ajouter un plan d'action
              </button>
            </li>
          </>
        ),
      }}
    >
      <PlansActionsRoutes collectivite_id={collectivite.collectivite_id} />
    </CollectivitePageLayout>
  );
};

export default PlansActions;
