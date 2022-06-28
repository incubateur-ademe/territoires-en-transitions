import {User} from '@supabase/supabase-js';
import {signInPath, signUpPath} from 'app/paths';
import {authBloc} from 'core-logic/observables';
import {useState} from 'react';
import {Link, NavLink} from 'react-router-dom';
import {LogoutBtn} from '../../HeaderNavigation/HeaderNavigation';

const profilePath = '#';

type Props = {
  isConnected: boolean;
  user: User | null;
  toggleMobileNavigation: () => void;
};

const MobileHeaderNavigation = ({
  isConnected,
  user,
  toggleMobileNavigation,
}: Props) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const toggleIsProfileOpen = () => setIsProfileOpen(!isProfileOpen);
  return (
    <>
      {isConnected && user ? (
        <div>
          <button className="fr-link w-full !p-4" onClick={toggleIsProfileOpen}>
            <div className="fr-fi-account-line mr-2" />
            <span>{user.email}</span>
            <div
              className={`ml-auto fr-fi-arrow-down-s-line ${
                isProfileOpen && 'rotate-180'
              }`}
            />
          </button>
          <div className={`${isProfileOpen ? 'block' : 'hidden'} pb-8`}>
            <NavLink
              className="block py-3 px-8"
              activeClassName="border-l-4 border-bf500 text-bf500 font-bold"
              to={profilePath}
              onClick={toggleMobileNavigation}
            >
              Profil
            </NavLink>
            <div className="py-3 px-8">
              <LogoutBtn
                bloc={authBloc}
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
