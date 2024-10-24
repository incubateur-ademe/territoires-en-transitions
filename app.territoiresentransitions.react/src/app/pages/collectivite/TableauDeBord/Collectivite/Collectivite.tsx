import SpinnerLoader from 'ui/shared/SpinnerLoader';
import ModuleAvancementFichesAction from '@tet/app/pages/collectivite/TableauDeBord/Collectivite/ModuleAvancementFichesAction/ModuleAvancementFichesAction';
import { useCollectiviteModulesFetch } from '@tet/app/pages/collectivite/TableauDeBord/Collectivite/useCollectiviteModulesFetch';
import ModuleAvancementPlansAction from '@tet/app/pages/collectivite/TableauDeBord/Collectivite/ModuleSuiviPlansAction/ModuleSuiviPlansAction';

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
    if (module.type === 'fiche-action.count-by-status') {
      if (module.slug === 'fiche-actions-par-statut') {
        return (
          <ModuleAvancementFichesAction
            key={module.slug}
            view={'collectivite'}
            module={module}
          />
        );
      }
    }
    if (module.type === 'plan-action.list') {
      if (module.slug === 'suivi-plan-actions') {
        return (
          <ModuleAvancementPlansAction
            key={module.slug}
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
