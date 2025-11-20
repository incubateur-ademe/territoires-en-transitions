'use client';

import { SuiviPlansModule } from '@/app/tableaux-de-bord/plans-action/suivi-plans/suivi-plans.module';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ModulePlanActionList } from '@tet/domain/collectivites/tableau-de-bord';
import { useFetchModules } from '../_hooks/use-fetch-modules';
import TdbPaFichesActionCountModule from './tdb-pa-fiches-action-count.module';

const Modules = () => {
  const { data: modules, isLoading } = useFetchModules();

  if (isLoading) {
    return (
      <div className="h-64 flex">
        <SpinnerLoader className="m-auto" />
      </div>
    );
  }

  const isEmpty = !modules || modules?.length === 0;

  if (isEmpty) {
    return (
      <div className="h-64 flex items-center justify-center text-error-1">
        Une erreur est survenue
      </div>
    );
  }

  const suiviPlanModule = modules.find(
    (module) =>
      module.type === 'plan-action.list' &&
      module.defaultKey === 'suivi-plan-actions'
  ) as ModulePlanActionList;

  const countByModules = modules.filter(
    (module) => module.type === 'fiche-action.count-by'
  );

  return (
    <div className="flex flex-col gap-10">
      {suiviPlanModule && <SuiviPlansModule module={suiviPlanModule} />}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {countByModules.map((module) => (
          <TdbPaFichesActionCountModule key={module.id} module={module} />
        ))}
      </div>
    </div>
  );
};

export default Modules;
