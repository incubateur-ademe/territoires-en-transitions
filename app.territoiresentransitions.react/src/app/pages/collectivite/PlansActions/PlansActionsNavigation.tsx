import {NavLink} from 'react-router-dom';

import {
  makeCollectiviteFichesNonClasseesUrl,
  makeCollectivitePlanActionUrl,
} from 'app/paths';
import {useCreateFicheAction} from './FicheAction/data/useUpsertFicheAction';
import {usePlansActionsListe} from './PlanAction/data/usePlansActionsListe';
import {useCreatePlanAction} from './PlanAction/data/useUpsertAxe';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';

const PlansActionsNavigation = () => {
  const collectivite = useCurrentCollectivite();

  const data = usePlansActionsListe(collectivite?.collectivite_id!);

  const {mutate: createFicheAction} = useCreateFicheAction();

  const {mutate: createPlanAction} = useCreatePlanAction();

  if (!collectivite?.collectivite_id) return null;

  return (
    <nav className="fr-sidemenu flex w-80 shrink-0 py-8 md:px-8 border-r border-gray-100">
      <div className="fr-sidemenu-wrapper">
        <ul className="fr-sidemenu_list">
          {data &&
            data.plans.map(plan => (
              <li
                key={plan.id}
                className="fr-sidemnu_item fr-sidemenu_item--active"
              >
                <NavLink
                  className="fr-sidemenu__link"
                  to={makeCollectivitePlanActionUrl({
                    collectiviteId: collectivite.collectivite_id,
                    planActionUid: plan.id.toString(),
                  })}
                  target="_self"
                  aria-current="page"
                >
                  {plan.nom && plan.nom.length >= 0 ? plan.nom : 'Sans titre'}
                </NavLink>
              </li>
            ))}
          <li className="fr-sidemenu_item fr-sidemenu_item--active">
            <NavLink
              className="fr-sidemenu__link"
              to={makeCollectiviteFichesNonClasseesUrl({
                collectiviteId: collectivite.collectivite_id,
              })}
              target="_self"
              aria-current="page"
            >
              Fiches non classées
            </NavLink>
          </li>
          {!collectivite?.readonly && (
            <>
              <li className="fr-sidemenu_item mt-6">
                <button className="fr-btn" onClick={() => createFicheAction()}>
                  Créer une fiche action
                </button>
              </li>
              <li className="fr-sidemenu_item mt-6">
                <button
                  className="fr-btn fr-btn--secondary"
                  onClick={() => createPlanAction()}
                >
                  Ajouter un plan d'action
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default PlansActionsNavigation;
