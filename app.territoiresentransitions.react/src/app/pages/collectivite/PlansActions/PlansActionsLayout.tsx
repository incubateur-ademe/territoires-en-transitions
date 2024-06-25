import {Link} from 'react-router-dom';
import CollectivitePageLayout from '../CollectivitePageLayout/CollectivitePageLayout';
import {
  generatePlanActionNavigationLinks,
  usePlansNavigation,
} from './PlanAction/data/usePlansNavigation';
import {useFichesNonClasseesListe} from './FicheAction/data/useFichesNonClasseesListe';
import {useCreateFicheAction} from './FicheAction/data/useUpsertFicheAction';
import {makeCollectivitePlansActionsNouveauUrl} from 'app/paths';

type PlansActionsLayoutProps = {
  children: JSX.Element;
  collectiviteId: number;
  isReadonly: boolean;
};

const PlansActionsLayout = ({
  children,
  collectiviteId,
  isReadonly,
}: PlansActionsLayoutProps) => {
  const {data: axes} = usePlansNavigation();
  const {data: fichesNonClasseesListe} =
    useFichesNonClasseesListe(collectiviteId);

  const {mutate: createFicheAction} = useCreateFicheAction();

  const hasFicheNonClassees =
    (fichesNonClasseesListe && fichesNonClasseesListe.length > 0) || false;

  return (
    <CollectivitePageLayout
      dataTest="PlansAction"
      sideNav={{
        links: generatePlanActionNavigationLinks(
          collectiviteId,
          hasFicheNonClassees,
          axes
        ),
        actions: !isReadonly && (
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
                to={makeCollectivitePlansActionsNouveauUrl({
                  collectiviteId: collectiviteId,
                })}
              >
                Ajouter un plan d'action
              </Link>
            </li>
          </>
        ),
      }}
    >
      {children}
    </CollectivitePageLayout>
  );
};

export default PlansActionsLayout;
