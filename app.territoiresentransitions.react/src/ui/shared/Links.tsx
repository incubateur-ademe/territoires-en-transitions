import {signUpPath, signInPath} from 'app/paths';

export const RegisterLink = () => (
  <a href={signUpPath}>
    <button className="fr-btn fr-btn--secondary">Créer un compte</button>
  </a>
);

export const SignInLink = () => (
  <a className="fr-btn text-center" href={signInPath}>
    Se connecter
  </a>
);
