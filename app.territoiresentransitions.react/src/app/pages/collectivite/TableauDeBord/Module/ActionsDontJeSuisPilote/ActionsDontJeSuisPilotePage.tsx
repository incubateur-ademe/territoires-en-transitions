import {TDBViewParam} from 'app/paths';

import ModulePage from '../ModulePage';
import {actionsDontJeSuisPilote} from 'app/pages/collectivite/TableauDeBord/Module/data';

type Props = {
  view: TDBViewParam;
};

/** Page d'un module du tableau de bord plans d'action */
const ActionsDontJeSuisPilotePage = ({view}: Props) => {
  return <ModulePage view={view} module={actionsDontJeSuisPilote} />;
};

export default ActionsDontJeSuisPilotePage;
