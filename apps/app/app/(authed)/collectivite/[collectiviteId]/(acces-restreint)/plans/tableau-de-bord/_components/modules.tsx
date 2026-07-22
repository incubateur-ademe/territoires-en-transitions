'use client';

import { appLabels } from '@/app/labels/catalog';
import { useFetchModules } from '@/app/tableaux-de-bord/plans-action/data/use-fetch-modules';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
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
        {appLabels.uneErreurEstSurvenue}
      </div>
    );
  }

  const countByModules = modules.filter(
    (module) => module.type === 'fiche-action.count-by'
  );

  return (
    <div className="flex flex-col gap-10 pt-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {countByModules.map((module) => (
          <TdbPaFichesActionCountModule key={module.id} module={module} />
        ))}
      </div>
    </div>
  );
};

export default Modules;
