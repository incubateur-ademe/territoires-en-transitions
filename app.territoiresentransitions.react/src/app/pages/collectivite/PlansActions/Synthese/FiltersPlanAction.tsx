import TagFilters from 'ui/shared/filters/TagFilters';
import {useFichesNonClasseesListe} from '../FicheAction/data/useFichesNonClasseesListe';
import {usePlansActionsListe} from '../PlanAction/data/usePlansActionsListe';
import {generateTitle} from '../FicheAction/data/utils';
import {ITEM_ALL} from 'ui/shared/filters/commons';
import {useEffect} from 'react';

export type PlanActionFilter = {id: number | 'nc' | 'tous'; name: string};
export const filtreToutesLesFiches: PlanActionFilter = {
  id: ITEM_ALL,
  name: 'Toutes les fiches',
};
export const filtreFichesNonClassees: PlanActionFilter = {
  id: 'nc',
  name: 'Fiches non classées',
};

/**
 * Filtres tags par plan d'action
 *
 * @param collectiviteId - (number) id de la collectivité affichée
 * @param onChangePlan - action lancée lors du changement de plan d'action
 * @param onChangeWithoutPlan - action lancée lors du toggle avec / sans plan d'action
 */

type FiltersPlanActionProps = {
  collectiviteId: number;
  initialPlan?: string;
  getInitialPlan?: (plan: PlanActionFilter) => void;
  onChangePlan: ({id, name}: PlanActionFilter) => void;
};

const FiltersPlanAction = ({
  collectiviteId,
  initialPlan,
  getInitialPlan,
  onChangePlan,
}: FiltersPlanActionProps): JSX.Element => {
  const {data: fichesNonClassees} = useFichesNonClasseesListe(collectiviteId);
  const { data: plansActions } = usePlansActionsListe(collectiviteId);

  // Construction de la liste de filtres par plan d'action
  const filters = [
    {
      value: filtreToutesLesFiches.id?.toString(),
      label: filtreToutesLesFiches.name,
    },
  ];

  if (plansActions?.plans && plansActions.plans.length) {
    filters.push(
      ...plansActions.plans.map(plan => ({
        value: plan.id.toString(),
        label: generateTitle(plan.nom),
      }))
    );
  }

  if (fichesNonClassees && fichesNonClassees.length > 0) {
    filters.push({
      value: filtreFichesNonClassees.id.toString(),
      label: filtreFichesNonClassees.name,
    });
  }

  const generatePlan = (value: string): PlanActionFilter => {
    // Toutes les fiches
    if (value === ITEM_ALL) {
      return filtreToutesLesFiches;
      // Fiches non classées
    } else if (value === 'nc') {
      return filtreFichesNonClassees;
      // Les plans d'action
    } else {
      return {
        id: parseInt(value),
        name: filters.filter(f => f.value === value)[0]?.label ?? '',
      };
    }
  };

  useEffect(() => {
    initialPlan && getInitialPlan && getInitialPlan(generatePlan(initialPlan));
  }, []);

  return (
    // Filtres affichés si plus d'un plan d'action défini
    filters.length > 2 ? (
      <TagFilters
        defaultOption={initialPlan}
        options={filters}
        onChange={value => onChangePlan(generatePlan(value))}
      />
    ) : (
      <></>
    )
  );
};

export default FiltersPlanAction;
