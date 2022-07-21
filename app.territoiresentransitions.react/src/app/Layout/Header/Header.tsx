import {useMemo} from 'react';
import {useLocation} from 'react-router-dom';
import LogoRepubliqueFrancaise from 'ui/logo/LogoRepubliqueFrancaise';
import {useAuth, TAuthContext} from 'core-logic/api/auth/AuthProvider';
import HeaderNavigation from 'app/Layout/Header/HeaderNavigation';
import CollectiviteNavigation from 'app/Layout/Header/CollectiviteNavigation';
import MobileNavigation from 'app/Layout/Header/MobileNavigation';
import SansCollectiviteNavigation from 'app/Layout/Header/SansCollectiviteNavigation';
import {makeCollectiviteNavItems} from 'app/Layout/Header/makeCollectiviteNavItems';
import {OwnedCollectiviteRead} from 'generated/dataLayer';
import ademeLogoImage from 'app/static/img/ademe.jpg';
import {useOwnedCollectivites} from 'core-logic/hooks/useOwnedCollectivites';
import {
  CurrentCollectivite,
  useCurrentCollectivite,
} from 'core-logic/hooks/useCurrentCollectivite';
import {RejoindreCetteCollectiviteDialog} from 'app/pages/MesCollectivites/RejoindreCetteCollectiviteDialog';
import {getReferentContacts} from 'core-logic/api/procedures/collectiviteProcedures';
import {monParcoursPath} from 'app/paths';

export const Header = ({
  auth,
  currentCollectivite,
  ownedCollectivites,
}: {
  auth: TAuthContext;
  currentCollectivite: CurrentCollectivite | null;
  ownedCollectivites: OwnedCollectiviteRead[] | null;
}) => {
  const collectiviteNav = currentCollectivite
    ? makeCollectiviteNavItems(currentCollectivite)
    : null;

  const {pathname} = useLocation();

  const isSansCollectiviteNavDisplayed = useMemo(
    () =>
      pathname !== monParcoursPath &&
      ownedCollectivites &&
      ownedCollectivites.length === 0,
    [ownedCollectivites, pathname]
  );

  return (
    <>
      <header role="banner" className="header fr-header ">
        <div className="fr-header__body">
          <div className="fr-container">
            <div className="fr-header__body-row header__row">
              <div className="fr-header__brand fr-enlarge-link pointer-events-none lg:pointer-events-auto">
                <div className="fr-header__brand-top !w-auto">
                  <div className="fr-header__logo">
                    <LogoRepubliqueFrancaise />
                  </div>
                </div>
                <div className="fr-header__ademe flex-shrink-0">
                  <img
                    src={ademeLogoImage}
                    alt="logo ADEME"
                    loading="lazy"
                    className="h-20"
                  />
                </div>
                <div className="fr-header__service">
                  <a href="/" title="Accueil">
                    <p className="fr-header__service-title pointer-events-auto">
                      Territoires en Transitions
                    </p>
                  </a>
                  <p className="text-sm">
                    Accompagner la transition écologique des collectivités
                  </p>
                </div>
              </div>
              <HeaderNavigation auth={auth} />
              <MobileNavigation
                auth={auth}
                collectiviteNav={collectiviteNav}
                currentCollectivite={currentCollectivite}
                ownedCollectivites={ownedCollectivites}
              />
            </div>
          </div>
        </div>
        {collectiviteNav && currentCollectivite && ownedCollectivites ? (
          <CollectiviteNavigation
            collectiviteNav={collectiviteNav}
            currentCollectivite={currentCollectivite}
            ownedCollectivites={ownedCollectivites}
          />
        ) : null}
        {isSansCollectiviteNavDisplayed && <SansCollectiviteNavigation />}
      </header>
      {collectiviteNav && currentCollectivite?.readonly ? (
        <CollectiviteReadOnlyBanner collectivite={currentCollectivite} />
      ) : null}
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
      <div className="flex justify-center items-center bg-yellow-400 py-4 bg-opacity-70">
        <div className="text-sm mr-4">Lecture seule</div>
        <RejoindreCetteCollectiviteDialog
          getReferentContacts={getReferentContacts}
          collectivite={collectivite}
        />
      </div>
    );
  return null;
};

export default () => {
  const auth = useAuth();
  const currentCollectivite = useCurrentCollectivite();
  const ownedCollectivites = useOwnedCollectivites();
  return (
    <Header
      auth={auth}
      currentCollectivite={currentCollectivite}
      ownedCollectivites={ownedCollectivites}
    />
  );
};
