import {Link, useHistory} from 'react-router-dom';
import {signUpPath} from 'app/paths';
import {TAuthContext} from 'core-logic/api/auth/AuthProvider';

export const LogoutBtn = ({
  auth,
  additionalOnClick,
}: {
  auth: TAuthContext;
  additionalOnClick?: () => void;
}) => {
  const history = useHistory();
  return (
    <Link
      className="fr-nav__link"
      data-test="logoutBtn"
      to={signUpPath}
      onClick={() => {
        auth.disconnect().then(() => history.push('/'));
        {
          additionalOnClick && additionalOnClick();
        }
      }}
    >
      <span className="px-3">Déconnexion</span>
    </Link>
  );
};
