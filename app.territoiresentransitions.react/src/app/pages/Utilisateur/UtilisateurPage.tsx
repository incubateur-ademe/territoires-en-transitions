import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const Utilisateur = lazy(() => import('app/pages/Utilisateur/Utilisateur'));

export const UtilisateurPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Utilisateur />
    </Suspense>
  );
};
