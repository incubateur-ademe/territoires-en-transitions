import {Route, useParams} from 'react-router-dom';

import View from './View';

import {
  TDBViewParam,
  collectiviteTDBCollectivitePath,
  collectiviteTDBPersonnelPath,
} from 'app/paths';

const TableauDeBord = () => {
  const viewParam: {tdbView: TDBViewParam} = useParams();

  return (
    <div className="bg-grey-2 -mb-8 py-12">
      <div className="fr-container">
        <Route path={collectiviteTDBPersonnelPath}>
          <View
            view={viewParam.tdbView}
            title="Mon tableau de bord personnalisé"
            description="Ce tableau de bord est personnel afin de suivre mes plans d’action."
            settingButton={undefined}
            children={undefined}
          />
        </Route>
        <Route path={collectiviteTDBCollectivitePath}>
          <View
            view={viewParam.tdbView}
            title="Le tableau de bord collaboratif de ma collectivité."
            description="Ce tableau de bord est destiné à l'ensemble des personnes de ma collectivité et peut être modifié par les administrateurs."
            settingButton={undefined}
            children={undefined}
          />
        </Route>
      </div>
    </div>
  );
};

export default TableauDeBord;
