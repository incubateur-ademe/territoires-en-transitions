import {Route, Switch} from 'react-router-dom';

import {
  collectivitePlansActionsSynthesePath,
  collectivitePlansActionsSyntheseVuePath,
  collectiviteTDBBasePath,
  collectiviteToutesLesFichesPath,
} from 'app/paths';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import CollectivitePageLayout from '../CollectivitePageLayout/CollectivitePageLayout';
import {RouteEnAccesRestreint} from '../CollectiviteRoutes';
import {TableauDeBordPage} from '../TableauDeBord/TableauDeBordPage';
import {PlansActionsRoutes} from './PlansActionsRoutes';
import {SynthesePage} from './Synthese/SynthesePage';
import {SyntheseVuePage} from './Synthese/SyntheseVue/SyntheseVuePage';
import {ToutesLesFichesActionPage} from 'app/pages/collectivite/PlansActions/ToutesLesFichesAction/ToutesLesFichesActionPage';

const PlansActions = () => {
  const collectivite = useCurrentCollectivite();

  if (!collectivite) return null;

  return (
    <Switch>
      <RouteEnAccesRestreint path={collectiviteTDBBasePath}>
        <TableauDeBordPage />
      </RouteEnAccesRestreint>

      {/* Synthèse */}
      <Route exact path={[collectivitePlansActionsSynthesePath]}>
        <CollectivitePageLayout dataTest="PlansAction">
          <SynthesePage collectiviteId={collectivite.collectivite_id} />
        </CollectivitePageLayout>
      </Route>
      <Route exact path={[collectivitePlansActionsSyntheseVuePath]}>
        <CollectivitePageLayout dataTest="PlansAction">
          <SyntheseVuePage />
        </CollectivitePageLayout>
      </Route>

      <Route exact path={collectiviteToutesLesFichesPath}>
        <div className="grow bg-grey-2 -mb-8 py-12 px-4 lg:px-6 2xl:px-0">
          <CollectivitePageLayout dataTest="ToutesLesFichesAction">
            <ToutesLesFichesActionPage />
          </CollectivitePageLayout>
        </div>
      </Route>

      <PlansActionsRoutes
        collectivite_id={collectivite.collectivite_id}
        readonly={collectivite.readonly}
      />
    </Switch>
  );
};

export default PlansActions;
