'use client';

import { useEffect } from 'react';

import { ModuleIndicateursSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import IndicateursListe from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list';
import { useIndicateursListParams } from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/use-indicateurs-list-params';
import { usePlanActionsCount } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlanActionsCount';
import {
  ModulePage,
  ModuleParentPage,
} from '@/app/tableaux-de-bord/modules/module.page';
import { Button, Event, useEventTracker } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { isEqual } from 'es-toolkit';

type Props = {
  module: ModuleIndicateursSelect;
  parentPage: ModuleParentPage;
  filtersModal: (openState: OpenState) => React.ReactNode;
};

export const IndicateursModulePage = ({
  module,
  parentPage,
  filtersModal,
}: Props) => {
  const { count } = usePlanActionsCount();

  const { searchParams, setSearchParams } = useIndicateursListParams(
    module.options.filtre || {}
  );

  // après une modification depuis la modale les paramètres du module sont
  // enregistrés et rechargés : il faut alors remettre à jour les paramètres
  // dans l'url
  const syncRequired =
    module.options.filtre && !isEqual(module.options.filtre, searchParams);
  useEffect(() => {
    if (syncRequired) {
      setSearchParams(module.options.filtre);
    }
  }, [syncRequired, module.options.filtre, setSearchParams]);

  const tracker = useEventTracker();

  return (
    <ModulePage title={module.titre} parentPage={parentPage}>
      <IndicateursListe
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        customFilterBadges={{
          planActions:
            module.options.filtre?.planActionIds?.length === count &&
            'Tous les plans',
        }}
        renderSettings={(openState) => (
          <>
            <Button
              variant="outlined"
              icon="equalizer-line"
              size="sm"
              onClick={() => {
                openState.setIsOpen(true);
                tracker(Event.tdb.updateFiltresIndicateurs);
              }}
            >
              Filtrer
            </Button>
            {filtersModal(openState)}
          </>
        )}
      />
    </ModulePage>
  );
};
