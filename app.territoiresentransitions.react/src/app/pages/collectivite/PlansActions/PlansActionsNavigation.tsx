import {
  makeCollectiviteFichesNonClasseesUrl,
  makeCollectivitePlanActionAxeUrl,
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsNouveauUrl,
  makeCollectivitePlansActionsSyntheseUrl,
} from 'app/paths';
import {useCreateFicheAction} from './FicheAction/data/useUpsertFicheAction';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import SideNav, {SideNavLinks} from 'ui/shared/SideNav';
import {useFichesNonClasseesListe} from './FicheAction/data/useFichesNonClasseesListe';
import {usePlansNavigation} from './PlanAction/data/usePlansNavigation';
import {PlanNode} from './PlanAction/data/types';
import {generateTitle} from './FicheAction/data/utils';
import {Link} from 'react-router-dom';

type Props = {
  collectivite: CurrentCollectivite;
};

const PlansActionsNavigation = ({collectivite}: Props) => {
  const {data: planListe} = usePlansNavigation();
  const fichesNonClasseesListe = useFichesNonClasseesListe(
    collectivite.collectivite_id
  );

  const {mutate: createFicheAction} = useCreateFicheAction();

  const generateLinks = (
    plans?: PlanNode[],
    fichesNonClasseesTotal?: number | null
  ) => {
    const plansLinks: SideNavLinks = [
      {
        link: makeCollectivitePlansActionsSyntheseUrl({
          collectiviteId: collectivite.collectivite_id,
        }),
        displayName: 'Synthèse',
      },
    ];

    if (plans) {
      plansLinks.push(
        ...plans.map(plan => {
          if (plan.children && plan.children.length > 0) {
            return {
              link: makeCollectivitePlanActionUrl({
                collectiviteId: collectivite.collectivite_id,
                planActionUid: plan.id.toString(),
              }),
              displayName: generateTitle(plan.nom),
              enfants: plan.children.map(e => ({
                link: makeCollectivitePlanActionAxeUrl({
                  collectiviteId: collectivite.collectivite_id,
                  planActionUid: plan.id.toString(),
                  axeUid: e.id.toString(),
                }),
                displayName: generateTitle(e.nom),
              })),
            };
          } else {
            return {
              link: makeCollectivitePlanActionUrl({
                collectiviteId: collectivite.collectivite_id,
                planActionUid: plan.id.toString(),
              }),
              displayName: generateTitle(plan.nom),
            };
          }
        })
      );
    }

    if (fichesNonClasseesTotal && fichesNonClasseesTotal > 0) {
      plansLinks.push({
        link: makeCollectiviteFichesNonClasseesUrl({
          collectiviteId: collectivite.collectivite_id,
        }),
        displayName: 'Fiches non classées',
      });
    }

    return plansLinks;
  };

  return (
    <div data-test="PlansActionNavigation">
      <SideNav
        links={generateLinks(planListe, fichesNonClasseesListe?.count)}
      />
      {!collectivite.readonly && (
        <ul className="mb-8 -mt-2 px-8">
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
            <Link
              data-test="AjouterPlanAction"
              className="fr-btn fr-btn--tertiary"
              to={makeCollectivitePlansActionsNouveauUrl({
                collectiviteId: collectivite.collectivite_id,
              })}
            >
              Ajouter un plan d'action
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
};

export default PlansActionsNavigation;
