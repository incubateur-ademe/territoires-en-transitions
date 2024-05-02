import {ReactNode} from 'react';
import {Redirect, Route, RouteProps} from 'react-router-dom';

import {
  collectiviteActionPath,
  collectiviteIndicateurPath as collectiviteIndicateursPath,
  collectiviteReferentielPath,
  collectiviteUsersPath,
  collectivitePersoRefPath,
  collectivitePersoRefThematiquePath,
  collectiviteLabellisationPath,
  collectiviteJournalPath,
  collectiviteBibliothequePath,
  collectivitePlansActionsBasePath,
  makeCollectiviteAccueilUrl,
  collectiviteAccueilPath,
  collectiviteTDBLandingPath,
} from 'app/paths';
import {ReferentielsPage} from 'app/pages/collectivite/Referentiels/ReferentielsPage';
import {ActionPage} from 'app/pages/collectivite/Referentiels/ActionPage';
import {IndicateursPage} from 'app/pages/collectivite/Indicateurs/IndicateursPage';
import {MembresPage} from 'app/pages/collectivite/Users/MembresPage';
import {PersoReferentielPage} from './PersoReferentiel/PersoReferentielPage';
import {PersoReferentielThematiquePage} from './PersoReferentielThematique/PersoReferentielThematiquePage';
import {ParcoursLabellisationPage} from './ParcoursLabellisation/ParcoursLabellisationPage';
import {JournalActivitePage} from './Historique/JournalActivitePage';
import {BibliothequeDocsPage} from './BibliothequeDocs/BibliothequeDocsPage';
import {PlansActionsPage} from './PlansActions/PlansActionsPage';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import AccueilPage from './Accueil/AccueilPage';
import {TableauDeBordPage} from 'app/pages/collectivite/TableauDeBord/TableauDeBordPage';

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
      <Route path={collectiviteAccueilPath}>
        <AccueilPage />
      </Route>
      <Route path={collectiviteActionPath}>
        <ActionPage />
      </Route>

      <RouteEnAccesRestreint path={collectiviteIndicateursPath}>
        <IndicateursPage />
      </RouteEnAccesRestreint>
      <RouteEnAccesRestreint path={collectivitePlansActionsBasePath}>
        <PlansActionsPage />
      </RouteEnAccesRestreint>
      <RouteEnAccesRestreint path={collectiviteTDBLandingPath}>
        <TableauDeBordPage />
      </RouteEnAccesRestreint>

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
    </>
  );
};

// protège une route quand la collectivité est en accès restreint (redirige vers
// le tableau de bord)
const RouteEnAccesRestreint = (props: RouteProps) => {
  const {children, ...other} = props;
  const collectivite = useCurrentCollectivite();
  if (!collectivite) {
    return null;
  }

  return (
    <Route
      {...other}
      render={({location}) =>
        collectivite.acces_restreint && collectivite.niveau_acces === null ? (
          <Redirect
            to={makeCollectiviteAccueilUrl({
              collectiviteId: collectivite.collectivite_id,
            })}
          />
        ) : (
          (children as ReactNode)
        )
      }
    />
  );
};
