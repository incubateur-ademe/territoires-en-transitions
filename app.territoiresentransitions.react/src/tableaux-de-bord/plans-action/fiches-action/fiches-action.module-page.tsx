import { ModuleFicheActionsSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import {
  ModulePage,
  ModuleParentPage,
} from '@/app/tableaux-de-bord/modules/module.page';

import { usePlanActionsCount } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlanActionsCount';
import { FichesList } from '@/app/plans/fiches/list-all-fiches/components/fiches-list';
import {
  FormFilters,
  WithOrWithoutOptions,
} from '@/app/plans/fiches/list-all-fiches/filters/types';

type Props = {
  module: ModuleFicheActionsSelect;
  parentPage: ModuleParentPage;
};

const toWithOrWithout = (
  value: boolean | undefined
): WithOrWithoutOptions | undefined => {
  if (value === true) {
    return 'WITH';
  }
  if (value === false) {
    return 'WITHOUT';
  }
  return undefined;
};

const toFormFilters = (
  module: ModuleFicheActionsSelect['options']['filtre']
): FormFilters => {
  return {
    sort: 'titre',
    ficheIds: module.ficheIds,
    hasIndicateurLies: toWithOrWithout(module.hasIndicateurLies),
    hasNoteDeSuivi: toWithOrWithout(module.hasNoteDeSuivi),
    hasMesuresLiees: toWithOrWithout(module.hasMesuresLiees),
    hasDateDeFinPrevisionnelle: toWithOrWithout(
      module.hasDateDeFinPrevisionnelle
    ),
  };
};
export const FichesActionModulePage = ({ module, parentPage }: Props) => {
  const { count } = usePlanActionsCount();

  return (
    <ModulePage title={module.titre} parentPage={parentPage}>
      <FichesList
        filters={toFormFilters(module.options.filtre)}
        customFilterBadges={{
          planActions:
            module.options.filtre?.planActionIds?.length === count &&
            'Tous les plans',
        }}
        displayEditionMenu
        enableGroupedActions
      />
    </ModulePage>
  );
};
