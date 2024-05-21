import {
  TDBModuleFichesActions,
  TDBModuleIndicateurs,
  TDBModuleSlug,
  TDBUtilisateurModulesTypes,
} from 'app/pages/collectivite/TableauDeBord/Module/data';
import View from './View';
import ModuleFichesActions from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/ModuleFichesActions';
import TdbVide from './TdbVide';
import ModuleIndicateurs from 'app/pages/collectivite/TableauDeBord/Module/ModuleIndicateurs/ModuleIndicateurs';

type Props = {
  isEmpty: boolean;
  modules: TDBUtilisateurModulesTypes;
  plan_ids?: number[];
};

/** Vue personnelle du tableau de bord plans d'action */
const Personnel = ({isEmpty, modules, plan_ids}: Props) => {
  return (
    <View
      view={'personnel'}
      title="Mon tableau de bord personnalisé"
      description="Ce tableau de bord est personnel afin de suivre mes plans d’action."
    >
      {isEmpty ? (
        <TdbVide />
      ) : (
        <div className="flex flex-col gap-10">
          {modules.map(module => {
            if (module.slug === TDBModuleSlug.ACTIONS_DONT_JE_SUIS_LE_PILOTE) {
              return (
                <ModuleFichesActions
                  key={module.slug}
                  view={'personnel'}
                  module={module as TDBModuleFichesActions}
                />
              );
            }
            if (
              module.slug === TDBModuleSlug.INDICATEURS_DE_SUIVI_DE_MES_PLANS
            ) {
              return (
                <ModuleIndicateurs
                  key={module.slug}
                  view={'personnel'}
                  module={module as TDBModuleIndicateurs}
                  plan_ids={plan_ids}
                />
              );
            }
            return null;
          })}
        </div>
      )}
    </View>
  );
};

export default Personnel;
