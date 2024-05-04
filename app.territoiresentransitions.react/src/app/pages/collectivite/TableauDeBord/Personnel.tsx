import {tdbPersonnelModules} from 'app/pages/collectivite/TableauDeBord/Module/data';
import View from './View';
import ActionsDontJeSuisPilote from 'app/pages/collectivite/TableauDeBord/Module/ActionsDontJeSuisPilote/ActionsDontJeSuisPilote';

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
            <ActionsDontJeSuisPilote
              key={module.slug}
              view={'personnel'}
              module={module}
            />
          );
        }
        return <div>Ce module n'existe pas</div>;
      })}
    </View>
  );
};

export default Personnel;
