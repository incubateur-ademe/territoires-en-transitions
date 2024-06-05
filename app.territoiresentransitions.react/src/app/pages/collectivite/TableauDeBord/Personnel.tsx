import ModuleFichesActions from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/ModuleFichesActions';
import {ReactNode} from 'react';
import {defaultSlugsSchema} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/domain/module.schema';
import {useModulesFetch} from './Module/useModulesFetch';
import TdbVide from './TdbVide';
import View from './View';

const wrapper = (children: ReactNode) => (
  <View
    view={'personnel'}
    title="Mon tableau de bord personnalisé"
    description="Ce tableau de bord est personnel afin de suivre mes plans d'action."
  >
    {children}
  </View>
);

type Props = {
  // modules: TDBUtilisateurModulesTypes;
  plan_ids?: number[];
};

/** Vue personnelle du tableau de bord plans d'action */
const Personnel = ({plan_ids}: Props) => {
  // modules: TDBUtilisateurModulesTypes;

  const {data: modules, isLoading} = useModulesFetch();

  if (isLoading) {
    return wrapper('Chargement…');
  }

  const isEmpty = !modules || modules?.length === 0;
  if (isEmpty) {
    return wrapper(<TdbVide />);
  }

  return (
    <div className="flex flex-col gap-10">
      {modules.map(module => {
        if (
          module.slug ===
            defaultSlugsSchema.enum['actions-dont-je-suis-pilote'] ||
          module.slug === defaultSlugsSchema.enum['actions-recemment-modifiees']
        ) {
          return (
            <ModuleFichesActions
              key={module.slug}
              view={'personnel'}
              module={module}
            />
          );
        }
        // if (
        //   module.slug ===
        //   defaultSlugsSchema.enum['indicateurs-de-suivi-de-mes-plans']
        // ) {
        //   return (
        //     <ModuleIndicateurs
        //       key={module.slug}
        //       view={'personnel'}
        //       module={module as TDBModuleIndicateurs}
        //       plan_ids={plan_ids}
        //     />
        //   );
        // }
        return null;
      })}
    </div>
  );
};

export default Personnel;
