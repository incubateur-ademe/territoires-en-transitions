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
import PageContainer from '@/ui/components/layout/page-container';
import { Route, Switch } from 'react-router-dom';

const Indicateurs = () => {
  return (
    <Switch>
      {/** Liste tous les indicateurs */}
      <Route exact path={collectiviteTousLesIndicateursPath}>
        <PageContainer>
          <TousLesIndicateursPage />
        </PageContainer>
      </Route>

      <Route exact path={collectiviteIndicateursCollectivitePath}>
        <PageContainer>
          <IndicateursCollectivitePage />
        </PageContainer>
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
