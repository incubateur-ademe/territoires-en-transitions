import {Navigation} from 'app/Navigation';
import {EpcisPage} from 'app/pages/Epcis/EpcisPage';
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  RouteProps,
  Switch,
} from 'react-router-dom';
import React from 'react';
import {Footer, Header} from 'ui';
import {FooterDescription, FooterNavigation} from 'ui/Footer';
import 'app/DesignSystem/core.css';
import {AuthRoutes} from 'app/pages/Auth/AuthRoutes';
import {CollectiviteRoutes} from 'app/pages/collectivite/CollectiviteRoutes';
import Home from 'app/pages/Home';
import {useConnected} from 'core-logic/hooks';

export const App = () => {
  return (
    <Router>
      <Switch>
        <HomeRoute exact path="/">
          <Header nav={<Navigation />} />
          <Home />
        </HomeRoute>

        <Route path={'/epcis'}>
          <Header nav={<Navigation />} />
          <EpcisPage />
        </Route>

        <Route path={'/auth'}>
          <Header nav={<Navigation />} />
          <AuthRoutes />
        </Route>

        <Route path={'/epcis'}>
          <Header nav={<Navigation />} />
          <EpcisPage />
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

const HomeRoute = ({children, ...rest}: RouteProps) => {
  const connected = useConnected();

  return (
    <Route
      {...rest}
      render={({location}) =>
        !connected ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: '/epcis',
              state: {from: location},
            }}
          />
        )
      }
    />
  );
};

/**
 * doesn't work because of auth async nature, user is not
 * connected until he is, and the redirect to '/' is instant
 */
/*
const ProtectedRoute = ({children, ...rest}: RouteProps) => {
  const connected = useConnected();

  return (
    <Route
      {...rest}
      render={({location}) =>
        connected ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: '/',
              state: {from: location},
            }}
          />
        )
      }
    />
  );
};
*/
