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
      <ActionsDontJeSuisPilote view={'personnel'} />
    </View>
  );
};

export default Personnel;
