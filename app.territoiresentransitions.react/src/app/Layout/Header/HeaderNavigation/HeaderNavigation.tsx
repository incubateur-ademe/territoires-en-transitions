import {Link, NavLink} from 'react-router-dom';
import {
  allCollectivitesPath,
  monComptePath,
  signInPath,
  signUpPath,
} from 'app/paths';
import {TAuthContext} from 'core-logic/api/auth/AuthProvider';
import {LogoutBtn} from 'app/Layout/Header/LogoutBtn';
import {activeTabClassName} from 'app/Layout/Header/CollectiviteNavigation/CollectiviteNavigation';

type Props = {
  auth: TAuthContext;
};

const HeaderNavigation = ({auth}: Props) => {
  const {isConnected, user} = auth;
  return (
    <div className="fr-header__tools hidden lg:block">
      <div className="fr-header__tools-links">
        <ul className="fr-links-group">
          {isConnected && (
            <Link to={allCollectivitesPath} className="fr-link">
              Collectivités engagées
            </Link>
          )}
          <a
            data-test="help"
            className="fr-link"
            href="https://aide.territoiresentransitions.fr/fr/"
            target="_blank"
          >
            <div className="fr-fi-question-line mr-2" />
            Aide
          </a>
          {isConnected ? (
            <div data-test="connectedMenu" className="group relative">
              <button className="fr-link" style={{maxWidth: '15rem'}}>
                <div className="fr-fi-account-line mr-2" />
                <span className="line-clamp-1">{user?.prenom}</span>
                <div className="fr-fi-arrow-down-s-line ml-2 scale-90 group-focus-within:rotate-180" />
              </button>
              <nav className="bg-white invisible absolute inset-x-0 top-full transition-all opacity-0 drop-shadow-md group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-1 z-50">
                <ul>
                  <li className="fr-nav__item border-b border-gray-200">
                    <NavLink
                      to={monComptePath}
                      className="fr-nav__link before:!hidden"
                      activeClassName={activeTabClassName}
                    >
                      <span className="px-3">Profil</span>
                    </NavLink>
                  </li>
                  <li className="fr-nav__item">
                    <LogoutBtn auth={auth} />
                  </li>
                </ul>
              </nav>
            </div>
          ) : (
            <>
              <Link data-test="signup" className="fr-link" to={signUpPath}>
                <div className="fr-fi-add-line mr-2" />
                Créer un compte
              </Link>
              <Link data-test="signin" className="fr-link" to={signInPath}>
                <div className="fr-fi-account-line mr-2" />
                Se connecter
              </Link>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default HeaderNavigation;
