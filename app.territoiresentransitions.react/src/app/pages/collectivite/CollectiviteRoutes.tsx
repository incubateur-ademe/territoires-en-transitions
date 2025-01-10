import { ReactNode } from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';

import { AccueilPage } from '@/app/app/pages/collectivite/Accueil/AccueilPage';
import { AccueilPage as SyntheseEtatDesLieuxPage } from '@/app/app/pages/collectivite/EtatDesLieux/Accueil/AccueilPage';
import { IndicateursPage } from '@/app/app/pages/collectivite/Indicateurs/IndicateursPage';
import { TrajectoirePage } from '@/app/app/pages/collectivite/Trajectoire/TrajectoirePage';
import { MembresPage } from '@/app/app/pages/collectivite/Users/MembresPage';
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
} from '@/app/app/paths';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { ActionPage } from '@/app/referentiels/actions/action.page';
import { ReferentielPage } from '@/app/referentiels/referentiel/referentiel.page';
import { BibliothequeDocsPage } from './BibliothequeDocs/BibliothequeDocsPage';
import { JournalActivitePage } from './Historique/JournalActivitePage';
import { ParcoursLabellisationPage } from './ParcoursLabellisation/ParcoursLabellisationPage';
import { PersoReferentielPage } from './PersoReferentiel/PersoReferentielPage';
import { PersoReferentielThematiquePage } from './PersoReferentielThematique/PersoReferentielThematiquePage';
import { PlansActionsPage } from './PlansActions/PlansActionsPage';

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
        <ReferentielPage />
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

      <RouteEnAccesRestreint path={collectiviteUsersPath}>
        <MembresPage />
      </RouteEnAccesRestreint>
      <Route path={collectivitePersoRefPath} exact>
        <PersoReferentielPage />
      </Route>
      <Route path={collectivitePersoRefThematiquePath}>
        <PersoReferentielThematiquePage />
      </Route>
      <RouteEnAccesRestreint path={collectiviteJournalPath}>
        <JournalActivitePage />
      </RouteEnAccesRestreint>
      <RouteEnAccesRestreint path={collectiviteBibliothequePath}>
        <BibliothequeDocsPage />
      </RouteEnAccesRestreint>
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
        collectivite.accesRestreint && collectivite.niveauAcces === null ? (
          <Redirect
            to={makeCollectiviteAccueilUrl({
              collectiviteId: collectivite.collectiviteId,
            })}
          />
        ) : (
          (children as ReactNode)
        )
      }
    />
  );
};
