import LogoRepubliqueFrancaise from 'ui/logo/LogoRepubliqueFrancaise';
import {useAuth, TAuthContext} from 'core-logic/api/auth/AuthProvider';
import {Maintenance, useMaintenance} from 'app/Layout/useMaintenance';
import HeaderNavigation from './HeaderNavigation';
import CollectiviteNavigation from './CollectiviteNavigation';
import MobileNavigation from './MobileNavigation';
import {makeCollectiviteNavItems} from './makeCollectiviteNavItems';
import ademeLogoImage from 'app/static/img/ademe.jpg';
import {useState} from 'react';
import {useOwnedCollectivites} from 'core-logic/hooks/useOwnedCollectivites';
import {
  CurrentCollectivite,
  useCurrentCollectivite,
} from 'core-logic/hooks/useCurrentCollectivite';
import {MesCollectivitesRead} from 'generated/dataLayer';

export const Header = ({
  auth,
  currentCollectivite,
  ownedCollectivites,
  maintenance,
}: {
  auth: TAuthContext;
  currentCollectivite: CurrentCollectivite | null;
  maintenance: Maintenance | null;
  ownedCollectivites: MesCollectivitesRead[] | null;
}) => {
  const collectiviteNav = currentCollectivite
    ? makeCollectiviteNavItems(currentCollectivite)
    : null;

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
      </header>
      <MaintenanceBanner maintenance={maintenance} />
    </>
  );
};

// TODO : Upgrade dsfr to 1.6.0 to use official banner : https://gouvfr.atlassian.net/wiki/spaces/DB/pages/992903190/Bandeau+d+information+importante#
const InformationBanner = ({message}: {message: string}) => {
  const [showBanner, setShowBanner] = useState(true);
  if (!showBanner) return null;
  return (
    <div
      style={{
        height: '56px',
        padding: '12px, 120px, 12px, 120px',
        backgroundColor: '#E8EDFF',
        display: 'flex',
        justifyContent: 'space-evenly',
        justifyItems: 'center',
        fontFamily: 'Marianne',
        fontSize: '16px',
        fontWeight: 700,
        lineHeight: '24px',
        textAlign: 'left',
        color: '#0063CB',
      }}
    >
      <div className="flex items-center gap-7">
        {' '}
        <div className=" fr-fi-information-fill"></div>
        <div>{message}</div>
      </div>
      <button
        title="Masquer le message"
        onClick={() => {
          setShowBanner(false);
        }}
      >
        x
      </button>
    </div>
  );
};

// TODO : Upgrade dsfr to 1.6.0 to use official banner : https://gouvfr.atlassian.net/wiki/spaces/DB/pages/992903190/Bandeau+d+information+importante#
const AlertBanner = ({message}: {message: string}) => {
  return (
    <div
      style={{
        height: '56px',
        padding: '12px, 120px, 12px, 120px',
        backgroundColor: '#FFE8E5',
        display: 'flex',
        gap: '28px',
        alignContent: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Marianne',
        fontSize: '16px',
        fontWeight: 700,
        lineHeight: '24px',
        color: '#B34000',
      }}
    >
      <div className=" fr-fi-alert-fill"></div>
      <div>{message}</div>
    </div>
  );
};

const MaintenanceBanner = ({
  maintenance,
}: {
  maintenance: Maintenance | null;
}) => {
  if (!maintenance) return null;

  const ongoing = new Date(maintenance.now) > new Date(maintenance.begins_at);
  const formatedDate = new Date(maintenance.begins_at).toLocaleString('fr', {
    dateStyle: 'short',
  });
  const formatedBeginsAt = new Date(maintenance.begins_at).toLocaleTimeString(
    [],
    {
      timeStyle: 'short',
    }
  );
  const formatedEndsAt = new Date(maintenance.ends_at).toLocaleTimeString([], {
    timeStyle: 'short',
  });
  if (ongoing)
    return (
      <AlertBanner message="Une mise en production est en cours. Merci de ne pas utiliser la plateforme pour éviter toute perte d'informations." />
    );
  return (
    <InformationBanner
      message={`Une mise en production est prévue le ${formatedDate} de ${formatedBeginsAt} à ${formatedEndsAt}. Le fonctionnement de la plateforme pourra en être altéré sur ce laps de temps.`}
    />
  );
};

export default () => {
  const auth = useAuth();
  const currentCollectivite = useCurrentCollectivite();
  const ownedCollectivites = useOwnedCollectivites();
  const maintenance = useMaintenance();

  return (
    <Header
      auth={auth}
      currentCollectivite={currentCollectivite}
      ownedCollectivites={ownedCollectivites}
      maintenance={maintenance}
    />
  );
};
