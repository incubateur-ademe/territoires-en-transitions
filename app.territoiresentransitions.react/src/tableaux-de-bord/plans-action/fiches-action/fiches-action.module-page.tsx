import { ModuleFicheActionsSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import {
  ModulePage,
  ModuleParentPage,
} from '@/app/tableaux-de-bord/modules/module.page';

import { usePlanActionsCount } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlanActionsCount';
import { FichesList } from '@/app/plans/fiches/show-all-fiches/components/fiches-list';

type Props = {
  module: ModuleFicheActionsSelect;
  parentPage: ModuleParentPage;
};

export const FichesActionModulePage = ({ module, parentPage }: Props) => {
  const { count } = usePlanActionsCount();

  return (
    <ModulePage title={module.titre} parentPage={parentPage}>
      <FichesList
        filters={module.options.filtre ?? {}}
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
