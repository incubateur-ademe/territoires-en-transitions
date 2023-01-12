import {NavLink} from 'react-router-dom';

import {
  makeCollectiviteFichesNonClasseesUrl,
  makeCollectivitePlanActionUrl,
} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useCreateFicheAction} from './FicheAction/data/useUpsertFicheAction';
import {usePlansActionsListe} from './PlanAction/data/usePlansActionsListe';

const PlansActionsNavigation = () => {
  const collectivite_id = useCollectiviteId();

  const data = usePlansActionsListe(collectivite_id!);

  const {mutate: createFicheAction} = useCreateFicheAction();

  if (!collectivite_id) return null;

  return (
    <nav className="fr-sidemenu flex w-max py-8 md:px-8 border-r border-gray-100 whitespace-nowrap">
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
                    collectiviteId: collectivite_id,
                    planActionUid: plan.id.toString(),
                  })}
                  target="_self"
                  aria-current="page"
                >
                  {plan.nom}
                </NavLink>
              </li>
            ))}
          <li className="fr-sidemenu_item fr-sidemenu_item--active">
            <NavLink
              className="fr-sidemenu__link"
              to={makeCollectiviteFichesNonClasseesUrl({
                collectiviteId: collectivite_id,
              })}
              target="_self"
              aria-current="page"
            >
              Fiches non classées
            </NavLink>
          </li>
          <li className="fr-sidemenu_item mt-6">
            <button className="fr-btn" onClick={() => createFicheAction()}>
              Créer une fiche action
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default PlansActionsNavigation;
