import {authBloc, AuthBloc} from 'core-logic/observables';
import {observer} from 'mobx-react-lite';
import {Link} from 'react-router-dom';
import {signInPath, signUpPath} from 'app/paths';

export const LogoutBtn = observer(
  ({
    bloc,
    additionalOnClick,
  }: {
    bloc: AuthBloc;
    additionalOnClick?: () => void;
  }) => (
    <Link
      className="fr-nav__link"
      data-test="logoutBtn"
      to={signUpPath}
      onClick={() => {
        bloc.disconnect();
        {
          additionalOnClick && additionalOnClick();
        }
      }}
    >
      <span className="px-3">Déconnexion</span>
    </Link>
  )
);

/** FAKE DATA -> TODO: Replace with hook */
const profilePath = '#';
/** END FAKE DATA */

type Props = {
  isConnected: boolean;
  user: any; //TODO: Type user
};

const HeaderNavigation = ({isConnected, user}: Props) => {
  return (
    <div className="fr-header__tools hidden lg:block">
      <div className="fr-header__tools-links">
        <ul className="fr-links-group">
          <a
            data-test="help"
            className="fr-link"
            href="https://aide.territoiresentransitions.fr/fr/"
          >
            <div className="fr-fi-question-line mr-2" />
            Aide
          </a>
          {isConnected ? (
            <div className="group relative">
              <button className="fr-link">
                <div className="fr-fi-account-line mr-2" />
                {user.name}
                <div className="fr-fi-arrow-down-s-line ml-2" />
              </button>
              <nav className="bg-white invisible absolute inset-x-0 top-full transition-all opacity-0 drop-shadow-md group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-1 z-50">
                <ul>
                  <li className="fr-nav__item border-b border-gray-200">
                    <Link className="fr-nav__link" to={profilePath}>
                      <span className="px-3">Profil</span>
                    </Link>
                  </li>
                  <li className="fr-nav__item">
                    <LogoutBtn bloc={authBloc} />
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
