import {Navigation} from 'app/Navigation';
import {EpcisPage} from 'app/pages/Epcis/EpcisPage';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';

import {Footer, Header} from 'ui';
import {FooterDescription, FooterNavigation} from 'ui/Footer';
import 'app/DesignSystem/core.css';
import {AuthRoutes} from 'app/pages/Auth/AuthRoutes';
import {CollectiviteRoutes} from 'app/pages/collectivite/CollectiviteRoutes';

export const App = () => {
  return (
    <Router>
      <div className="relative max-w-6xl py-14 px-8 my-0 mx-auto box-border">
        <Switch>
          <Route exact path="/">
            <Header nav={<Navigation />} />
            <EpcisPage />
          </Route>

          <Route path={'/epcis'}>
            <Header nav={<Navigation />} />
            <EpcisPage />
          </Route>

          <Route path={'/auth'}>
            <Header nav={<Navigation />} />
            <AuthRoutes />
          </Route>

          <Route path={'/collectivite/:epciId'}>
            <Header nav={<Navigation />} />
            <CollectiviteRoutes />
          </Route>
        </Switch>
      </div>
      <Footer
        description={<FooterDescription />}
        navigation={<FooterNavigation />}
      />
    </Router>
  );
};
