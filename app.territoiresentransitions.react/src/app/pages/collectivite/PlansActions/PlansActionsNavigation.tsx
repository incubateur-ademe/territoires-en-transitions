import {
  makeCollectiviteFichesNonClasseesUrl,
  makeCollectivitePlanActionUrl,
} from 'app/paths';
import {useCreateFicheAction} from './FicheAction/data/useUpsertFicheAction';
import {usePlansActionsListe} from './PlanAction/data/usePlansActionsListe';
import {useCreatePlanAction} from './PlanAction/data/useUpsertAxe';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import SideNav, {TSideNavLink} from 'ui/shared/SideNav';
import {TAxeRow} from 'types/alias';

type Props = {
  collectivite: CurrentCollectivite;
};

const PlansActionsNavigation = ({collectivite}: Props) => {
  const data = usePlansActionsListe(collectivite.collectivite_id);

  const {mutate: createFicheAction} = useCreateFicheAction();

  const {mutate: createPlanAction} = useCreatePlanAction();

  const generateLinks = (plans?: TAxeRow[]) => {
    const plansLinks: TSideNavLink[] = plans
      ? plans.map(plan => ({
          link: makeCollectivitePlanActionUrl({
            collectiviteId: collectivite.collectivite_id,
            planActionUid: plan.id.toString(),
          }),
          displayName:
            plan.nom && plan.nom.length >= 0 ? plan.nom : 'Sans titre',
        }))
      : [];

    plansLinks.push({
      link: makeCollectiviteFichesNonClasseesUrl({
        collectiviteId: collectivite.collectivite_id,
      }),
      displayName: 'Fiches non classées',
    });

    return plansLinks;
  };

  return (
    <div data-test="PlansActionNavigation">
      <SideNav links={generateLinks(data?.plans)} />
      {!collectivite.readonly && (
        <ul className="mb-8 -mt-2 px-8">
          <li className="fr-sidemenu_item p-0 list-none">
            <button
              data-test="CreerFicheAction"
              className="fr-btn"
              onClick={() => createFicheAction()}
            >
              Créer une fiche action
            </button>
          </li>
          <li className="fr-sidemenu_item mt-6 p-0 list-none">
            <button
              data-test="AjouterPlanAction"
              className="fr-btn fr-btn--secondary"
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
