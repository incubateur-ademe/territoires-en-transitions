import CollectivitePageLayout from '@/app/app/pages/collectivite/CollectivitePageLayout/CollectivitePageLayout';
import { RouteEnAccesRestreint } from '@/app/app/pages/collectivite/CollectiviteRoutes';
import { IndicateurPage } from '@/app/app/pages/collectivite/Indicateurs/Indicateur/IndicateurPage';
import { IndicateursCollectivitePage } from '@/app/app/pages/collectivite/Indicateurs/IndicateursCollectivite/IndicateursCollectivitePage';
import { TousLesIndicateursPage } from '@/app/app/pages/collectivite/Indicateurs/TousLesIndicateurs/TousLesIndicateursPage';
import {
  collectiviteIndicateurPath,
  collectiviteIndicateurReferentielPath,
  collectiviteIndicateursCollectivitePath,
  collectiviteTousLesIndicateursPath,
} from '@/app/app/paths';
import { PageContainer } from '@/app/ui/layout/page-layout';
import { Route, Switch } from 'react-router-dom';

const Indicateurs = () => {
  return (
    <Switch>
      {/** Liste tous les indicateurs */}
      <Route exact path={collectiviteTousLesIndicateursPath}>
        <div className="grow bg-grey-2 -mb-8 py-12 px-4 lg:px-6 2xl:px-0">
          <PageContainer>
            <TousLesIndicateursPage />
          </PageContainer>
        </div>
      </Route>

      <Route exact path={collectiviteIndicateursCollectivitePath}>
        <div className="grow bg-grey-2 -mb-8 py-12 px-4 lg:px-6 2xl:px-0">
          <PageContainer>
            <IndicateursCollectivitePage />
          </PageContainer>
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
