import { Button, Event, useEventTracker } from '@/ui';

import {
  ModuleIndicateursSelect,
  PersonalDefaultModuleKeys,
} from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import IndicateursListe from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list';
import {
  defaultListOptions,
  useIndicateursListParams,
} from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/use-indicateurs-list-params';
import { usePlanActionsCount } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlanActionsCount';
import ModulePage from '@/app/app/pages/collectivite/TableauDeBord/components/ModulePage';
import ModalIndicateursSuiviPlan from '@/app/app/pages/collectivite/TableauDeBord/Personnel/ModuleIndicateurs/ModalIndicateursSuiviPlan';
import {
  getQueryKey,
  usePersonalModuleFetch,
} from '@/app/app/pages/collectivite/TableauDeBord/Personnel/usePersonalModuleFetch';
import { TDBViewParam } from '@/app/app/paths';
import { isEqual } from 'es-toolkit';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

type Props = {
  view: TDBViewParam;
  defaultModuleKey: PersonalDefaultModuleKeys;
};

const ModuleIndicateursPage = ({ view, defaultModuleKey }: Props) => {
  const { data: module, isLoading: isModuleLoading } =
    usePersonalModuleFetch(defaultModuleKey);

  const filtre = module?.options.filtre;

  const { count } = usePlanActionsCount();

  const trackEvent = useEventTracker();

  const pathName = usePathname();

  const { searchParams, setSearchParams } = useIndicateursListParams(
    pathName,
    filtre || {},
    defaultListOptions
  );

  // après une modification depuis la modale les paramètres du module sont
  // enregistrés et rechargés : il faut alors remettre à jour les paramètres
  // dans l'url
  const syncRequired = filtre && !isEqual(filtre, searchParams);
  useEffect(() => {
    if (syncRequired) {
      setSearchParams({ ...defaultListOptions, ...filtre });
    }
  }, [syncRequired, filtre, setSearchParams]);

  if (isModuleLoading || !module) {
    return null;
  }

  return (
    <ModulePage view={view} title={module.titre}>
      <IndicateursListe
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        customFilterBadges={{
          planActions:
            filtre?.planActionIds?.length === count && 'Tous les plans',
        }}
        renderSettings={(openState) => (
          <>
            <Button
              variant="outlined"
              icon="equalizer-line"
              size="sm"
              onClick={() => {
                openState.setIsOpen(true);
                trackEvent(Event.tdb.updateFiltresIndicateurs);
              }}
            >
              Filtrer
            </Button>
            {openState.isOpen && (
              <ModalIndicateursSuiviPlan
                openState={openState}
                module={module as ModuleIndicateursSelect}
                keysToInvalidate={[getQueryKey(defaultModuleKey)]}
              />
            )}
          </>
        )}
      />
    </ModulePage>
  );
};

export default ModuleIndicateursPage;
