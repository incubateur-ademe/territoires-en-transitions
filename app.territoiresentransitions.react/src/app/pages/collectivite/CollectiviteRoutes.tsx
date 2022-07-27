import {Route, useRouteMatch} from 'react-router-dom';

import {PlanActionPage} from 'app/pages/collectivite/PlanActions/PlanActionsPage';
import {FicheActionPage} from 'app/pages/collectivite/PlanActions/FicheActionPage';
import {FicheActionCreationPage} from 'app/pages/collectivite/PlanActions/FicheActionCreationPage';
import {
  collectiviteActionPath,
  collectiviteIndicateurPath as collectiviteIndicateursPath,
  collectiviteNouvelleFichePath,
  collectivitePlanActionPath,
  collectiviteReferentielPath,
  collectiviteTableauBordPath,
  collectiviteUsersPath,
  collectivitePersoRefPath,
  collectivitePersoRefThematiquePath,
  collectiviteLabellisationPath,
  collectiviteAllCollectivitesPath,
} from 'app/paths';
import {ReferentielsPage} from 'app/pages/collectivite/Referentiels/ReferentielsPage';
import {ActionPage} from 'app/pages/collectivite/Referentiels/ActionPage';
import {IndicateursPage} from 'app/pages/collectivite/Indicateurs/IndicateursPage';
import {TableauBordPage} from 'app/pages/collectivite/TableauBord/TableauBordPage';
import {UsersPage} from 'app/pages/collectivite/Users/UsersPage';
import {PersoReferentielPage} from './PersoReferentiel/PersoReferentielPage';
import {PersoReferentielThematiquePage} from './PersoReferentielThematique/PersoReferentielThematiquePage';
import {ParcoursLabellisationPage} from './ParcoursLabellisation/ParcoursLabellisationPage';
import {ToutesLesCollectivitesPage} from '../ToutesLesCollectivites/ToutesLesCollectivitesPage';
import {
  CurrentCollectivite,
  useCurrentCollectivite,
} from 'core-logic/hooks/useCurrentCollectivite';
import {RejoindreCetteCollectiviteDialog} from './RejoindreCetteCollectiviteDialog/RejoindreCetteCollectiviteDialog';
import {getReferentContacts} from 'core-logic/api/procedures/collectiviteProcedures';

/**
 * Routes starting with collectivite/:collectiviteId/ see App.ts Router.
 *
 * Is responsible for setting the current collectivite id.
 */
export const CollectiviteRoutes = () => {
  const {path} = useRouteMatch();
  const currentCollectivite = useCurrentCollectivite();
  return (
    <>
      <CollectiviteReadOnlyBanner collectivite={currentCollectivite} />
      <Route path={collectiviteReferentielPath}>
        <ReferentielsPage />
      </Route>
      <Route path={collectiviteTableauBordPath}>
        <TableauBordPage />
      </Route>
      <Route path={collectiviteActionPath}>
        <ActionPage />
      </Route>
      <Route path={collectiviteIndicateursPath}>
        <IndicateursPage />
      </Route>
      <Route path={collectivitePlanActionPath}>
        <PlanActionPage />
      </Route>
      <Route path={`${path}/fiche/:ficheUid`}>
        <FicheActionPage />
      </Route>
      <Route path={collectiviteNouvelleFichePath}>
        <FicheActionCreationPage />
      </Route>
      <Route path={collectiviteUsersPath}>
        <UsersPage />
      </Route>
      <Route path={collectivitePersoRefPath} exact>
        <PersoReferentielPage />
      </Route>
      <Route path={collectivitePersoRefThematiquePath}>
        <PersoReferentielThematiquePage />
      </Route>
      <Route path={collectiviteLabellisationPath}>
        <ParcoursLabellisationPage />
      </Route>
      <Route path={collectiviteAllCollectivitesPath}>
        <ToutesLesCollectivitesPage />
      </Route>
    </>
  );
};

const CollectiviteReadOnlyBanner = ({
  collectivite,
}: {
  collectivite: CurrentCollectivite | null;
}) => {
  if (!!collectivite && collectivite.readonly)
    return (
      <div
        data-test="ReadOnlyBanner"
        className="flex justify-center items-center bg-yellow-400 py-4 bg-opacity-70"
      >
        <div className="text-sm mr-4">Lecture seule</div>
        <RejoindreCetteCollectiviteDialog
          getReferentContacts={getReferentContacts}
          collectivite={collectivite}
        />
      </div>
    );
  return null;
};
