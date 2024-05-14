import {TDBViewParam} from 'app/paths';

import ModulePage from '../ModulePage';
import {actionsDontJeSuisPilote} from 'app/pages/collectivite/TableauDeBord/Module/data';

type Props = {
  view: TDBViewParam;
};

/** Page d'un module du tableau de bord plans d'action */
const ModuleFichesActionsPage = ({view}: Props) => {
  /**
   * TODO:
   * - [ ] Récupérer et afficher la liste des actions
   */

  return (
    <ModulePage view={view} title={actionsDontJeSuisPilote.title}>
      Les actions filtrées
    </ModulePage>
  );
};

export default ModuleFichesActionsPage;
