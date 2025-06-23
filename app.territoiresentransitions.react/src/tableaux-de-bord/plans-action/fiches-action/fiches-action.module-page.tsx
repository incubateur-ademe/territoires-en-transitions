import { ModuleFicheActionsSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import {
  ModulePage,
  ModuleParentPage,
} from '@/app/tableaux-de-bord/modules/module.page';

import { usePlanActionsCount } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlanActionsCount';
import FichesActionListe, {
  SortFicheActionSettings,
} from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/FichesActionListe';
import { Button, Event, useEventTracker } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import React from 'react';

type Props = {
  module: ModuleFicheActionsSelect;
  parentPage: ModuleParentPage;
  filtersModal: (openState: OpenState) => React.ReactNode;
  sortSettings?: SortFicheActionSettings;
};

export const FichesActionModulePage = ({
  module,
  parentPage,
  filtersModal,
  sortSettings,
}: Props) => {
  const { count } = usePlanActionsCount();

  const tracker = useEventTracker();

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
        settings={(openState) => (
          <>
            <Button
              variant="outlined"
              icon="equalizer-line"
              size="sm"
              onClick={() => {
                openState.setIsOpen(true);
                tracker(
                  module.defaultKey === 'actions-dont-je-suis-pilote'
                    ? Event.tdb.updateFiltresActionsPilotes
                    : Event.tdb.updateFiltresActionsModifiees
                );
              }}
            >
              Filtrer
            </Button>
            {filtersModal(openState)}
          </>
        )}
        displayEditionMenu
      />
    </ModulePage>
  );
};
