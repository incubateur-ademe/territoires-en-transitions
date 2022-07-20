import {signUpPath, signInPath} from 'app/paths';
import {Link} from 'react-router-dom';

export const RegisterLink = () => (
  <Link to={signUpPath}>
    <button className="fr-btn fr-btn--secondary">Créer un compte</button>
  </Link>
);

export const SignInLink = () => (
  <Link className="fr-btn text-center" to={signInPath}>
    Se connecter
  </Link>
);
