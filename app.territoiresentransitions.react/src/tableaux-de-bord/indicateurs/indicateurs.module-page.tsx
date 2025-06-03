'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { ModuleIndicateursSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import IndicateursListe from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list';
import {
  defaultListOptions,
  useIndicateursListParams,
} from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/use-indicateurs-list-params';
import { usePlanActionsCount } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlanActionsCount';
import ModulePage, {
  ModuleParentPage,
} from '@/app/tableaux-de-bord/modules/module.page';
import { Button } from '@/ui';
import { isEqual } from 'es-toolkit';

type Props = {
  module: ModuleIndicateursSelect;
  parentPage: ModuleParentPage;
  onOpenFilterClick: () => void;
};

const IndicateursModulePage = ({
  module,
  parentPage,
  onOpenFilterClick: onFilterClick,
}: Props) => {
  const pathName = usePathname();

  const { count } = usePlanActionsCount();

  const { searchParams, setSearchParams } = useIndicateursListParams(
    pathName,
    module.options.filtre || {},
    defaultListOptions
  );

  // après une modification depuis la modale les paramètres du module sont
  // enregistrés et rechargés : il faut alors remettre à jour les paramètres
  // dans l'url
  const syncRequired =
    module.options.filtre && !isEqual(module.options.filtre, searchParams);
  useEffect(() => {
    if (syncRequired) {
      setSearchParams({ ...defaultListOptions, ...module.options.filtre });
    }
  }, [syncRequired, module.options.filtre, setSearchParams]);

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
        renderSettings={() => (
          <Button
            variant="outlined"
            icon="equalizer-line"
            size="sm"
            onClick={onFilterClick}
          >
            Filtrer
          </Button>
        )}
      />
    </ModulePage>
  );
};

export default IndicateursModulePage;
