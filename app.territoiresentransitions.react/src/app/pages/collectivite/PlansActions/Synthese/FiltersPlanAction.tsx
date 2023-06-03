import TagFilters from 'ui/shared/filters/TagFilters';
import {useFichesNonClasseesListe} from '../FicheAction/data/useFichesNonClasseesListe';
import {usePlansActionsListe} from '../PlanAction/data/usePlansActionsListe';
import {generateTitle} from '../FicheAction/data/utils';

/**
 * Filtres tags par plan d'action
 *
 * @param collectiviteId - (number) id de la collectivité affichée
 * @param onChangePlan - action lancée lors du changement de plan d'action
 * @param onChangeWithoutPlan - action lancée lors du toggle avec / sans plan d'action
 */

type FiltersPlanActionProps = {
  collectiviteId: number;
  onChangePlan: ({id, name}: {id: number | null; name: string}) => void;
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
  const filters = [{value: 'default', label: 'Toutes les fiches'}];

  if (plansActions?.plans && plansActions.plans.length) {
    filters.push(
      ...plansActions.plans.map(plan => ({
        value: plan.id.toString(),
        label: generateTitle(plan.nom),
      }))
    );
  }

  if (fichesNonClassees?.fiches && fichesNonClassees.fiches.length > 0) {
    filters.push({
      value: 'nc',
      label: 'Fiches non classées',
    });
  }

  // Mise à jour des filtres sélectionnés
  const handleChangeFilter = (id: string) => {
    if (id === 'default') {
      onChangePlan({id: null, name: 'Toutes les fiches'});
      onChangeWithoutPlan(null);
    } else if (id === 'nc') {
      onChangePlan({id: null, name: 'Fiches non classées'});
      onChangeWithoutPlan(true);
    } else {
      onChangePlan({
        id: parseInt(id),
        name: filters.filter(f => f.value === id)[0].label,
      });
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
