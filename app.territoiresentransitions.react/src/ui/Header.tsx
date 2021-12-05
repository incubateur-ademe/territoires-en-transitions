// import '@gouvfr/dsfr/dist/css/header.css';
// import '@gouvfr/dsfr/dist/css/logo.css';
// import '@gouvfr/dsfr/dist/css/links.css';
// import '@gouvfr/dsfr/dist/css/navigation.css';

import {EpciNavigation, Navigation} from 'app/Navigation';
import {
  authBloc,
  AuthBloc,
  currentEpciBloc,
  CurrentEpciBloc,
} from 'core-logic/observables';
import {observer} from 'mobx-react-lite';
import {EpciRedirector} from 'app/Redirector';

const HeaderObserver = observer(
  ({
    authBloc,
    currentEpciBloc,
  }: {
    authBloc: AuthBloc;
    currentEpciBloc: CurrentEpciBloc;
  }) => (
    <>
      <EpciRedirector />
      <header role="banner" className="header fr-header ">
        {authBloc.userId}, {authBloc.connected ? 'connected' : 'not connected'},{' '}
        with role{' '}
        {currentEpciBloc.readonly
          ? 'readonly'
          : currentEpciBloc.currentEpci?.role_name}
        <div className="fr-header__body">
          <div className="fr-container">
            <div className="fr-header__body-row header__row">
              <div className="fr-header__brand fr-enlarge-link">
                <div className="fr-header__brand-top">
                  <div className="fr-header__logo">
                    <p className="fr-logo">
                      République
                      <br /> française
                    </p>
                  </div>
                </div>
                <div className="fr-header__ademe">
                  <img
                    src="https://territoiresentransitions.fr/img/ademe.jpg"
                    alt="logo ADEME"
                    loading="lazy"
                    className="h-20"
                  />
                </div>
                <div className="fr-header__service">
                  <a href="/" title="Accueil">
                    <p className="fr-header__service-title">
                      Territoires en Transitions
                    </p>
                  </a>
                </div>
              </div>
              <Navigation />
            </div>
          </div>
        </div>
        <EpciHeader bloc={currentEpciBloc} />
      </header>
    </>
  )
);

export const Header = () => (
  <HeaderObserver currentEpciBloc={currentEpciBloc} authBloc={authBloc} />
);

const ReadOnlyBanner = () => (
  <div className="flex justify-end h-5 bg-yellow-400 py-0.5 bg-opacity-70">
    <p className="pr-3 text-xs">lecture seule</p>
  </div>
);

const EpciHeader = observer(({bloc}: {bloc: CurrentEpciBloc}) => {
  return (
    <>
      <div className="fr-container">
        {bloc.currentEpci !== null && (
          <div>
            {bloc.readonly && <ReadOnlyBanner />}
            <div className="flex flex-row justify-between">
              <EpciNavigation />
              <div className="flex items-center font-bold">
                {bloc.currentEpci.nom}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
});
