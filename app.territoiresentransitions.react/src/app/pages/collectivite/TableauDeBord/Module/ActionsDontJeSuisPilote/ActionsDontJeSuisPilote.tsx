import {TDBViewParam} from 'app/paths';
import Module from '../Module';
import {actionsDontJeSuisPilote} from 'app/pages/collectivite/TableauDeBord/Module/data';

type Props = {
  view: TDBViewParam;
};

/** Module pour la page tableau de bord plans d'action */
const ActionsDontJeSuisPilote = ({view}: Props) => {
  return <Module {...actionsDontJeSuisPilote} view={view} />;
};

export default ActionsDontJeSuisPilote;
