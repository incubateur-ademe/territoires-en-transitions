import ModuleFichesActionCountBy from '@/app/app/pages/collectivite/TableauDeBord/Collectivite/ModuleFichesActionCountBy/ModuleFichesActionCountBy';
import ModuleAvancementPlansAction from '@/app/app/pages/collectivite/TableauDeBord/Collectivite/ModuleSuiviPlansAction/ModuleSuiviPlansAction';
import { useCollectiviteModulesFetch } from '@/app/app/pages/collectivite/TableauDeBord/Collectivite/useCollectiviteModulesFetch';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';

/** Vue Collectivité du tableau de bord plans d'action */
const Collectivite = () => {
  const { data: modules, isLoading } = useCollectiviteModulesFetch();

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
      return (
        <ModuleFichesActionCountBy
          key={module.id}
          view={'collectivite'}
          module={module}
        />
      );
    }
    if (module.type === 'plan-action.list') {
      if (module.defaultKey === 'suivi-plan-actions') {
        return (
          <ModuleAvancementPlansAction
            key={module.id}
            view={'collectivite'}
            module={module}
          />
        );
      }
    }
    return null;
  });
};

export default Collectivite;
