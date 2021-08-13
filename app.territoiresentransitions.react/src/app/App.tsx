import { Navigation } from "app/Navigation";
import { EpcisPage } from "app/pages/Epcis/EpcisPage";
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
  useParams,
  useRouteMatch,
} from "react-router-dom";

import { Footer, Header } from "ui";
import { FooterDescription, FooterNavigation } from "ui/Footer";
import {
  IndicateursPage,
  ActionReferentielAvancementPage,
  ReferentielsPage,
} from "./pages";
import "app/DesignSystem/core.css";

const Connected = () => {
  const { path, url } = useRouteMatch();
  const { epciId } = useParams<{ epciId: string }>();

  console.log(
    "path in connected is ",
    path,
    "url is",
    url,
    " and EPCI ID is",
    epciId,
  );

  if (false) {
    // todo redirect when user is not authenticated: https://reactrouter.com/web/example/auth-workflow
    return <Redirect to="" />;
  }
  return (
    <>
      <Route path={`${path}/actions_referentiels/`}>
        <ReferentielsPage />
      </Route>
      <Route path={`${path}/action/:actionId`}>
        <ActionReferentielAvancementPage />
      </Route>
      <Route path={`${path}/indicateurs/`}>
        <IndicateursPage />
      </Route>
    </>
  );
};

export const App = () => {
  return (
    <Router>
      <div className="relative max-w-6xl py-14 px-8 my-0 mx-auto box-border">
        <Switch>
          <Route exact path="/">
            <Header nav={<Navigation />} />
            <EpcisPage />
          </Route>

          <Route path={`/epcis/:epciId`}>
            <Header nav={<Navigation />} />
            <EpcisPage />
          </Route>

          <Route path={`/:epciId`}>
            <Header nav={<Navigation />} />
            <Connected />
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
