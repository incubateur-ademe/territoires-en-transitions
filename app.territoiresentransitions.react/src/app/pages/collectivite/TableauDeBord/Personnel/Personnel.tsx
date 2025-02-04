import ModuleFichesActions from '@/app/app/pages/collectivite/TableauDeBord/Personnel/ModuleFichesActions/ModuleFichesActions';
import ModuleIndicateurs from '@/app/app/pages/collectivite/TableauDeBord/Personnel/ModuleIndicateurs/ModuleIndicateurs';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { usePersonalModulesFetch } from './usePersonalModulesFetch';

/** Vue personnelle du tableau de bord plans d'action */
const Personnel = () => {
  const { data: modules, isLoading } = usePersonalModulesFetch();

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
    if (module.type === 'indicateur.list') {
      return (
        <ModuleIndicateurs
          key={module.defaultKey}
          view={'personnel'}
          module={module}
        />
      );
    }
    if (module.type === 'fiche_action.list') {
      return (
        <ModuleFichesActions
          key={module.defaultKey}
          view={'personnel'}
          module={module}
        />
      );
    }
    return null;
  });
};

export default Personnel;
