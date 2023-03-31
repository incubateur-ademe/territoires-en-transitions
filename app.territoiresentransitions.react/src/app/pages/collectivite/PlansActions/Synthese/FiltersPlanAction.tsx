import TagFilters from 'ui/shared/filters/TagFilters';
import {useFichesNonClasseesListe} from '../FicheAction/data/useFichesNonClasseesListe';
import {usePlansActionsListe} from '../PlanAction/data/usePlansActionsListe';

/**
 * Filtres tags par plan d'action
 *
 * @param collectiviteId - (number) id de la collectivité affichée
 * @param onChangePlan - action lancée lors du changement de plan d'action
 * @param onChangeWithoutPlan - action lancée lors du toggle avec / sans plan d'action
 */

type FiltersPlanActionProps = {
  collectiviteId: number;
  onChangePlan: (id: number | null) => void;
  onChangeWithoutPlan: (value: boolean | null) => void;
};

const FiltersPlanAction = ({
  collectiviteId,
  onChangePlan,
  onChangeWithoutPlan,
}: FiltersPlanActionProps): JSX.Element => {
  const plansActions = usePlansActionsListe(collectiviteId);
  const fichesNonClassees = useFichesNonClasseesListe(collectiviteId);

  // Construction de la liste de filtres par plan d'action
  const filters = [{id: 'default', name: 'Toutes les fiches'}];

  if (plansActions?.plans && plansActions.plans.length) {
    filters.push(
      ...plansActions.plans.map(plan => ({
        id: plan.id.toString(),
        name: plan.nom && plan.nom.length > 0 ? plan.nom : 'Sans titre',
      }))
    );
  }

  if (fichesNonClassees?.fiches && fichesNonClassees.fiches.length > 0) {
    filters.push({
      id: 'nc',
      name: 'Fiches non classées',
    });
  }

  // Mise à jour des filtres sélectionnés
  const handleChangeFilter = (id: string) => {
    if (id === 'default') {
      onChangePlan(null);
      onChangeWithoutPlan(null);
    } else if (id === 'nc') {
      onChangePlan(null);
      onChangeWithoutPlan(true);
    } else {
      onChangePlan(parseInt(id));
      onChangeWithoutPlan(false);
    }
  };

  return (
    // Filtres affichés si plus d'un plan d'action défini
    filters.length > 2 ? (
      <TagFilters
        name="plans_actions"
        options={filters}
        className="pb-10"
        onChange={handleChangeFilter}
      />
    ) : (
      <></>
    )
  );
};

export default FiltersPlanAction;
