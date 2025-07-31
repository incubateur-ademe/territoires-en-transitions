import MonCompte from '@/app/app/pages/Profil/MonCompte/MonCompte';
import { monComptePath, profilPath } from '@/app/app/paths';
import { Route } from 'react-router-dom';

export const ProfilRoutes = () => {
  return (
    <Route exact path={[profilPath, monComptePath]}>
      <MonCompte />
    </Route>
  );
};
