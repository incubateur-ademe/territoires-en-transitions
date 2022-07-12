import {useRouteMatch} from 'react-router-dom';
import {recoverLandingPath, recoverToken} from 'app/paths';

// détecte un jeton de récupération du mot de passe (extrait d'un lien renvoyé par mail)
export const useRecoveryToken = (): string | null => {
  const match = useRouteMatch<{[recoverToken]: string}>(recoverLandingPath);
  return match?.params?.[recoverToken] || null;
};
