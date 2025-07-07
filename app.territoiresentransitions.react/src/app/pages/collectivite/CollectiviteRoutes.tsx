import { ReactNode } from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';

import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import {
  collectiviteBibliothequePath,
  collectiviteJournalPath,
  makeCollectiviteAccueilUrl,
} from '@/app/app/paths';
import { BibliothequeDocsPage } from './BibliothequeDocs/BibliothequeDocsPage';
import { JournalActivitePage } from './Historique/JournalActivitePage';

/**
 * Routes starting with collectivite/:collectiviteId/ see App.ts Router.
 *
 * Is responsible for setting the current collectivite id.
 */
export const CollectiviteRoutes = ({
  collectivite,
}: {
  collectivite: CurrentCollectivite;
}) => {
  return (
    <>
      <RouteEnAccesRestreint
        path={collectiviteJournalPath}
        collectivite={collectivite}
      >
        <JournalActivitePage />
      </RouteEnAccesRestreint>
      <RouteEnAccesRestreint
        path={collectiviteBibliothequePath}
        collectivite={collectivite}
      >
        <BibliothequeDocsPage />
      </RouteEnAccesRestreint>
    </>
  );
};

// protège une route quand la collectivité est en accès restreint (redirige vers
// l'accueil')
interface RouteEnAccesRestreintProps extends RouteProps {
  collectivite: CurrentCollectivite;
}

export const RouteEnAccesRestreint = (props: RouteEnAccesRestreintProps) => {
  const { children, collectivite, ...other } = props;

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
