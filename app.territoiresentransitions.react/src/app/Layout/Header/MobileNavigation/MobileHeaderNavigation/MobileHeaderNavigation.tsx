import {useState} from 'react';
import {Link, NavLink} from 'react-router-dom';
import {signInPath, signUpPath} from 'app/paths';
import {TAuthContext} from 'core-logic/api/auth/AuthProvider';
import {LogoutBtn} from '../../LogoutBtn';

const profilePath = '#';

type Props = {
  auth: TAuthContext;
  toggleMobileNavigation: () => void;
};

const MobileHeaderNavigation = ({auth, toggleMobileNavigation}: Props) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const toggleIsProfileOpen = () => setIsProfileOpen(!isProfileOpen);
  const {isConnected, user} = auth;

  return (
    <>
      {isConnected && user ? (
        <div>
          <button className="fr-link w-full !p-4" onClick={toggleIsProfileOpen}>
            <div className="fr-fi-account-line mr-2" />
            <span>{user.prenom}</span>
            <div
              className={`ml-auto fr-fi-arrow-down-s-line ${
                isProfileOpen && 'rotate-180'
              }`}
            />
          </button>
          <div className={`${isProfileOpen ? 'block' : 'hidden'} pb-6`}>
            {/* En attente de la page "Profil" */}
            {/* <NavLink
              className="block py-3 px-8"
              activeClassName="border-l-4 border-bf500 text-bf500 font-bold"
              to={profilePath}
              onClick={toggleMobileNavigation}
            >
              Profil
            </NavLink> */}
            <div className="py-3 px-8">
              <LogoutBtn
                auth={auth}
                additionalOnClick={toggleMobileNavigation}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <Link
            data-test="signup"
            className="fr-link block w-full !p-4"
            to={signUpPath}
            onClick={toggleMobileNavigation}
          >
            <div className="fr-fi-add-line mr-2" />
            Créer un compte
          </Link>
          <Link
            data-test="signin"
            className="fr-link block w-full !p-4"
            to={signInPath}
            onClick={toggleMobileNavigation}
          >
            <div className="fr-fi-account-line mr-2" />
            Se connecter
          </Link>
        </>
      )}
    </>
  );
};

export default MobileHeaderNavigation;
