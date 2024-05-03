import {Route, useParams} from 'react-router-dom';

import {
  TDBViewParam,
  collectiviteTDBCollectivitePath,
  collectiviteTDBModulePath,
  collectiviteTDBPersonnelPath,
} from 'app/paths';
import View from './View';
import Personnel from './Personnel';
import Modules from 'app/pages/collectivite/TableauDeBord/Module/Modules';

/** Tableau de bord plans d'action */
const TableauDeBord = () => {
  const params: {tdbView: TDBViewParam} = useParams();
  const view = params.tdbView;

  return (
    <div className="bg-grey-2 -mb-8 py-12">
      <div className="fr-container">
        {/** Tableau de bord personnel */}
        <Route exact path={collectiviteTDBPersonnelPath}>
          <Personnel />
        </Route>
        {/** Tableau de bord de la collectivité */}
        <Route exact path={collectiviteTDBCollectivitePath}>
          <View
            view={view}
            title="Le tableau de bord collaboratif de ma collectivité."
            description="Ce tableau de bord est destiné à l'ensemble des personnes de ma collectivité et peut être modifié par les administrateurs."
            settingButton={undefined}
            children={undefined}
          />
        </Route>
        {/** Modules */}
        <Route path={collectiviteTDBModulePath}>
          <Modules view={view} />
        </Route>
      </div>
    </div>
  );
};

export default TableauDeBord;
