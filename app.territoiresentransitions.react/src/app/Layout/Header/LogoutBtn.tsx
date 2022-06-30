import {Link} from 'react-router-dom';
import {signUpPath} from 'app/paths';
import {TAuthContext} from 'core-logic/api/auth/AuthProvider';

export const LogoutBtn = ({
  auth,
  additionalOnClick,
}: {
  auth: TAuthContext;
  additionalOnClick?: () => void;
}) => (
  <Link
    className="fr-nav__link"
    data-test="logoutBtn"
    to={signUpPath}
    onClick={() => {
      auth.disconnect();
      {
        additionalOnClick && additionalOnClick();
      }
    }}
  >
    <span className="px-3">Déconnexion</span>
  </Link>
);
