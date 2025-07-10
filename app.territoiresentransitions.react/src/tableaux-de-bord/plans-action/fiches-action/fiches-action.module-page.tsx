import { ModuleFicheActionsSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import {
  ModulePage,
  ModuleParentPage,
} from '@/app/tableaux-de-bord/modules/module.page';

import { usePlanActionsCount } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlanActionsCount';
import { FichesList } from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/fiches.list';
import { SortFicheActionSettings } from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/hooks/useFicheActionSorting';

type Props = {
  module: ModuleFicheActionsSelect;
  parentPage: ModuleParentPage;
  sortSettings?: SortFicheActionSettings;
};

export const FichesActionModulePage = ({
  module,
  parentPage,
  sortSettings,
}: Props) => {
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
        sortSettings={sortSettings}
        displayEditionMenu
        enableGroupedActions
      />
    </ModulePage>
  );
};
