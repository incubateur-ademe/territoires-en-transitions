import {Link} from 'react-router-dom';
import {allCollectivitesPath, signInPath, signUpPath} from 'app/paths';
import {TAuthContext} from 'core-logic/api/auth/AuthProvider';
import HeaderNavigationProfileDropdown from './HeaderNavigationProfileDropdown';
import {Aide} from '../Aide';

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
          <Aide />
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
