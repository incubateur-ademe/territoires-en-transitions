import { PersonalDefaultModuleKeys } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
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

  const orderedModules: PersonalDefaultModuleKeys[] = [
    'actions-dont-je-suis-pilote',
    'indicateurs-de-suivi-de-mes-plans',
    'actions-recemment-modifiees',
  ];

  return orderedModules.map((key) => {
    const mod = modules.find((m) => m.defaultKey === key);

    if (!mod) {
      return null;
    }

    if (mod.type === 'indicateur.list') {
      return (
        <ModuleIndicateurs
          key={mod.defaultKey}
          view={'personnel'}
          module={mod}
        />
      );
    }
    if (mod.type === 'fiche_action.list') {
      return (
        <ModuleFichesActions
          key={mod.defaultKey}
          view={'personnel'}
          module={mod}
        />
      );
    }
    return null;
  });
};

export default Personnel;
