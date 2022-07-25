import LogoRepubliqueFrancaise from 'ui/logo/LogoRepubliqueFrancaise';
import {useAuth, TAuthContext} from 'core-logic/api/auth/AuthProvider';
import HeaderNavigation from 'app/Layout/Header/HeaderNavigation';
import CollectiviteNavigation from 'app/Layout/Header/CollectiviteNavigation';
import MobileNavigation from 'app/Layout/Header/MobileNavigation';
import {makeCollectiviteNavItems} from 'app/Layout/Header/makeCollectiviteNavItems';
import {OwnedCollectiviteRead} from 'generated/dataLayer';
import ademeLogoImage from 'app/static/img/ademe.jpg';
import {useOwnedCollectivites} from 'core-logic/hooks/useOwnedCollectivites';
import {
  CurrentCollectivite,
  useCurrentCollectivite,
} from 'core-logic/hooks/useCurrentCollectivite';

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

  return (
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
                <p className="fr-header__service-title pointer-events-auto">
                  Territoires en Transitions
                </p>
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
    </header>
  );
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
