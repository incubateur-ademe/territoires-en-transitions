import { IndicateursCollectivitePage } from '@/app/app/pages/collectivite/Indicateurs/IndicateursCollectivite/IndicateursCollectivitePage';
import { TousLesIndicateursPage } from '@/app/app/pages/collectivite/Indicateurs/TousLesIndicateurs/TousLesIndicateursPage';
import {
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
    </Switch>
  );
};

export default Indicateurs;
