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
      <Footer
        description={<FooterDescription />}
        navigation={<FooterNavigation />}
      />
    </Router>
  );
};
