import {Route} from 'react-router-dom';

import {
  collectiviteActionPath,
  collectiviteIndicateurPath as collectiviteIndicateursPath,
  collectiviteReferentielPath,
  collectiviteTableauBordPath,
  collectiviteUsersPath,
  collectivitePersoRefPath,
  collectivitePersoRefThematiquePath,
  collectiviteLabellisationPath,
  collectiviteAllCollectivitesPath,
  collectiviteJournalPath,
  collectiviteBibliothequePath,
  CollectivitePlansActionsBasePath,
} from 'app/paths';
import {ReferentielsPage} from 'app/pages/collectivite/Referentiels/ReferentielsPage';
import {ActionPage} from 'app/pages/collectivite/Referentiels/ActionPage';
import {IndicateursPage} from 'app/pages/collectivite/Indicateurs/IndicateursPage';
import {TableauBordPage} from 'app/pages/collectivite/TableauBord/TableauBordPage';
import {MembresPage} from 'app/pages/collectivite/Users/MembresPage';
import {PersoReferentielPage} from './PersoReferentiel/PersoReferentielPage';
import {PersoReferentielThematiquePage} from './PersoReferentielThematique/PersoReferentielThematiquePage';
import {ParcoursLabellisationPage} from './ParcoursLabellisation/ParcoursLabellisationPage';
import {ToutesLesCollectivitesPage} from '../ToutesLesCollectivites/ToutesLesCollectivitesPage';
import {JournalActivitePage} from './Historique/JournalActivitePage';
import {BibliothequeDocsPage} from './BibliothequeDocs/BibliothequeDocsPage';
import {PlansActionsPage} from './PlansActions/PlansActionsPage';

/**
 * Routes starting with collectivite/:collectiviteId/ see App.ts Router.
 *
 * Is responsible for setting the current collectivite id.
 */
export const CollectiviteRoutes = () => {
  return (
    <>
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

      <Route path={CollectivitePlansActionsBasePath}>
        <PlansActionsPage />
      </Route>

      <Route path={collectiviteUsersPath}>
        <MembresPage />
      </Route>
      <Route path={collectivitePersoRefPath} exact>
        <PersoReferentielPage />
      </Route>
      <Route path={collectivitePersoRefThematiquePath}>
        <PersoReferentielThematiquePage />
      </Route>
      <Route path={collectiviteJournalPath}>
        <JournalActivitePage />
      </Route>
      <Route path={collectiviteBibliothequePath}>
        <BibliothequeDocsPage />
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
