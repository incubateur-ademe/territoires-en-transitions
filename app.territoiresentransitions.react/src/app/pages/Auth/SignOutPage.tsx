import {signOutRedirect} from 'core-logic/api/authRedirect';

export const SignOutPage = () => {
  signOutRedirect();
  return <h1 className="fr-h1">Redirection vers moncompte.ademe.fr</h1>;
};
