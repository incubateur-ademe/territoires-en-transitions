import {Route} from 'react-router-dom';
import MonCompte from 'app/pages/Profil/MonCompte/MonCompte';
import RejoindreUneCollectivite from 'app/pages/Profil/RejoindreUneCollectivite/RejoindreUneCollectivite';
import {
  monComptePath,
  profilPath,
  rejoindreUneCollectivitePath,
} from 'app/paths';

export const ProfilRoutes = () => {
  return (
    <>
      <Route exact path={[profilPath, monComptePath]}>
        <MonCompte />
      </Route>
      <Route path={rejoindreUneCollectivitePath}>
        <RejoindreUneCollectivite />
      </Route>
    </>
  );
};
