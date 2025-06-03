import { ModuleFicheActionsSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import ModulePage, {
  ModuleParentPage,
} from '@/app/tableaux-de-bord/modules/module.page';

import { usePlanActionsCount } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlanActionsCount';
import FichesActionListe, {
  SortFicheActionSettings,
} from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/FichesActionListe';
import { Button } from '@/ui';

type Props = {
  module: ModuleFicheActionsSelect;
  parentPage: ModuleParentPage;
  onOpenFilterClick: () => void;
  sortSettings?: SortFicheActionSettings;
};

const FichesActionModulePage = ({
  module,
  parentPage,
  onOpenFilterClick,
  sortSettings,
}: Props) => {
  const { count } = usePlanActionsCount();

  return (
    <ModulePage title={module.titre} parentPage={parentPage}>
      <FichesActionListe
        filtres={module.options.filtre ?? {}}
        customFilterBadges={{
          planActions:
            module.options.filtre?.planActionIds?.length === count &&
            'Tous les plans',
        }}
        sortSettings={sortSettings}
        settings={() => (
          <Button
            variant="outlined"
            icon="equalizer-line"
            size="sm"
            onClick={onOpenFilterClick}
          >
            Filtrer
          </Button>
        )}
        displayEditionMenu
      />
    </ModulePage>
  );
};

export default FichesActionModulePage;
