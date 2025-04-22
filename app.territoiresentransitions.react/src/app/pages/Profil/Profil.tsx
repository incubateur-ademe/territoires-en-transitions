import { Route } from 'react-router-dom';

import MonCompte from '@/app/app/pages/Profil/MonCompte/MonCompte';
import { monComptePath, profilPath } from '@/app/app/paths';

const Profil = () => {
  return (
    <Route exact path={[profilPath, monComptePath]}>
      <MonCompte />
    </Route>
  );
};

export default Profil;
