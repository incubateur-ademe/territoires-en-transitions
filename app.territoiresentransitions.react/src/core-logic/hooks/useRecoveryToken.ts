import {useRouteMatch} from 'react-router-dom';
import {recoverLandingPath, recoverToken} from 'app/paths';

export const useRecoveryToken = (): string | null => {
  const match = useRouteMatch<{[recoverToken]: string}>(recoverLandingPath);
  return match?.params?.[recoverToken] || null;
};
