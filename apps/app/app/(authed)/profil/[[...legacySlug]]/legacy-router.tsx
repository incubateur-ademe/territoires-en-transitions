import { ProfilPage } from '@/app/app/pages/Profil/ProfilPage';
import { profilPath } from '@/app/app/paths';
import LegacyRouterSync from '@/app/legacy-router-sync';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

export default function LegacyRouter() {
  return (
    <BrowserRouter>
      <LegacyRouterSync />
      <Switch>
        <Route path={profilPath}>
          <ProfilPage />
        </Route>
      </Switch>
    </BrowserRouter>
  );
}
