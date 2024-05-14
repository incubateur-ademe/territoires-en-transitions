import {
  TDBFichesActionsModuleTypes,
  TDBUtilisateurModulesTypes,
} from 'app/pages/collectivite/TableauDeBord/Module/data';
import View from './View';
import ModuleFichesActions from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/ModuleFichesActions';

type Props = {
  modules: TDBUtilisateurModulesTypes;
};

/** Vue personnelle du tableau de bord plans d'action */
const Personnel = ({modules}: Props) => {
  return (
    <View
      view={'personnel'}
      title="Mon tableau de bord personnalisé"
      description="Ce tableau de bord est personnel afin de suivre mes plans d’action."
    >
      {modules.map(module => {
        if (module.slug === 'actions-dont-je-suis-pilote') {
          return (
            <ModuleFichesActions
              key={module.slug}
              view={'personnel'}
              module={module as TDBFichesActionsModuleTypes}
            />
          );
        }
        return null;
      })}
    </View>
  );
};

export default Personnel;
