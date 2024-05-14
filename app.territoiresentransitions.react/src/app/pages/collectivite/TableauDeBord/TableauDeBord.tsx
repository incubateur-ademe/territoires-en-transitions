import {Redirect, Route} from 'react-router-dom';

import {
  collectiviteTDBBasePath,
  collectiviteTDBCollectivitePath,
  collectiviteTDBModulePath,
  collectiviteTDBPersonnelPath,
  makeTableauBordUrl,
} from 'app/paths';
import View from './View';
import Personnel from './Personnel';
import Modules from 'app/pages/collectivite/TableauDeBord/Module/Modules';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {tdbUtilisateur} from 'app/pages/collectivite/TableauDeBord/Module/data';

/** Tableau de bord plans d'action */
const TableauDeBord = () => {
  const collectivite_id = useCollectiviteId();

  return (
    <div className="bg-grey-2 -mb-8 py-12">
      <div className="fr-container">
        {/** Si l'on vient de la navigation principale de l'app,
         * alors on redirige vers la vue par défaut enregistrée par l'utilisateur */}
        <Route exact path={collectiviteTDBBasePath}>
          <Redirect
            to={makeTableauBordUrl({
              collectiviteId: collectivite_id!,
              view: tdbUtilisateur.defaultView,
            })}
          />
        </Route>
        {/** Tableau de bord personnel */}
        <Route exact path={collectiviteTDBPersonnelPath}>
          <Personnel modules={tdbUtilisateur.tdbPersonnelModules} />
        </Route>
        {/** Tableau de bord de la collectivité */}
        <Route exact path={collectiviteTDBCollectivitePath}>
          <View
            view={'collectivite'}
            title="Le tableau de bord collaboratif de ma collectivité."
            description="Ce tableau de bord est destiné à l'ensemble des personnes de ma collectivité et peut être modifié par les administrateurs."
            children={undefined}
          />
        </Route>
        {/** Modules */}
        <Route path={collectiviteTDBModulePath}>
          <Modules />
        </Route>
      </div>
    </div>
  );
};

export default TableauDeBord;
