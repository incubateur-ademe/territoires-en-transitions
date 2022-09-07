import {Route} from 'react-router-dom';
import MonCompte from 'app/pages/Profil/MonCompte/MonCompte';
import {monComptePath, profilPath} from 'app/paths';

export const ProfilRoutes = () => {
  return (
    <>
      <Route exact path={[profilPath, monComptePath]}>
        <MonCompte />
      </Route>
      {/* <Route path={mesCollectivitesPath}>
        <div>Hello</div>
      </Route> */}
    </>
  );
};
