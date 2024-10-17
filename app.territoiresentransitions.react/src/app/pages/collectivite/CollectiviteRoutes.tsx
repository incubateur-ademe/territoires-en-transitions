import { ReactNode } from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';

import { ActionPage } from 'app/pages/collectivite/Referentiels/ActionPage';
import { ReferentielsPage } from 'app/pages/collectivite/Referentiels/ReferentielsPage';
import { MembresPage } from 'app/pages/collectivite/Users/MembresPage';
import {
  collectiviteAccueilPath,
  collectiviteActionPath,
  collectiviteBibliothequePath,
  collectiviteIndicateursBasePath,
  collectiviteJournalPath,
  collectiviteLabellisationPath,
  collectivitePersoRefPath,
  collectivitePersoRefThematiquePath,
  collectivitePlansActionsBasePath,
  collectiviteReferentielPath,
  collectiviteSyntheseReferentielPath,
  collectiviteTrajectoirePath,
  collectiviteUsersPath,
  makeCollectiviteAccueilUrl,
} from 'app/paths';
import { useCurrentCollectivite } from 'core-logic/hooks/useCurrentCollectivite';
import { BibliothequeDocsPage } from './BibliothequeDocs/BibliothequeDocsPage';
import { JournalActivitePage } from './Historique/JournalActivitePage';
import { ParcoursLabellisationPage } from './ParcoursLabellisation/ParcoursLabellisationPage';
import { PersoReferentielPage } from './PersoReferentiel/PersoReferentielPage';
import { PersoReferentielThematiquePage } from './PersoReferentielThematique/PersoReferentielThematiquePage';
import { PlansActionsPage } from './PlansActions/PlansActionsPage';
import { IndicateursPage } from 'app/pages/collectivite/Indicateurs/IndicateursPage';
import { TrajectoirePage } from 'app/pages/collectivite/Trajectoire/TrajectoirePage';
import { AccueilPage as SyntheseEtatDesLieuxPage } from '@tet/app/pages/collectivite/EtatDesLieux/Accueil/AccueilPage';
import { AccueilPage } from '@tet/app/pages/collectivite/Accueil/AccueilPage';

/**
 * Routes starting with collectivite/:collectiviteId/ see App.ts Router.
 *
 * Is responsible for setting the current collectivite id.
 */
export const CollectiviteRoutes = () => {
  return (
    <>
      <Route path={collectiviteAccueilPath}>
        <AccueilPage />
      </Route>

      <Route path={collectiviteReferentielPath}>
        <ReferentielsPage />
      </Route>
      <Route path={collectiviteSyntheseReferentielPath}>
        <SyntheseEtatDesLieuxPage />
      </Route>
      <Route path={collectiviteActionPath}>
        <ActionPage />
      </Route>

      <RouteEnAccesRestreint path={collectiviteIndicateursBasePath}>
        <IndicateursPage />
      </RouteEnAccesRestreint>
      <RouteEnAccesRestreint path={[collectiviteTrajectoirePath]}>
        <TrajectoirePage />
      </RouteEnAccesRestreint>

      <RouteEnAccesRestreint path={collectivitePlansActionsBasePath}>
        <PlansActionsPage />
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
// l'accueil')
export const RouteEnAccesRestreint = (props: RouteProps) => {
  const { children, ...other } = props;
  const collectivite = useCurrentCollectivite();
  if (!collectivite) {
    return null;
  }

  return (
    <Route
      {...other}
      render={({ location }) =>
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
