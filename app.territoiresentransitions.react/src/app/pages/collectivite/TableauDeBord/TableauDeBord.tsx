import { Redirect, Route } from 'react-router-dom';

import { usePlansActionsListe } from 'app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import ModulePageRoutes from '@tet/app/pages/collectivite/TableauDeBord/ModulePageRoutes';
import {
  collectiviteTDBBasePath,
  collectiviteTDBCollectivitePath,
  collectiviteTDBModulePath,
  collectiviteTDBPersonnelPath,
  makeTableauBordUrl,
} from 'app/paths';
import { useCollectiviteId } from 'core-logic/hooks/params';
import Personnel from './Personnel/Personnel';
import View from './components/View';
import TdbVide from './components/TdbVide';
import Collectivite from 'app/pages/collectivite/TableauDeBord/Collectivite/Collectivite';

/** Tableau de bord plans d'action */
const TableauDeBord = () => {
  const collectivite_id = useCollectiviteId();

  const { data: plansActions } = usePlansActionsListe({});

  const isEmpty = plansActions?.plans.length === 0;

  return (
    <div className="grow bg-grey-2 -mb-8 py-12">
      <div className="fr-container">
        {/** Si l'on vient de la navigation principale de l'app,
         * alors on redirige vers la vue par défaut enregistrée par l'utilisateur */}
        <Route exact path={collectiviteTDBBasePath}>
          <Redirect
            to={makeTableauBordUrl({
              collectiviteId: collectivite_id!,
              view: 'personnel',
            })}
          />
        </Route>
        {/** Tableau de bord personnel */}
        <Route exact path={collectiviteTDBPersonnelPath}>
          <View
            view={'personnel'}
            title="Mon tableau de bord"
            description="Ce tableau de bord est personnel afin de suivre mes plans d'action."
          >
            {isEmpty ? <TdbVide /> : <Personnel />}
          </View>
        </Route>
        {/** Tableau de bord de la collectivité */}
        <Route exact path={collectiviteTDBCollectivitePath}>
          <View
            view={'collectivite'}
            title="Le tableau de bord collaboratif de la collectivité"
            description="Ce tableau de bord est destiné à l'ensemble des personnes de la collectivité et peut être modifié par les administrateurs."
          >
            {isEmpty ? <TdbVide /> : <Collectivite />}
          </View>
        </Route>
        {/** Modules */}
        <Route path={collectiviteTDBModulePath}>
          <ModulePageRoutes />
        </Route>
      </div>
    </div>
  );
};

export default TableauDeBord;
