import {Link, NavLink} from 'react-router-dom';
import {
  allCollectivitesPath,
  monComptePath,
  signInPath,
  signUpPath,
} from 'app/paths';
import {TAuthContext} from 'core-logic/api/auth/AuthProvider';
import HeaderNavigationProfileDropdown from './HeaderNavigationProfileDropdown';

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
            target="_blank" rel="noreferrer"
          >
            <div className="fr-fi-question-line mr-2" />
            Aide
          </a>
          {isConnected && user ? (
            <HeaderNavigationProfileDropdown user={user} auth={auth} />
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
