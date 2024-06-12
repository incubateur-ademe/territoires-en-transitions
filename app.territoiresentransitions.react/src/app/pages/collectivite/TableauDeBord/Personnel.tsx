import ModuleFichesActions from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/ModuleFichesActions';
import {defaultSlugsSchema} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/domain/module.schema';
import {useModulesFetch} from './Module/useModulesFetch';
import ModuleIndicateurs from './Module/ModuleIndicateurs/ModuleIndicateurs';
import SpinnerLoader from 'ui/shared/SpinnerLoader';

type Props = {
  planIds?: number[];
};

/** Vue personnelle du tableau de bord plans d'action */
const Personnel = ({planIds}: Props) => {
  const {data: modules, isLoading} = useModulesFetch();

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

  return (
    <div className="flex flex-col gap-10">
      {modules.map(module => {
        if (
          module.type === 'indicateur.list' &&
          module.slug ===
            defaultSlugsSchema.enum['indicateurs-de-suivi-de-mes-plans']
        ) {
          return (
            <ModuleIndicateurs
              key={module.slug}
              view={'personnel'}
              module={module}
              planIds={planIds}
            />
          );
        }
        if (
          module.type === 'fiche_action.list' &&
          (module.slug ===
            defaultSlugsSchema.enum['actions-dont-je-suis-pilote'] ||
            module.slug ===
              defaultSlugsSchema.enum['actions-recemment-modifiees'])
        ) {
          return (
            <ModuleFichesActions
              key={module.slug}
              view={'personnel'}
              module={module}
            />
          );
        }
        return null;
      })}
    </div>
  );
};

export default Personnel;
