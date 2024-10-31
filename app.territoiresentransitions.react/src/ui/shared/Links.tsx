import { signUpPath, signInPath } from 'app/paths';
import Link from 'next/link';

export const RegisterLink = () => (
  <Link href={signUpPath}>
    <button className="fr-btn fr-btn--secondary">Créer un compte</button>
  </Link>
);

export const SignInLink = () => (
  <Link className="fr-btn text-center" href={signInPath}>
    Se connecter
  </Link>
);
