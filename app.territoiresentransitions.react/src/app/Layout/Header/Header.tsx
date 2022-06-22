import {
  authBloc,
  AuthBloc,
  currentCollectiviteBloc,
  CurrentCollectiviteBloc,
  CurrentCollectiviteObserved,
} from 'core-logic/observables';
import {observer} from 'mobx-react-lite';
import {CollectiviteRedirector} from 'app/Redirector';
import {RejoindreCetteCollectiviteDialog} from 'app/pages/MesCollectivites/RejoindreCetteCollectiviteDialog';
import {getReferentContacts} from 'core-logic/api/procedures/collectiviteProcedures';
import LogoRepubliqueFrancaise from 'ui/logo/LogoRepubliqueFrancaise';
import HeaderNavigation from './HeaderNavigation';
import CollectiviteNavigation from './CollectiviteNavigation';

/** FAKE DATA -> Dont' commit */
const fakeCollectivite: CurrentCollectiviteObserved | null = {
  nom: 'Test collectivite',
  collectivite_id: 1,
  role_name: null,
};

// const fakeCollectivite = null;

/** END FAKE DATA */

const HeaderObserver = observer(
  ({
    authBloc,
    currentCollectiviteBloc,
  }: {
    authBloc: AuthBloc;
    currentCollectiviteBloc: CurrentCollectiviteBloc;
  }) => (
    <>
      <CollectiviteRedirector />
      <header role="banner" className="header fr-header ">
        <div className="fr-header__body">
          <div className="fr-container">
            <div className="fr-header__body-row header__row">
              <div className="fr-header__brand fr-enlarge-link">
                <div className="fr-header__brand-top">
                  <div className="fr-header__logo">
                    <LogoRepubliqueFrancaise />
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
              <HeaderNavigation />
            </div>
          </div>
        </div>
        {fakeCollectivite !== null && (
          <CollectiviteNavigation collectivite={fakeCollectivite} />
        )}
      </header>
      <CollectiviteReadOnlyBanner bloc={currentCollectiviteBloc} />
    </>
  )
);

const CollectiviteReadOnlyBanner = observer(
  ({bloc}: {bloc: CurrentCollectiviteBloc}) => {
    if (bloc.readonly)
      return (
        <div className="flex justify-center items-center bg-yellow-400 py-4 bg-opacity-70">
          <div className="text-sm mr-4">Lecture seule</div>
          <RejoindreCetteCollectiviteDialog
            getReferentContacts={getReferentContacts}
            collectivite={bloc.currentCollectivite!}
          />
        </div>
      );
    return null;
  }
);

const Header = () => (
  <HeaderObserver
    currentCollectiviteBloc={currentCollectiviteBloc}
    authBloc={authBloc}
  />
);

export default Header;
