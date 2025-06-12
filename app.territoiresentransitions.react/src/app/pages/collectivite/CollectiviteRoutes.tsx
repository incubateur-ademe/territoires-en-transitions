import { ReactNode } from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';

import { AccueilPage } from '@/app/app/pages/collectivite/Accueil/AccueilPage';
import {
  collectiviteAccueilPath,
  collectiviteBibliothequePath,
  collectiviteJournalPath,
  collectivitePlansActionsBasePath,
  makeCollectiviteAccueilUrl,
} from '@/app/app/paths';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { BibliothequeDocsPage } from './BibliothequeDocs/BibliothequeDocsPage';
import { JournalActivitePage } from './Historique/JournalActivitePage';
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

      <RouteEnAccesRestreint path={collectivitePlansActionsBasePath}>
        <PlansActionsPage />
      </RouteEnAccesRestreint>

      <RouteEnAccesRestreint path={collectiviteJournalPath}>
        <JournalActivitePage />
      </RouteEnAccesRestreint>
      <RouteEnAccesRestreint path={collectiviteBibliothequePath}>
        <BibliothequeDocsPage />
      </RouteEnAccesRestreint>
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
