import {useCreateFicheAction} from './FicheAction/data/useUpsertFicheAction';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import SideNav from 'ui/shared/SideNav';
import {useFichesNonClasseesListe} from './FicheAction/data/useFichesNonClasseesListe';
import {
  generatePlanActionNavigationLinks,
  usePlansNavigation,
} from './PlanAction/data/usePlansNavigation';

type Props = {
  collectivite: CurrentCollectivite;
};

const PlansActionsNavigation = ({collectivite}: Props) => {
  const {data: planListe} = usePlansNavigation();
  const fichesNonClasseesListe = useFichesNonClasseesListe(
    collectivite.collectivite_id
  );

  return <div data-test="PlansActionNavigation"></div>;
};

export default PlansActionsNavigation;
