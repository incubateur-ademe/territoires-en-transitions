'use client';

import SuiviPlansModule from '@/app/tableaux-de-bord/plans-action/suivi-plans/suivi-plans.module';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';

import { useFetchModules } from '../_data/use-fetch-modules';
import TdbPaFichesActionCountModule from './tdb-pa-fiches-action-count.module';

const Modules = () => {
  const { data: modules, isLoading } = useFetchModules();

  if (isLoading) {
    return (
      <div className="h-64 flex">
        <div className="m-auto">
          <SpinnerLoader className="w-8 h-8" />
        </div>
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

  return modules.map((module) => {
    if (module.type === 'fiche-action.count-by') {
      return <TdbPaFichesActionCountModule key={module.id} module={module} />;
    }
    if (
      module.type === 'plan-action.list' &&
      module.defaultKey === 'suivi-plan-actions'
    ) {
      return <SuiviPlansModule key={module.id} module={module} />;
    }
    return null;
  });
};

export default Modules;
