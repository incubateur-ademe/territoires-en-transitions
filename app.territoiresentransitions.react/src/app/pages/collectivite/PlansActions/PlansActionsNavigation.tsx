import {
  makeCollectiviteFichesNonClasseesUrl,
  makeCollectivitePlanActionAxeUrl,
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsSyntheseUrl,
} from 'app/paths';
import {useCreateFicheAction} from './FicheAction/data/useUpsertFicheAction';
import {useCreatePlanAction} from './PlanAction/data/useUpsertAxe';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import SideNav, {SideNavLinks} from 'ui/shared/SideNav';
import {useFichesNonClasseesListe} from './FicheAction/data/useFichesNonClasseesListe';
import {FicheAction} from './FicheAction/data/types';
import {usePlansNavigation} from './PlanAction/data/usePlansNavigation';
import {PlanNode} from './PlanAction/data/types';

type Props = {
  collectivite: CurrentCollectivite;
};

const PlansActionsNavigation = ({collectivite}: Props) => {
  const {data: planListe} = usePlansNavigation();
  const fichesNonClasseesListe = useFichesNonClasseesListe(
    collectivite.collectivite_id
  );

  const {mutate: createFicheAction} = useCreateFicheAction();

  const {mutate: createPlanAction} = useCreatePlanAction();

  const generateLinks = (
    plans?: PlanNode[],
    fichesNonClassees?: FicheAction[]
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
              displayName:
                plan.nom && plan.nom.length > 0 ? plan.nom : 'Sans titre',
              enfants: plan.children.map(e => ({
                link: makeCollectivitePlanActionAxeUrl({
                  collectiviteId: collectivite.collectivite_id,
                  planActionUid: plan.id.toString(),
                  axeUid: e.id.toString(),
                }),
                displayName: e.nom && e.nom.length > 0 ? e.nom : 'Sans titre',
              })),
            };
          } else {
            return {
              link: makeCollectivitePlanActionUrl({
                collectiviteId: collectivite.collectivite_id,
                planActionUid: plan.id.toString(),
              }),
              displayName:
                plan.nom && plan.nom.length >= 0 ? plan.nom : 'Sans titre',
            };
          }
        })
      );
    }

    if (fichesNonClassees && fichesNonClassees.length > 0) {
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
        links={generateLinks(planListe, fichesNonClasseesListe?.fiches)}
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
            <button
              data-test="AjouterPlanAction"
              className="fr-btn fr-btn--tertiary"
              onClick={() => createPlanAction()}
            >
              Ajouter un plan d'action
            </button>
          </li>
        </ul>
      )}
    </div>
  );
};

export default PlansActionsNavigation;
