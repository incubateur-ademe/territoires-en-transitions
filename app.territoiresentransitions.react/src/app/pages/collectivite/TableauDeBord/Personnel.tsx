import {
  TDBFichesActionsModuleTypes,
  tdbPersonnelModules,
} from 'app/pages/collectivite/TableauDeBord/Module/data';
import View from './View';
import ModuleFichesActions from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/ModuleFichesActions';

/** Vue personnelle du tableau de bord plans d'action */
const Personnel = () => {
  return (
    <View
      view={'personnel'}
      title="Mon tableau de bord personnalisé"
      description="Ce tableau de bord est personnel afin de suivre mes plans d’action."
      settingButton={undefined}
    >
      {tdbPersonnelModules.map(module => {
        if (module.slug === 'actions-dont-je-suis-pilote') {
          return (
            <ModuleFichesActions
              key={module.slug}
              view={'personnel'}
              module={module as TDBFichesActionsModuleTypes}
            />
          );
        }
        return <div>Ce module n'existe pas</div>;
      })}
    </View>
  );
};

export default Personnel;
