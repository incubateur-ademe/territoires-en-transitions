import CollectivitePageLayout from 'app/pages/collectivite/CollectivitePageLayout/CollectivitePageLayout';
import {RouteEnAccesRestreint} from 'app/pages/collectivite/CollectiviteRoutes';
import {IndicateurPage} from 'app/pages/collectivite/Indicateurs/Indicateur/IndicateurPage';
import {TousLesIndicateursPage} from 'app/pages/collectivite/Indicateurs/TousLesIndicateurs/TousLesIndicateursPage';
import {
  collectiviteIndicateurPath,
  collectiviteIndicateurReferentielPath,
  collectiviteTousLesIndicateursPath,
} from 'app/paths';
import {Route, Switch} from 'react-router-dom';

const Indicateurs = () => {
  return (
    <Switch>
      {/** Liste tous les indicateurs */}
      <Route exact path={collectiviteTousLesIndicateursPath}>
        <div className="grow bg-grey-2 -mb-8 py-12 px-4 lg:px-6 2xl:px-0">
          <CollectivitePageLayout>
            <TousLesIndicateursPage />
          </CollectivitePageLayout>
        </div>
      </Route>

      {/** Page d'un indicateur */}
      <RouteEnAccesRestreint
        path={[
          collectiviteIndicateurPath,
          collectiviteIndicateurReferentielPath,
        ]}
      >
        <CollectivitePageLayout>
          <IndicateurPage />
        </CollectivitePageLayout>
      </RouteEnAccesRestreint>
    </Switch>
  );
};

export default Indicateurs;
